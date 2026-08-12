const fs = require('fs');
const path = require('path');
const memoryStore = require('./memoryStore');

const dataDir = path.join(__dirname, '../data');
const backupsDir = path.join(dataDir, 'backups');
const dataFilePath = path.join(dataDir, 'store.json');
const backupFilePath = path.join(dataDir, 'store.json.bak');
const tempFilePath = path.join(dataDir, 'store.json.tmp');

// Ensure data and backup directories exist
[dataDir, backupsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
});

const loadPersistentStore = () => {
  let fileToRead = null;

  if (fs.existsSync(dataFilePath)) {
    fileToRead = dataFilePath;
  } else if (fs.existsSync(backupFilePath)) {
    console.warn('[Store Warning] Primary store.json missing. Recovering from store.json.bak backup!');
    fileToRead = backupFilePath;
  }

  if (!fileToRead) return;

  try {
    const rawData = fs.readFileSync(fileToRead, 'utf8');
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
      console.log(`[Store Data Safety] Persistent store loaded successfully from ${path.basename(fileToRead)}!`);
    }
  } catch (err) {
    console.error(`[Store Error] Failed to parse primary store file: ${err.message}`);
    // Fallback attempt to backup if primary was corrupt
    if (fileToRead === dataFilePath && fs.existsSync(backupFilePath)) {
      try {
        console.warn('[Store Recovery] Attempting emergency fallback read from store.json.bak...');
        const rawBak = fs.readFileSync(backupFilePath, 'utf8');
        const parsedBak = JSON.parse(rawBak);
        if (parsedBak) {
          if (Array.isArray(parsedBak.members)) memoryStore.members = parsedBak.members;
          if (Array.isArray(parsedBak.subscriptions)) memoryStore.subscriptions = parsedBak.subscriptions;
          if (Array.isArray(parsedBak.income)) memoryStore.income = parsedBak.income;
          if (Array.isArray(parsedBak.expense)) memoryStore.expense = parsedBak.expense;
          console.log('[Store Recovery] Emergency data restoration succeeded from backup!');
        }
      } catch (backupErr) {
        console.error(`[Store Error] Backup restoration failed: ${backupErr.message}`);
      }
    }
  }
};

const savePersistentStore = () => {
  try {
    const dataToSave = {
      timestamp: new Date().toISOString(),
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

    const jsonString = JSON.stringify(dataToSave, null, 2);

    // 1. Create safety backup copy of existing file before overwrite
    if (fs.existsSync(dataFilePath)) {
      try {
        fs.copyFileSync(dataFilePath, backupFilePath);
      } catch (e) {}
    }

    // 2. Atomic write pattern: Write to temp file first, then atomically rename
    fs.writeFileSync(tempFilePath, jsonString, 'utf8');
    fs.renameSync(tempFilePath, dataFilePath);

  } catch (err) {
    console.error(`[Store Error] Atomic save failed: ${err.message}`);
  }
};

// Create a daily snapshot backup for data recovery safety
const createDailyBackupSnapshot = () => {
  try {
    if (!fs.existsSync(dataFilePath)) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const snapshotPath = path.join(backupsDir, `store-backup-${dateStr}.json`);
    if (!fs.existsSync(snapshotPath)) {
      fs.copyFileSync(dataFilePath, snapshotPath);
      console.log(`[Store Data Safety] Daily automated backup snapshot created: ${path.basename(snapshotPath)}`);
    }
  } catch (err) {
    console.warn(`[Store Warning] Automated backup creation error: ${err.message}`);
  }
};

// Initial load on startup
loadPersistentStore();
createDailyBackupSnapshot();

// Schedule daily backup check every 6 hours
setInterval(createDailyBackupSnapshot, 6 * 60 * 60 * 1000);

module.exports = {
  loadPersistentStore,
  savePersistentStore,
  createDailyBackupSnapshot
};
