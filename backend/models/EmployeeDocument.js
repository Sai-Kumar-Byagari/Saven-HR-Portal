const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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

const EmployeeDocument = sequelize.define('EmployeeDocument', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  doc_type: {
    type: DataTypes.ENUM('ssc', '12th', 'degree', 'aadhar', 'pan', 'resume', 'offer_letter', 'other'),
    allowNull: false,
    validate: { isIn: [['ssc', '12th', 'degree', 'aadhar', 'pan', 'resume', 'offer_letter', 'other']] },
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'employee_documents',
  timestamps: true,
  underscored: true,
});

EmployeeDocument.DOC_TYPE_LABELS = DOC_TYPE_LABELS;

module.exports = EmployeeDocument;
