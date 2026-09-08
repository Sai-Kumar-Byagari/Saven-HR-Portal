const { Policy, User } = require('../models');
const { getPagination, getPaginationMeta } = require('../utils/paginate');
const { notifyAllActiveUsers } = require('../services/notification.service');
const path = require('path');

async function uploadPolicy(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.', errors: [] });
    }
    const { title, category } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Policy title is required.', errors: [] });

    const relativePath = req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');

    const policy = await Policy.create({
      title,
      category: category || 'Other',
      file_path: relativePath,
      original_name: req.file.originalname,
      uploaded_by: req.user.id,
    });

    // Notify all employees
    await notifyAllActiveUsers({
      title: 'New Policy Published',
      message: `A new policy "${title}" has been published. Please review it.`,
      type: 'policy',
      referenceId: policy.id,
      referenceType: 'policy',
      navigateTo: '/policies',
    });

    return res.status(201).json({ success: true, message: 'Policy uploaded.', data: policy });
  } catch (err) {
    next(err);
  }
}

async function getPolicies(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { category } = req.query;
    const where = {};
    if (category) where.category = category;

    const { count, rows } = await Policy.findAndCountAll({
      where,
      include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'], required: false }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Policies fetched.',
      data: rows,
      pagination: getPaginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

async function deletePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const policy = await Policy.findByPk(id);
    if (!policy) return res.status(404).json({ success: false, message: 'Policy not found.', errors: [] });
    await policy.destroy();
    return res.status(200).json({ success: true, message: 'Policy deleted.', data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPolicy, getPolicies, deletePolicy };
