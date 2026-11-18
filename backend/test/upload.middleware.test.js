const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedUpload } = require('../src/utils/uploadPolicy');

test('upload policy accepts PDF', () => {
  assert.equal(isAllowedUpload({ originalname: 'lesson.pdf', mimetype: 'application/pdf' }), true);
});

test('upload policy rejects executable files', () => {
  assert.equal(isAllowedUpload({ originalname: 'payload.exe', mimetype: 'application/octet-stream' }), false);
});

test('upload policy rejects MIME/extension mismatch', () => {
  assert.equal(isAllowedUpload({ originalname: 'lesson.pdf', mimetype: 'image/png' }), false);
});
