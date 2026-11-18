const test = require('node:test');
const assert = require('node:assert/strict');
const validator = require('../src/validators/auth.validator');

test('public registration rejects admin role', () => {
  assert.equal(
    validator.register({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' }),
    'نوع الحساب غير مسموح به في التسجيل العام'
  );
});

test('public registration accepts student role', () => {
  assert.equal(
    validator.register({ name: 'Student', email: 'student@example.com', password: 'password123', role: 'student' }),
    null
  );
});

test('teacher registration requires a subject', () => {
  assert.equal(
    validator.register({ name: 'Teacher', email: 'teacher@example.com', password: 'password123', role: 'teacher' }),
    'اختر المادة التي تدرّسها'
  );
});
