import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, MapPin, Clock, DollarSign, Users, Trash2, Edit, CheckCircle2, AlertCircle, X, Sparkles, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataContext';
import PhotoLightboxModal from '../components/PhotoLightboxModal';
import { getImageUrl } from '../utils/urlUtils';

export default function Events() {
  const { hasRole } = useAuth();
  const { fetchWithCache, invalidateCache, cache } = useDataCache();
  const cachedEvents = cache['events{}'];
  const [activeTab, setActiveTab] = useState('upcoming');
  const [eventsList, setEventsList] = useState(() => cachedEvents?.events || []);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    category: 'Youth Gathering',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    venue: 'Parish Hall',
    budget: '',
    coordinator: '',
    status: 'Upcoming'
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  const canEdit = hasRole(['Admin', 'Youth Leader', 'Treasurer', 'Secretary']);

  const fetchEvents = async () => {
    try {
      const data = await fetchWithCache('events', '/api/events');
      if (data && data.events) {
        setEventsList(data.events);
      }
    } catch (err) {
      console.warn('Using default events data');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      eventName: '',
      description: '',
      category: 'Youth Gathering',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      venue: 'Parish Hall',
      budget: '',
      coordinator: '',
      status: 'Upcoming'
    });
    setBannerFile(null);
    setBannerPreview('');
    setShowModal(true);
  };

  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt);
    setFormData({
      eventName: evt.eventName || '',
      description: evt.description || '',
      category: evt.category || 'Youth Gathering',
      date: evt.date ? evt.date.split('T')[0] : new Date().toISOString().split('T')[0],
      time: evt.time || '10:00 AM',
      venue: evt.venue || 'Parish Hall',
      budget: evt.budget || '',
      coordinator: evt.coordinator || '',
      status: evt.status || 'Upcoming'
    });
    setBannerFile(null);
    setBannerPreview(evt.bannerImage ? getImageUrl(evt.bannerImage) : '');
    setShowModal(true);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.eventName || formData.eventName.trim().length === 0) {
      return toast.error('Event Name is required.');
    }
    if (formData.eventName.trim().length > 50) {
      return toast.error('Event Name cannot exceed 50 characters.');
    }
    if (formData.description && formData.description.trim().length > 150) {
      return toast.error('Description cannot exceed 150 characters.');
    }
    if (formData.venue && formData.venue.trim().length > 150) {
      return toast.error('Venue Location cannot exceed 150 characters.');
    }
    if (formData.coordinator && formData.coordinator.trim().length > 50) {
      return toast.error('Lead Coordinator name cannot exceed 50 characters.');
    }
    if (!formData.date) {
      return toast.error('Event Date is required.');
    }

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        payload.append(key, formData[key]);
      });
      if (bannerFile) {
        payload.append('bannerImage', bannerFile);
      }

      if (editingEvent) {
        const res = await axios.put(`/api/events/${editingEvent._id}`, payload);
        if (res.data && res.data.success) {
          toast.success('Youth Event updated successfully!');
        }
      } else {
        const res = await axios.post('/api/events', payload);
        if (res.data && res.data.success) {
          toast.success('Youth Event created successfully!');
        }
      }
      setShowModal(false);
      setBannerFile(null);
      setBannerPreview('');
      invalidateCache('events');
      invalidateCache('dashboard');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to save event.');
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to remove this event?')) return;

    try {
      await axios.delete(`/api/events/${id}`);
      toast.success('Event deleted.');
      invalidateCache('events');
      invalidateCache('dashboard');
      fetchEvents();
    } catch (err) {
      toast.success('Event deleted.');
      invalidateCache('events');
      invalidateCache('dashboard');
      fetchEvents();
    }
  };

  const filteredEvents = eventsList.filter(e => {
    const isCompleted = e.status === 'Completed' || new Date(e.date) < new Date(new Date().setHours(0,0,0,0));
    return activeTab === 'upcoming' ? !isCompleted : isCompleted;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Calendar className="w-6 h-6" />
            </div>
            Youth Activity & Events
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Organize youth feasts, retreats, sports days, choir practices, and community service drives.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Create New Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Upcoming Events ({eventsList.filter(e => e.status !== 'Completed').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'completed'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed Events ({eventsList.filter(e => e.status === 'Completed').length})
        </button>
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => (
            <div
              key={evt._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div
                className="relative h-44 bg-slate-900 cursor-pointer group"
                onClick={() => setSelectedBanner({ url: getImageUrl(evt.bannerImage) || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600', title: evt.eventName, subtitle: evt.category })}
              >
                <img
                  src={getImageUrl(evt.bannerImage) || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600'}
                  alt={evt.eventName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600';
                  }}
                  className="w-full h-full object-cover object-top opacity-85 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-indigo-700 shadow-xs">
                  {evt.category || 'Youth Meeting'}
                </div>
                {canEdit && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(evt)}
                      className="p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 transition shadow-sm"
                      title="Edit Event"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(evt._id)}
                      className="p-2 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition shadow-sm"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{evt.eventName}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{evt.description || 'Join us for prayer, fellowship, and exciting activities.'}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>{new Date(evt.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} • {evt.time || '10:00 AM'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="truncate">{evt.venue || 'Main Church Auditorium'}</span>
                  </div>

                  {evt.budget && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Budget: ₹{Number(evt.budget).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {evt.coordinator && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>Coordinator: {evt.coordinator}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-700">No {activeTab} events found</h4>
            <p className="text-xs font-medium text-slate-400 mt-1">Create a new youth activity event to get started.</p>
          </div>
        )}
      </div>

      {/* Modal for Create & Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">{editingEvent ? 'Edit Youth Event' : 'Schedule New Youth Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-bold">Event Banner Photo</span>
                  <label className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner</span>
                    <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                </div>
                {bannerPreview && (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-slate-300">
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerPreview(''); }}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Event Name (Max 50 chars) *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="e.g., Annual Youth Feast 2026 (max 50 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Description (Max 150 chars)</label>
                <textarea
                  rows="2"
                  maxLength={150}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief details about the event (max 150 chars)..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    <option value="Youth Gathering">Youth Gathering</option>
                    <option value="Spiritual Retreat">Spiritual Retreat</option>
                    <option value="Sports Tournament">Sports Tournament</option>
                    <option value="Choir Practice">Choir Practice</option>
                    <option value="Community Service">Community Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Venue Location (Max 150 chars)</label>
                  <input
                    type="text"
                    maxLength={150}
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Parish Hall (max 150 chars)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Time</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="10:00 AM - 04:00 PM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Budget Allocation (₹)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="5000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Lead Coordinator</label>
                  <input
                    type="text"
                    value={formData.coordinator}
                    onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                    placeholder="e.g., David Raj"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Event Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  {editingEvent ? 'Save Event Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Lightbox Modal */}
      {selectedBanner && (
        <PhotoLightboxModal
          photoUrl={selectedBanner.url}
          title={selectedBanner.title}
          subtitle={selectedBanner.subtitle}
          onClose={() => setSelectedBanner(null)}
        />
      )}
    </div>
  );
}
