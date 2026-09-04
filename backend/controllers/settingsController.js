const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { uploadToCloudinary } = require('../config/cloudinary');

const Settings = require('../models/Settings');

const defaultSettings = {
  _id: 'org_settings',
  churchName: 'St. Mary Cathedral Parish',
  youthName: 'Francisalian Youth Movement',
  address: '12 Cathedral Road',
  city: 'Chennai',
  district: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600004',
  contactEmail: 'youth@church.org',
  contactPhone: '+91 98765 43210',
  churchLogo: '',
  parishPriestName: 'Rev. Fr. Parish Priest',
  parishPriestPhoto: '',
  parishPriestPhone: '',
  parishPriestTitle: 'Parish Priest / Spiritual Director',
  patronPhoto: '',
  subscriptionAmount: 50,
  darkMode: false,
  youtubeUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  anbiyams: ['St. Francis Xavier Anbiyam', 'St. Antony Anbiyam', 'Mother Teresa Anbiyam', 'St. Jude Anbiyam']
};

const getSettings = async (req, res) => {
  try {
    let settings = null;
    if (getIsInMemory()) {
      settings = memoryStore.settings || defaultSettings;
    } else {
      settings = await Settings.findById('org_settings');
      if (!settings) {
        settings = await Settings.create(defaultSettings);
      }
      memoryStore.settings = settings.toObject();
    }
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;

    const fileList = req.files && Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);

    if (typeof data.anbiyams === 'string') {
      data.anbiyams = data.anbiyams.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (data.subscriptionAmount !== undefined) {
      data.subscriptionAmount = Number(data.subscriptionAmount) || 50;
    }

    for (const f of fileList) {
      const photoUrl = f.dataUrl || `/uploads/${f.filename}`;
      const name = (f.fieldname || '').toLowerCase();
      if (name.includes('priest')) {
        data.parishPriestPhoto = photoUrl;
      } else if (name.includes('logo')) {
        data.churchLogo = photoUrl;
      } else if (name.includes('patron') || name.includes('mary')) {
        data.patronPhoto = photoUrl;
      } else if (f.fieldname === 'parishPriestPhoto') {
        data.parishPriestPhoto = photoUrl;
      } else if (f.fieldname === 'churchLogo') {
        data.churchLogo = photoUrl;
      } else if (f.fieldname === 'patronPhoto') {
        data.patronPhoto = photoUrl;
      }
    }

    let updated = null;
    if (getIsInMemory()) {
      memoryStore.settings = { ...defaultSettings, ...memoryStore.settings, ...data };
      updated = memoryStore.settings;
    } else {
      updated = await Settings.findByIdAndUpdate('org_settings', { $set: data }, { new: true, upsert: true });
      memoryStore.settings = updated.toObject();
    }
    const { savePersistentStore } = require('../store/persistentStore');
    savePersistentStore();

    return res.json({ success: true, settings: updated, message: 'Organization Settings updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetData = async (req, res) => {
  try {
    // 1. Wipe in-memory store data
    memoryStore.members = [];
    memoryStore.subscriptions = [];
    memoryStore.income = [];
    memoryStore.expense = [];
    memoryStore.secretOfferings = [];
    memoryStore.attendance = [];
    memoryStore.events = [];
    memoryStore.albums = [];

    // 2. If MongoDB is connected, wipe collection records
    if (!getIsInMemory()) {
      const Member = require('../models/Member');
      const Subscription = require('../models/Subscription');
      const { Income, Expense } = require('../models/Finance');
      const Event = require('../models/Event');
      const Attendance = require('../models/Attendance');
      const Gallery = require('../models/Gallery');
      const User = require('../models/User');

      await Promise.all([
        Member.deleteMany({}),
        Subscription.deleteMany({}),
        Income.deleteMany({}),
        Expense.deleteMany({}),
        Event.deleteMany({}),
        Attendance.deleteMany({}),
        Gallery.deleteMany({}),
        User.deleteMany({ role: { $ne: 'Admin' } })
      ]);
    }

    return res.json({
      success: true,
      message: 'All stored youth members, subscription dues, accounts ledger, events, gallery, and attendance records deleted cleanly.'
    });
  } catch (error) {
    console.error('Error resetting stored data:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addAnbiyam = async (req, res) => {
  try {
    const { anbiyamName } = req.body;
    if (!anbiyamName || !anbiyamName.trim()) {
      return res.status(400).json({ success: false, message: 'Anbiyam Name is required.' });
    }
    const cleanName = anbiyamName.trim();

    let settingsObj = memoryStore.settings || defaultSettings;
    let currentAnbiyams = Array.isArray(settingsObj.anbiyams) ? [...settingsObj.anbiyams] : ['St. Francis Xavier Anbiyam', 'St. Antony Anbiyam', 'Mother Teresa Anbiyam', 'St. Jude Anbiyam'];

    if (!currentAnbiyams.some(a => a.toLowerCase() === cleanName.toLowerCase())) {
      currentAnbiyams.push(cleanName);
    }

    if (getIsInMemory()) {
      memoryStore.settings = { ...settingsObj, anbiyams: currentAnbiyams };
    } else {
      const updated = await Settings.findByIdAndUpdate(
        'org_settings',
        { $set: { anbiyams: currentAnbiyams } },
        { new: true, upsert: true }
      );
      memoryStore.settings = updated.toObject();
    }

    return res.json({ success: true, anbiyams: currentAnbiyams, message: `Anbiyam "${cleanName}" added successfully!` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const testSMS = async (req, res) => {
  try {
    const { phone } = req.body;
    const { sendTestSMS } = require('../services/smsService');
    const result = await sendTestSMS(phone);

    if (result.success) {
      return res.json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error testing SMS gateway:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings, resetData, addAnbiyam, testSMS };

