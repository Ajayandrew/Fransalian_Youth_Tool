const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const User = require('../models/User');

const generateToken = (user) => {
  const name = user.fullName || user.role || 'Office Bearer';
  return jwt.sign(
    { id: user._id, fullName: name, email: user.email, role: user.role, bloodGroup: user.bloodGroup || 'O+' },
    process.env.JWT_SECRET || 'francisalian_youth_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

const resolveUserPhoto = async (userObj) => {
  if (!userObj) return '';
  if (userObj.avatar && userObj.avatar.trim()) return userObj.avatar;
  if (userObj.photo && userObj.photo.trim()) return userObj.photo;

  let mMatch = null;
  if (getIsInMemory()) {
    mMatch = memoryStore.members.find(m =>
      (userObj.email && m.email && m.email.toLowerCase() === userObj.email.toLowerCase()) ||
      (userObj.role && m.role && m.role.toLowerCase() === userObj.role.toLowerCase())
    );
  } else {
    const Member = require('../models/Member');
    try {
      mMatch = await Member.findOne({
        $or: [
          { email: userObj.email?.toLowerCase() },
          { role: { $regex: new RegExp(`^${(userObj.role || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
        ]
      }).lean();
    } catch (e) {}
  }

  if (mMatch && mMatch.photo) {
    return mMatch.photo;
  }

  if (userObj.role === 'Parish Priest') {
    let currentSettings = memoryStore.settings;
    if (!getIsInMemory()) {
      try {
        const Settings = require('../models/Settings');
        const dbSet = await Settings.findById('org_settings').lean();
        if (dbSet) currentSettings = dbSet;
      } catch (e) {}
    }
    if (currentSettings && currentSettings.parishPriestPhoto) {
      return currentSettings.parishPriestPhoto;
    }
  }

  return '';
};

const login = async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    if (!rawEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and Password are required.' });
    }

    const cleanInput = rawEmail.trim().toLowerCase();
    let user = null;

    // 1. Look up User account first (where updated custom passwords are saved)
    if (getIsInMemory()) {
      user = memoryStore.users.find(
        u => (u.email && u.email.toLowerCase() === cleanInput) ||
             (u.role && u.role.toLowerCase() === cleanInput)
      );
    } else {
      user = await User.findOne({
        $or: [
          { email: cleanInput },
          { role: { $regex: new RegExp(`^${cleanInput.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
        ]
      });
    }

    // 2. If not found in User collection, check Member table
    if (!user) {
      let memberMatch = null;
      if (getIsInMemory()) {
        memberMatch = memoryStore.members.find(
          m => (m.email && m.email.toLowerCase() === cleanInput) ||
               (m.role && m.role.toLowerCase() === cleanInput)
        );
      } else {
        const Member = require('../models/Member');
        memberMatch = await Member.findOne({
          $or: [
            { email: cleanInput },
            { role: { $regex: new RegExp(`^${cleanInput.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
          ]
        });
      }

      if (memberMatch) {
        user = {
          _id: memberMatch._id,
          fullName: memberMatch.fullName,
          email: memberMatch.email || `${memberMatch.role.toLowerCase().replace(/\s+/g, '')}@church.org`,
          role: memberMatch.role || 'Youth Member',
          avatar: memberMatch.photo || '',
          bloodGroup: memberMatch.bloodGroup || 'O+',
          password: memberMatch.password || bcrypt.hashSync('Admin@123', 10)
        };
      }
    }

    // 3. Fallback to memoryStore default users if not found in DB collections
    if (!user) {
      const memoryMatch = memoryStore.users.find(
        u => (u.email && u.email.toLowerCase() === cleanInput) ||
             (u.role && u.role.toLowerCase() === cleanInput) ||
             (cleanInput.includes('priest') && u.role === 'Parish Priest') ||
             (cleanInput.includes('pastor') && u.role === 'Parish Priest')
      );

      if (memoryMatch) {
        user = { ...memoryMatch };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const userPasswordHash = (user.password && user.password.startsWith('$2'))
      ? user.password
      : bcrypt.hashSync(user.password || 'Admin@123', 10);

    const isMatch = bcrypt.compareSync(password, userPasswordHash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Derive exact office bearer role from input or record
    let derivedRole = user.role;
    const lowEmail = (user.email || '').toLowerCase();

    if (cleanInput.includes('treasurer') || lowEmail.includes('treasurer')) {
      derivedRole = 'Treasurer';
    } else if (cleanInput.includes('leader') || lowEmail.includes('leader')) {
      derivedRole = 'Youth Leader';
    } else if (cleanInput.includes('secretary') || lowEmail.includes('secretary')) {
      derivedRole = 'Secretary';
    } else if (cleanInput.includes('priest') || cleanInput.includes('pastor') || lowEmail.includes('priest') || lowEmail.includes('pastor')) {
      derivedRole = 'Parish Priest';
    } else if (cleanInput.includes('admin') || lowEmail.includes('admin')) {
      derivedRole = 'Admin';
    } else if (!derivedRole || derivedRole === 'undefined') {
      derivedRole = 'Youth Member';
    }
    user.role = derivedRole;

    // Ensure fullName is never undefined
    let resolvedName = user.fullName;
    if (!resolvedName || resolvedName === 'undefined' || resolvedName.trim() === '' || resolvedName === user.role) {
      let mMatch = null;
      if (getIsInMemory()) {
        mMatch = memoryStore.members.find(
          m => (m.email && m.email.toLowerCase() === user.email?.toLowerCase()) ||
               (m.role && m.role.toLowerCase() === user.role?.toLowerCase())
        );
      } else {
        const Member = require('../models/Member');
        mMatch = await Member.findOne({
          $or: [
            { email: user.email?.toLowerCase() },
            { role: { $regex: new RegExp(`^${(user.role || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
          ]
        });
      }
      resolvedName = mMatch?.fullName || user.role || 'Office Bearer';
    }

    if (user.role === 'Parish Priest') {
      const Settings = require('../models/Settings');
      let currentSettings = memoryStore.settings;
      if (!getIsInMemory()) {
        try {
          const dbSet = await Settings.findById('org_settings');
          if (dbSet) currentSettings = dbSet;
        } catch (e) {}
      }
      if (currentSettings && currentSettings.parishPriestName && currentSettings.parishPriestName.trim()) {
        resolvedName = currentSettings.parishPriestName.trim();
      }
    }

    user.fullName = resolvedName;
    const resolvedPhoto = await resolveUserPhoto(user);

    // Persist/Sync User record with correct role in database
    if (!getIsInMemory()) {
      try {
        await User.findOneAndUpdate(
          { $or: [{ email: user.email.toLowerCase() }, { role: user.role }] },
          {
            $set: {
              fullName: user.fullName,
              email: user.email.toLowerCase(),
              role: user.role,
              password: user.password,
              avatar: resolvedPhoto || user.avatar || '',
              bloodGroup: user.bloodGroup || 'O+'
            }
          },
          { upsert: true }
        );
      } catch (e) {}
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: resolvedPhoto || user.avatar || '',
        photo: resolvedPhoto || user.avatar || '',
        bloodGroup: user.bloodGroup || 'O+'
      },
      message: `Welcome back, ${user.fullName}!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = null;
    if (getIsInMemory()) {
      user = memoryStore.users.find(u => u._id === userId) || memoryStore.users[0];
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let resolvedName = user.fullName || req.user?.fullName || user.role || 'Office Bearer';

    if (user.role === 'Parish Priest') {
      const Settings = require('../models/Settings');
      let currentSettings = memoryStore.settings;
      if (!getIsInMemory()) {
        try {
          const dbSet = await Settings.findById('org_settings');
          if (dbSet) currentSettings = dbSet;
        } catch (e) {}
      }
      if (currentSettings && currentSettings.parishPriestName && currentSettings.parishPriestName.trim()) {
        resolvedName = currentSettings.parishPriestName.trim();
      }
    }

    const resolvedPhoto = await resolveUserPhoto(user);

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: resolvedName,
        email: user.email,
        role: user.role,
        avatar: resolvedPhoto || user.avatar || '',
        photo: resolvedPhoto || user.avatar || '',
        bloodGroup: user.bloodGroup || 'O+'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { email, newPassword, fullName, bloodGroup } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const currentEmail = req.user?.email;

    if (userRole === 'Youth Member') {
      return res.status(403).json({
        success: false,
        message: 'Youth members are not allowed to change credentials. Please contact a Youth Leader or Administrator.'
      });
    }

    if (!email && !newPassword && !fullName && !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    const updates = {};
    if (email) updates.email = email.trim().toLowerCase();
    if (fullName) updates.fullName = fullName.trim();
    if (bloodGroup) updates.bloodGroup = bloodGroup.trim();
    if (newPassword) updates.password = bcrypt.hashSync(newPassword, 10);

    let updatedUser = null;

    if (getIsInMemory()) {
      let idx = memoryStore.users.findIndex(u =>
        (userId && u._id === userId) ||
        (currentEmail && u.email && u.email.toLowerCase() === currentEmail.toLowerCase()) ||
        (userRole && u.role && u.role.toLowerCase() === userRole.toLowerCase())
      );

      if (idx !== -1) {
        memoryStore.users[idx] = { ...memoryStore.users[idx], ...updates };
        updatedUser = memoryStore.users[idx];
      } else {
        // Upsert user account in memoryStore.users
        const newUser = {
          _id: userId || 'usr_' + Date.now(),
          fullName: req.user?.fullName || userRole || 'Office Bearer',
          email: (email || currentEmail || `${(userRole || 'user').toLowerCase().replace(/\s+/g, '')}@church.org`).toLowerCase(),
          role: userRole || 'Youth Member',
          password: updates.password || bcrypt.hashSync('Admin@123', 10),
          avatar: req.user?.avatar || '',
          bloodGroup: req.user?.bloodGroup || 'O+',
          ...updates
        };
        memoryStore.users.push(newUser);
        updatedUser = newUser;
      }

      // Also update in memoryStore.members
      let memIdx = memoryStore.members.findIndex(m =>
        (userId && m._id === userId) ||
        (currentEmail && m.email && m.email.toLowerCase() === currentEmail.toLowerCase()) ||
        (userRole && m.role && m.role.toLowerCase() === userRole.toLowerCase())
      );
      if (memIdx !== -1) {
        if (email) memoryStore.members[memIdx].email = email.trim().toLowerCase();
        if (fullName) memoryStore.members[memIdx].fullName = fullName.trim();
        if (bloodGroup) memoryStore.members[memIdx].bloodGroup = bloodGroup.trim();
        if (newPassword) memoryStore.members[memIdx].password = updates.password;
      }
    } else {
      const matchCriteria = [];
      if (userId) matchCriteria.push({ _id: userId });
      if (currentEmail) matchCriteria.push({ email: currentEmail.toLowerCase() });
      if (userRole) matchCriteria.push({ role: userRole });

      updatedUser = await User.findOneAndUpdate(
        { $or: matchCriteria },
        { $set: updates },
        { new: true, upsert: true }
      );

      const Member = require('../models/Member');
      const memberUpdates = {};
      if (email) memberUpdates.email = email.trim().toLowerCase();
      if (fullName) memberUpdates.fullName = fullName.trim();
      if (bloodGroup) memberUpdates.bloodGroup = bloodGroup.trim();
      if (newPassword) memberUpdates.password = updates.password;

      if (Object.keys(memberUpdates).length > 0) {
        await Member.updateMany(
          { $or: matchCriteria },
          { $set: memberUpdates }
        );
      }
    }
    savePersistentStore();

    return res.json({
      success: true,
      user: {
        id: updatedUser ? updatedUser._id : userId,
        fullName: (updatedUser && updatedUser.fullName) || fullName || req.user?.fullName || 'User',
        email: (updatedUser && updatedUser.email) || email || req.user?.email,
        role: (updatedUser && updatedUser.role) || userRole,
        avatar: updatedUser ? updatedUser.avatar : '',
        bloodGroup: (updatedUser && updatedUser.bloodGroup) || bloodGroup || req.user?.bloodGroup || 'O+'
      },
      message: 'Profile updated successfully!'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    if (req.user?.role === 'Youth Member') {
      return res.status(403).json({
        success: false,
        message: 'Youth members are not allowed to change credentials. Please contact a Youth Leader or Administrator.'
      });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New Password is required.' });
    }

    const userId = req.user?.id;
    const newHash = bcrypt.hashSync(newPassword, 10);

    if (getIsInMemory()) {
      const idx = memoryStore.users.findIndex(u => u._id === userId);
      if (idx !== -1) {
        memoryStore.users[idx].password = newHash;
      }
    } else {
      await User.findByIdAndUpdate(userId, { password: newHash });
    }

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, me, changePassword, updateProfile };
