const path = require('path');

const EXTENSION_TO_MIME = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  txt: ['text/plain'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
  mov: ['video/quicktime'],
  mp3: ['audio/mpeg'],
  wav: ['audio/wav', 'audio/x-wav'],
  ogg: ['audio/ogg'],
  m4a: ['audio/mp4'],
  aac: ['audio/aac'],
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(EXTENSION_TO_MIME));
const ALLOWED_MIME_TYPES = new Set(Object.values(EXTENSION_TO_MIME).flat());

function isAllowedUpload(file) {
  const extension = path.extname(file.originalname || '').slice(1).toLowerCase();
  const allowedMimeTypes = EXTENSION_TO_MIME[extension];
  return Boolean(allowedMimeTypes?.includes(file.mimetype));
}

module.exports = { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, isAllowedUpload };
