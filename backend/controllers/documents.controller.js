const { EmployeeDocument } = require('../models');
const path = require('path');

const DOC_TYPE_LABELS = {
  ssc: 'SSC Memo',
  '12th': '12th Memo',
  degree: 'Degree Certificate',
  aadhar: 'Aadhaar Card',
  pan: 'PAN Card',
  resume: 'Resume',
  offer_letter: 'Offer Letter',
  other: 'Other Document',
};

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.', errors: [] });
    }

    const { doc_type } = req.body;
    const userId = req.user.id;

    if (!doc_type || !DOC_TYPE_LABELS[doc_type]) {
      return res.status(400).json({ success: false, message: 'Invalid document type.', errors: [] });
    }

    const relativePath = req.file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');

    // Upsert: if doc_type already exists for this user, replace it
    const existing = await EmployeeDocument.findOne({ where: { user_id: userId, doc_type } });
    if (existing) {
      await existing.update({
        file_path: relativePath,
        original_name: req.file.originalname,
        display_name: DOC_TYPE_LABELS[doc_type],
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        uploaded_at: new Date(),
      });
      return res.status(200).json({ success: true, message: 'Document replaced.', data: existing });
    }

    const doc = await EmployeeDocument.create({
      user_id: userId,
      doc_type,
      file_path: relativePath,
      original_name: req.file.originalname,
      display_name: DOC_TYPE_LABELS[doc_type],
      mime_type: req.file.mimetype,
      file_size: req.file.size,
    });

    return res.status(201).json({ success: true, message: 'Document uploaded.', data: doc });
  } catch (err) {
    next(err);
  }
}

async function getMyDocuments(req, res, next) {
  try {
    const docs = await EmployeeDocument.findAll({
      where: { user_id: req.user.id },
      order: [['uploaded_at', 'DESC']],
    });
    return res.status(200).json({ success: true, message: 'Documents fetched.', data: docs });
  } catch (err) {
    next(err);
  }
}

async function getEmployeeDocuments(req, res, next) {
  try {
    const { userId } = req.params;
    const docs = await EmployeeDocument.findAll({
      where: { user_id: userId },
      order: [['uploaded_at', 'DESC']],
    });
    return res.status(200).json({ success: true, message: 'Documents fetched.', data: docs });
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await EmployeeDocument.findOne({ where: { id, user_id: req.user.id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.', errors: [] });
    await doc.destroy();
    return res.status(200).json({ success: true, message: 'Document deleted.', data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument, getMyDocuments, getEmployeeDocuments, deleteDocument };
