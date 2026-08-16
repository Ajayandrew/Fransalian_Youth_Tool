import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as GalleryIcon, Plus, Eye, Upload, X, Trash2, Maximize2, Grid } from 'lucide-react';
import toast from 'react-hot-toast';
import PhotoLightboxModal from '../components/PhotoLightboxModal';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataContext';
import { getImageUrl } from '../utils/urlUtils';

export default function Gallery() {
  const { hasRole } = useAuth();
  const { fetchWithCache, invalidateCache } = useDataCache();
  const [albums, setAlbums] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [fitMode, setFitMode] = useState('contain'); // 'contain' for full uncropped image, 'cover' for grid crop
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    albumTitle: '',
    category: 'Cultural',
    caption: '',
    photoUrl: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const canEdit = hasRole(['Admin', 'Youth Leader', 'Secretary']);

  const fetchGallery = async (forceRefresh = false) => {
    try {
      if (forceRefresh) invalidateCache('gallery');
      const data = await fetchWithCache('gallery', '/api/gallery', {}, forceRefresh);
      if (data && data.albums) {
        setAlbums(data.albums);
      }
    } catch (err) {
      console.warn('Fallback gallery data');
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleDeletePhoto = async (photo, e) => {
    e.stopPropagation();
    if (!canEdit) return;
    if (!window.confirm(`Delete photo "${photo.caption || photo.albumTitle}" from gallery?`)) return;

    // 1. Instant Optimistic UI Update (0ms latency)
    setAlbums(prevAlbums =>
      prevAlbums
        .map(alb => ({
          ...alb,
          photos: (alb.photos || []).filter(p => p.url !== photo.url)
        }))
        .filter(alb => (alb.photos || []).length > 0)
    );

    toast.success('Photo removed from album.');
    invalidateCache('gallery');

    // 2. Background API Call
    try {
      await axios.post('/api/gallery/delete-photo', { photoUrl: photo.url });
    } catch (err) {
      toast.error('Failed to sync deletion to server.');
      fetchGallery(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.albumTitle) {
      return toast.error('Album title is required.');
    }
    if (!photoFile && !formData.photoUrl) {
      return toast.error('Please upload a photo file or provide an Image URL.');
    }

    if (uploading) return;
    setUploading(true);
    const toastId = toast.loading('Uploading photo to album...', { id: 'gallery-dl' });

    try {
      let res;
      if (photoFile) {
        const payload = new FormData();
        payload.append('albumTitle', formData.albumTitle);
        payload.append('category', formData.category);
        payload.append('caption', formData.caption);
        payload.append('photo', photoFile);

        res = await axios.post('/api/gallery/upload', payload);
      } else {
        res = await axios.post('/api/gallery/upload', formData);
      }

      if (res.data && res.data.success) {
        const newPhotoUrl = res.data.photoUrl || photoPreview || formData.photoUrl;
        const newPhotoObj = {
          url: newPhotoUrl,
          caption: formData.caption || formData.albumTitle,
          uploadedAt: new Date().toISOString()
        };

        // Prepend new photo to albums array so it appears at POSITION #1 immediately
        setAlbums(prev => {
          const existingIdx = prev.findIndex(a => (a.albumTitle || '').toLowerCase() === (formData.albumTitle || '').toLowerCase());
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              photos: [newPhotoObj, ...(updated[existingIdx].photos || [])]
            };
            return updated;
          } else {
            return [
              {
                _id: 'alb_' + Date.now(),
                albumTitle: formData.albumTitle,
                category: formData.category,
                photos: [newPhotoObj]
              },
              ...prev
            ];
          }
        });

        toast.success('Photo added to gallery album!', { id: 'gallery-dl' });
        setShowUploadModal(false);
        setPhotoFile(null);
        setPhotoPreview('');
        fetchGallery(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo to album.', { id: 'gallery-dl' });
    } finally {
      setUploading(false);
    }
  };

  // Combine & Sort photos newest-first across all albums for grid view
  const allPhotos = albums
    .flatMap(a =>
      (a.photos || []).map((p, idx) => ({
        ...p,
        albumTitle: a.albumTitle,
        category: a.category,
        uploadedAt: p.uploadedAt || p.createdAt || a.createdAt || new Date(Date.now() - idx * 1000)
      }))
    )
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

  const categories = ['All', ...new Set(albums.map(a => a.category).filter(Boolean))];

  const filteredPhotos = allPhotos.filter(p =>
    activeCategory === 'All' || p.category === activeCategory
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <GalleryIcon className="w-6 h-6" />
            </div>
            Youth Photo Gallery & Highlights
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Memories, event snapshots, retreats, sports meets, and choir recordings.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Photo to Album
          </button>
        )}
      </div>

      {/* Category Pills & Layout Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Layout Fit Mode Selector */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto flex-shrink-0">
          <button
            onClick={() => setFitMode('contain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer ${fitMode === 'contain'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
            title="Display complete image inside card without top crop"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Image</span>
          </button>
          <button
            onClick={() => setFitMode('cover')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer ${fitMode === 'cover'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
            title="Top focused grid crop"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Top Focus Grid</span>
          </button>
        </div>
      </div>

      {/* Photo Gallery Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredPhotos.length > 0 ? (
          filteredPhotos.map((photo, index) => (
            <div
              key={index}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative h-64 bg-slate-950 rounded-3xl overflow-hidden cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-800"
            >
              <img
                src={getImageUrl(photo.url)}
                alt={photo.caption || photo.albumTitle}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600';
                }}
                className={`w-full h-full ${fitMode === 'contain'
                    ? 'object-contain p-2 bg-slate-950'
                    : 'object-cover object-top'
                  } group-hover:scale-105 transition-all duration-500 opacity-90 group-hover:opacity-100`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {photo.category || 'General'}
                </span>
                <h4 className="text-xs font-extrabold text-white mt-1.5 line-clamp-1">{photo.caption || photo.albumTitle}</h4>
                <p className="text-[11px] text-slate-300 font-medium">{photo.albumTitle}</p>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo, e)}
                    className="p-2 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition shadow-sm"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <GalleryIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-700">No photos found</h4>
            <p className="text-xs font-medium text-slate-400 mt-1">Upload event photos to populate the album gallery.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <PhotoLightboxModal
          photo={selectedPhoto}
          allowDownload={true}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add Photo to Album</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Album Title</label>
                <input
                  type="text"
                  required
                  value={formData.albumTitle}
                  onChange={(e) => setFormData({ ...formData, albumTitle: e.target.value })}
                  placeholder="e.g., Youth Feast 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="Cultural">Cultural</option>
                  <option value="Spiritual">Spiritual</option>
                  <option value="Sports">Sports</option>
                  <option value="Youth Meeting">Youth Meeting</option>
                  <option value="Retreat">Retreat</option>
                  <option value="Feast">Feast</option>
                  <option value="Camp">Camp</option>
                  <option value="Choir">Choir</option>
                  <option value="Christmas">Christmas</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-bold">Select Local Photo File</span>
                  <label className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                {photoPreview && (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-slate-300">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase">OR Enter Online Image URL</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Caption / Description</label>
                <input
                  type="text"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="e.g., Youth gathering dance group"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading Photo...</span>
                    </>
                  ) : (
                    <span>Upload Photo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
