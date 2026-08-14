const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

/**
 * Uploads a file buffer or base64 string to Cloudinary and returns the secure URL.
 * @param {Buffer|String} fileSource Buffer or Data URI string
 * @param {String} folder Target Cloudinary folder name
 * @returns {Promise<String>} Resolves with secure_url
 */
const uploadToCloudinary = (fileSource, folder = 'fransalian_youth') => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary credentials are set
    const hasCredentials = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    if (typeof fileSource === 'string' && fileSource.startsWith('data:')) {
      if (!hasCredentials) {
        // Fallback: return data URI if Cloudinary credentials aren't configured yet
        console.warn('[Cloudinary] Cloudinary credentials not configured in backend/.env. Returning Data URI fallback.');
        return resolve(fileSource);
      }
      cloudinary.uploader.upload(
        fileSource,
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]:', error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );
    } else if (Buffer.isBuffer(fileSource)) {
      if (!hasCredentials) {
        console.warn('[Cloudinary] Cloudinary credentials not configured in backend/.env. Returning Base64 Data URI fallback.');
        const base64 = fileSource.toString('base64');
        return resolve(`data:image/jpeg;base64,${base64}`);
      }
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Stream Error]:', error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );
      stream.end(fileSource);
    } else {
      reject(new Error('Invalid file source provided to uploadToCloudinary'));
    }
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
