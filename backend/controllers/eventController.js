const { getIsInMemory } = require('../config/db');
const memoryStore = require('../store/memoryStore');
const { savePersistentStore } = require('../store/persistentStore');
const Event = require('../models/Event');

const getEvents = async (req, res) => {
  try {
    let list = [];
    if (getIsInMemory()) {
      list = memoryStore.events || [];
    } else {
      list = await Event.find({});
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = list.filter(e => e.date >= todayStr || e.status === 'Upcoming');
    const completed = list.filter(e => e.date < todayStr || e.status === 'Completed');

    return res.json({ success: true, count: list.length, events: list, upcoming, completed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const data = req.body;
    if (!data.eventName || !data.date) {
      return res.status(400).json({ success: false, message: 'Event Name and Date are required.' });
    }

    if (req.file) {
      data.bannerImage = req.file.dataUrl || `/uploads/${req.file.filename}`;
    }

    let newEvent = null;
    if (getIsInMemory()) {
      newEvent = { _id: 'evt_' + Date.now(), ...data, createdAt: new Date() };
      memoryStore.events.unshift(newEvent);
    } else {
      newEvent = await Event.create(data);
    }
    savePersistentStore();

    return res.status(201).json({ success: true, event: newEvent, message: 'Event created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (req.file) {
      data.bannerImage = req.file.dataUrl || `/uploads/${req.file.filename}`;
    }

    let updated = null;
    if (getIsInMemory()) {
      const idx = (memoryStore.events || []).findIndex(e => e._id === id);
      if (idx !== -1) {
        memoryStore.events[idx] = { ...memoryStore.events[idx], ...data };
        updated = memoryStore.events[idx];
      }
    } else {
      updated = await Event.findByIdAndUpdate(id, data, { new: true });
    }
    savePersistentStore();

    return res.json({ success: true, event: updated, message: 'Event updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsInMemory()) {
      memoryStore.events = memoryStore.events.filter(e => e._id !== id);
    } else {
      await Event.findByIdAndDelete(id);
    }
    savePersistentStore();

    return res.json({ success: true, message: 'Event removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
