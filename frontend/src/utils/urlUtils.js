import axios from 'axios';

/**
 * Returns a full absolute URL for uploaded images.
 * If path is relative (/uploads/...), prepends backend base URL in production.
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  let cleanPath = String(path).replace(/\\/g, '/').trim();
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }
  const baseUrl = (axios.defaults.baseURL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${baseUrl}${cleanPath}`;
};
