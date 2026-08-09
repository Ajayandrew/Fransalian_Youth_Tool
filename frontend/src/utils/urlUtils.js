import axios from 'axios';

/**
 * Returns a full absolute URL for uploaded images.
 * If path is relative (/uploads/...), prepends backend base URL in production.
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = axios.defaults.baseURL || import.meta.env.VITE_API_URL || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
