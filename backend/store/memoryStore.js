const bcrypt = require('bcryptjs');

const defaultPasswordHash = bcrypt.hashSync('Admin@123', 10);

const memoryStore = {
  users: [
    {
      _id: 'usr_admin',
      fullName: 'Father / Super Admin',
      email: 'admin@church.org',
      password: defaultPasswordHash,
      role: 'Admin',
      avatar: '',
      bloodGroup: 'O+',
      activeStatus: true,
      createdAt: new Date()
    },
    {
      _id: 'usr_leader',
      fullName: 'Youth Leader',
      email: 'leader@church.org',
      password: defaultPasswordHash,
      role: 'Youth Leader',
      avatar: '',
      bloodGroup: 'O+',
      activeStatus: true,
      createdAt: new Date()
    },
    {
      _id: 'usr_treasurer',
      fullName: 'Treasurer',
      email: 'treasurer@church.org',
      password: defaultPasswordHash,
      role: 'Treasurer',
      avatar: '',
      bloodGroup: 'O+',
      activeStatus: true,
      createdAt: new Date()
    },
    {
      _id: 'usr_secretary',
      fullName: 'Secretary',
      email: 'secretary@church.org',
      password: defaultPasswordHash,
      role: 'Secretary',
      avatar: '',
      bloodGroup: 'O+',
      activeStatus: true,
      createdAt: new Date()
    }
  ],

  members: [],
  subscriptions: [],
  income: [],
  expense: [],
  secretOfferings: [],
  attendance: [],
  events: [],
  albums: [],

  settings: {
    churchName: 'Cathedral Parish',
    youthName: 'Francisalian Youth Movement',
    churchLogo: '',
    subscriptionAmount: 50,
    darkMode: false
  }
};

module.exports = memoryStore;
