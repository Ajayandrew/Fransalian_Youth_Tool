const fs = require('fs');
const path = require('path');
const memoryStore = require('./memoryStore');

const dataDir = path.join(__dirname, '../data');
const dataFilePath = path.join(dataDir, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {}
}

const loadPersistentStore = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const rawData = fs.readFileSync(dataFilePath, 'utf8');
      const parsedData = JSON.parse(rawData);

      if (parsedData) {
        if (Array.isArray(parsedData.users) && parsedData.users.length > 0) {
          memoryStore.users = parsedData.users;
        }
        if (Array.isArray(parsedData.members)) {
          memoryStore.members = parsedData.members;
        }
        if (Array.isArray(parsedData.subscriptions)) {
          memoryStore.subscriptions = parsedData.subscriptions;
        }
        if (Array.isArray(parsedData.income)) {
          memoryStore.income = parsedData.income;
        }
        if (Array.isArray(parsedData.expense)) {
          memoryStore.expense = parsedData.expense;
        }
        if (Array.isArray(parsedData.secretOfferings)) {
          memoryStore.secretOfferings = parsedData.secretOfferings;
        }
        if (Array.isArray(parsedData.attendance)) {
          memoryStore.attendance = parsedData.attendance;
        }
        if (Array.isArray(parsedData.events)) {
          memoryStore.events = parsedData.events;
        }
        if (Array.isArray(parsedData.albums)) {
          memoryStore.albums = parsedData.albums;
        }
        if (parsedData.settings) {
          memoryStore.settings = { ...memoryStore.settings, ...parsedData.settings };
        }
        console.log('[Store] Persistent data loaded successfully from store.json!');
      }
    }
  } catch (err) {
    console.warn(`[Store Warning] Could not load persistent store: ${err.message}`);
  }
};

const savePersistentStore = () => {
  try {
    const dataToSave = {
      users: memoryStore.users || [],
      members: memoryStore.members || [],
      subscriptions: memoryStore.subscriptions || [],
      income: memoryStore.income || [],
      expense: memoryStore.expense || [],
      secretOfferings: memoryStore.secretOfferings || [],
      attendance: memoryStore.attendance || [],
      events: memoryStore.events || [],
      albums: memoryStore.albums || [],
      settings: memoryStore.settings || {}
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
  } catch (err) {
    console.error(`[Store Error] Failed to save persistent store: ${err.message}`);
  }
};

// Initial load on module require
loadPersistentStore();

module.exports = {
  loadPersistentStore,
  savePersistentStore
};
