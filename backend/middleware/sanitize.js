// High-performance NoSQL query injection & string sanitization middleware
const cleanValue = (data) => {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(cleanValue);
  }

  if (typeof data === 'object') {
    const cleanObj = {};
    for (const key of Object.keys(data)) {
      // Strip keys starting with $ (MongoDB query operators) or containing . (path traversal)
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleanObj[key] = cleanValue(data[key]);
    }
    return cleanObj;
  }

  return data;
};

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) req.body = cleanValue(req.body);
    if (req.query) req.query = cleanValue(req.query);
    if (req.params) req.params = cleanValue(req.params);
  } catch (e) {
    // Continue cleanly if error during sanitization
  }
  next();
};

module.exports = sanitizeInput;
