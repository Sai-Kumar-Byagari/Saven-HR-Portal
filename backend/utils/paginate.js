function getPagination(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function getPaginationMeta(count, page, limit) {
  const totalPages = Math.ceil(count / limit);
  return {
    total: count,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { getPagination, getPaginationMeta };
