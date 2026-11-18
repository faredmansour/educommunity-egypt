// أدوات بسيطة للترقيم (pagination) عشان مانكرّرش نفس الحسبة في كل كنترولر.

// بناخد ?page=2&limit=9 من الرابط ونحوّلهم لأرقام + نحسب skip
function getPagination(query, defaultLimit = 9) {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Math.min(Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : defaultLimit, 100);
  const skip = (page - 1) * limit;                               // نتخطّى صفحات قبلها
  return { page, limit, skip };
}

// بنبني الـ meta اللي بترجع مع القوائم عشان الفرونت يعرف يرسم أزرار الصفحات
function buildMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNextPage: page * limit < total,
  };
}

module.exports = { getPagination, buildMeta };
