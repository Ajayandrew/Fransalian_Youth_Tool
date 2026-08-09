import React from 'react';
import { X, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/urlUtils';

export default function PhotoLightboxModal({ photo, photoUrl: directUrl, title: directTitle, subtitle: directSubtitle, onClose, onViewProfile }) {
  const rawUrl = directUrl || photo?.url || (typeof photo === 'string' ? photo : '');
  const url = getImageUrl(rawUrl);
  const title = directTitle || photo?.caption || photo?.albumTitle || photo?.title || 'Youth Photo';
  const subtitle = directSubtitle || photo?.subtitle || photo?.albumTitle || photo?.category || '';

  if (!url) return null;

  const handleDownload = async () => {
    try {
      toast.loading(`Preparing ${title} download...`, { id: 'photo-dl' });
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanFileName = (title || 'photo').replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${cleanFileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${title}!`, { id: 'photo-dl' });
    } catch (err) {
      window.open(url, '_blank');
      toast.success(`Opened ${title} in new tab!`, { id: 'photo-dl' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="relative max-w-3xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{title || 'Member Profile Photo'}</h3>
            {subtitle && <p className="text-xs text-indigo-600 font-bold">{subtitle}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Photo</span>
            </button>

            {onViewProfile && (
              <button
                onClick={onViewProfile}
                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Profile</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Large Photo Display */}
        <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          <img
            src={url}
            alt={title || 'Photo'}
            className="w-full max-h-[70vh] object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
