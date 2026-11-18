const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ALLOWED_EXTENSIONS, isAllowedUpload } = require('../utils/uploadPolicy');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, isCloudinaryReady } = require('../config/cloudinary');

// Centralized upload policy. Keep this list intentionally narrower than
// Cloudinary's "resource_type=auto" so the API accepts only known media/docs.
function fileFilter(req, file, cb) {
  if (!isAllowedUpload(file)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
  cb(null, true);
}

let storage;

if (isCloudinaryReady) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'educommunity',
      resource_type: 'auto',
      allowed_formats: [...ALLOWED_EXTENSIONS],
      public_id: (req, file) => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
    },
  });
  console.log('☁️  رفع الملفات: Cloudinary');
} else {
  const dir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    },
  });
  console.log('💾 رفع الملفات: تخزين محلي (Cloudinary غير مضبوط)');
}

// 25 MB global cap. Individual endpoints can add stricter validation later.
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter,
});

function getFileUrl(file) {
  if (!file) return null;
  return isCloudinaryReady ? file.path : '/uploads/' + file.filename;
}

module.exports = upload;
module.exports.getFileUrl = getFileUrl;
module.exports.isAllowedUpload = isAllowedUpload;
