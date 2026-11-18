const User = require('../models/User');
const Post = require('../models/Post');
const Challenge = require('../models/Challenge');
const Material = require('../models/Material');
const Shift = require('../models/Shift');
const mongoose = require('mongoose');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

async function stats() {
  const now = new Date();
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1) - 24 * 60 * 60 * 1000);
  const monthStarts = Array.from({ length: 6 }, (_, index) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1))
  );

  const [usersByRole, totalUsers, totalPosts, activeChallenges, totalMaterials, pendingMaterials, activeShifts, monthlyUsers, recentUsers, topSubjects] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Post.countDocuments(),
    Challenge.countDocuments({ active: true, $or: [{ status: 'approved' }, { status: { $exists: false } }] }),
    Material.countDocuments(),
    Material.countDocuments({ status: 'pending' }),
    Shift.countDocuments({ startsAt: { $lte: now }, endsAt: { $gte: now } }),
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: {
        year: { $year: { date: '$createdAt', timezone: 'Africa/Cairo' } },
        month: { $month: { date: '$createdAt', timezone: 'Africa/Cairo' } },
      }, count: { $sum: 1 } } },
    ]),
    User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    Material.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$subject.name', 'غير محدد'] }, count: 1 } },
      { $sort: { count: -1, name: 1 } },
      { $limit: 5 },
    ]),
  ]);

  const growthByMonth = new Map(monthlyUsers.map((item) => [`${item._id.year}-${item._id.month}`, item.count]));
  const userGrowth = monthStarts.map((date) => ({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    count: growthByMonth.get(`${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`) || 0,
  }));

  return {
    usersByRole: usersByRole.map(({ _id: role, count }) => ({ role, count })),
    totalUsers,
    totalPosts,
    activeChallenges,
    totalMaterials,
    pendingMaterials,
    activeShifts,
    userGrowth,
    recentUsers: recentUsers.map((user) => ({ ...user, id: user._id })),
    topSubjects,
  };
}

async function listUsers(query = {}) {
  const paginated = ['page', 'limit', 'search', 'role'].some((key) => query[key] !== undefined);
  const filter = {};
  if (typeof query.role === 'string' && ['student', 'teacher', 'admin', 'supervisor'].includes(query.role)) filter.role = query.role;
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const escapedSearch = search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    filter.$or = [{ name: { $regex: escapedSearch, $options: 'i' } }, { email: { $regex: escapedSearch, $options: 'i' } }];
  }

  const pagination = paginated ? getPagination(query, 20) : { skip: 0, limit: 200, page: 1 };
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role grade points createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    paginated ? User.countDocuments(filter) : Promise.resolve(undefined),
  ]);

  const mappedUsers = users.map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    grade: user.grade,
    points: user.points,
    created_at: user.createdAt,
  }));

  return paginated ? { users: mappedUsers, meta: buildMeta(total, pagination.page, pagination.limit) } : mappedUsers;
}

async function deleteUser(userId, requesterId) {
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, 'معرّف المستخدم غير صالح');
  if (String(userId) === String(requesterId)) throw new ApiError(400, 'لا يمكنك حذف حسابك الحالي');
  const user = await User.findById(userId).select('role');
  if (!user) throw new ApiError(404, 'المستخدم غير موجود');
  if (user.role === 'admin') throw new ApiError(403, 'لا يمكن حذف حساب أدمن من لوحة الإدارة');
  await user.deleteOne();
}

module.exports = { stats, listUsers, deleteUser };
