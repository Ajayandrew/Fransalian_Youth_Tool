const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {}
}

const memoryStorage = multer.memoryStorage();
const rawMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadMiddleware = (fieldname) => {
  return (req, res, next) => {
    rawMulter.single(fieldname)(req, res, (err) => {
      if (err) return next(err);
      if (req.file) {
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `${req.file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        req.file.filename = filename;

        // 1. Write copy to local disk folder (/uploads) for local serving
        const localPath = path.join(uploadDir, filename);
        try {
          fs.writeFileSync(localPath, req.file.buffer);
        } catch (e) {}

        // 2. Construct persistent Base64 Data URI for Render/Cloud database persistence
        const mime = req.file.mimetype || 'image/jpeg';
        req.file.dataUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
      }
      next();
    });
  };
};

const uploadAnyMiddleware = () => {
  return (req, res, next) => {
    rawMulter.any()(req, res, (err) => {
      if (err) return next(err);
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const ext = path.extname(file.originalname) || '.jpg';
          const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
          file.filename = filename;
          const localPath = path.join(uploadDir, filename);
          try {
            fs.writeFileSync(localPath, file.buffer);
          } catch (e) {}
          const mime = file.mimetype || 'image/jpeg';
          file.dataUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
        });
      }
      next();
    });
  };
};

module.exports = {
  single: uploadMiddleware,
  any: uploadAnyMiddleware
};
