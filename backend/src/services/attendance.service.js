const Attendance = require('../models/Attendance');

// ===== طبقة الخدمات (Service) للحضور =====
// هنا كل منطق الشغل والتعامل مع الداتابيز.
// الكنترولر مابيعرفش حاجة عن Mongoose — بينادي الدوال دي بس.
//
// الحضور ده تتبّع وقت شغل المدرس:
//   الجلسة بتتفتح لوحدها لما المدرس يسجّل دخول (شوف auth.service.js — بيعمل Attendance.create)،
//   وبتتقفل هنا لما يعمل checkout، ووقتها بنحسب المدة بالدقايق.
//   الأدمن بيجمّع الدقايق دي ويبني عليها تقييم المدرس.

// ===== تسجيل الخروج (نقفل الجلسة المفتوحة ونحسب المدة) =====
async function checkout(teacherId) {
  // بندوّر على آخر جلسة لسه مفتوحة (logoutAt لسه فاضي) — الأحدث الأول
  const session = await Attendance.findOne({ teacher: teacherId, logoutAt: null }).sort({ loginAt: -1 });

  // مفيش جلسة مفتوحة؟ ده مش خطأ — يمكن يكون عمل checkout قبل كده،
  // فبنرجّع رد عادي ناجح بالرسالة دي بدل ما نرمي ApiError.
  if (!session) return { session: null, message: 'لا توجد جلسة مفتوحة' };

  session.logoutAt = new Date();
  // الفرق بين الوقتين بالمللي ثانية ÷ 60000 = دقايق
  session.durationMinutes = Math.round((session.logoutAt - session.loginAt) / 60000);
  await session.save();

  return { session, message: 'تم تسجيل الخروج' };
}

// ===== جلساتي أنا + إجمالي وقتي =====
async function getMe(teacherId) {
  const sessions = await Attendance.find({ teacher: teacherId }).sort({ loginAt: -1 }); // الأحدث الأول

  // بنجمع دقايق كل الجلسات — الجلسة اللي لسه مفتوحة مدتها 0 فمابتأثّرش
  const totalMinutes = sessions.reduce((s, x) => s + (x.durationMinutes || 0), 0);

  return { sessions, totalMinutes };
}

// ===== كل الحضور (للأدمن) — جلسات كل المدرسين =====
async function listAll() {
  const sessions = await Attendance.find()
    .populate('teacher', 'name') // نجيب اسم المدرّس بس مش بياناته كلها
    .sort({ loginAt: -1 })       // الأحدث الأول
    .limit(200);                 // بنحدّد العدد عشان الرد مايبقاش تقيل

  // نجمّع إجمالي الوقت لكل مدرس عشان الأدمن يقارن بسهولة
  const totals = await Attendance.aggregate([
    { $group: { _id: '$teacher', minutes: { $sum: { $ifNull: ['$durationMinutes', 0] } } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, name: { $ifNull: ['$teacher.name', 'غير معروف'] }, minutes: 1 } },
    { $sort: { minutes: -1, name: 1 } },
  ]);

  return { sessions, totals };
}

module.exports = { checkout, getMe, listAll };
