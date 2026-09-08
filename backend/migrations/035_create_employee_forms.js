'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_forms', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      // Joining Letter fields
      joining_date:       { type: Sequelize.DATEONLY, allowNull: true },
      joining_designation:{ type: Sequelize.STRING(200), allowNull: true },
      joining_address:    { type: Sequelize.TEXT, allowNull: true },
      // Personal Info Form fields
      middle_name:        { type: Sequelize.STRING(100), allowNull: true },
      present_address:    { type: Sequelize.TEXT, allowNull: true },
      present_city:       { type: Sequelize.STRING(100), allowNull: true },
      present_state:      { type: Sequelize.STRING(100), allowNull: true },
      present_pincode:    { type: Sequelize.STRING(10), allowNull: true },
      present_phone:      { type: Sequelize.STRING(20), allowNull: true },
      permanent_address:  { type: Sequelize.TEXT, allowNull: true },
      permanent_city:     { type: Sequelize.STRING(100), allowNull: true },
      permanent_state:    { type: Sequelize.STRING(100), allowNull: true },
      permanent_pincode:  { type: Sequelize.STRING(10), allowNull: true },
      permanent_phone:    { type: Sequelize.STRING(20), allowNull: true },
      designation:        { type: Sequelize.STRING(200), allowNull: true },
      blood_group:        { type: Sequelize.STRING(5), allowNull: true },
      marital_status:     { type: Sequelize.ENUM('single','married','divorced','widowed'), allowNull: true },
      dob:                { type: Sequelize.DATEONLY, allowNull: true },
      pan_number:         { type: Sequelize.STRING(20), allowNull: true },
      place_of_birth:     { type: Sequelize.STRING(100), allowNull: true },
      district:           { type: Sequelize.STRING(100), allowNull: true },
      aadhaar_number:     { type: Sequelize.STRING(20), allowNull: true },
      passport_number:    { type: Sequelize.STRING(30), allowNull: true },
      passport_expiry:    { type: Sequelize.DATEONLY, allowNull: true },
      passport_place:     { type: Sequelize.STRING(100), allowNull: true },
      emergency_contact_1:{ type: Sequelize.STRING(300), allowNull: true },
      emergency_contact_2:{ type: Sequelize.STRING(300), allowNull: true },
      // Qualification — stored as JSON
      qualification_details: { type: Sequelize.TEXT('long'), allowNull: true, comment: 'JSON array of {level, institution, percentage, duration}' },
      // Employment history — JSON
      employment_history:    { type: Sequelize.TEXT('long'), allowNull: true, comment: 'JSON array' },
      // Training — JSON
      training_details:      { type: Sequelize.TEXT('long'), allowNull: true },
      // Family details — JSON
      family_details:        { type: Sequelize.TEXT('long'), allowNull: true },
      // Misc
      professional_associations: { type: Sequelize.TEXT, allowNull: true },
      hobbies:               { type: Sequelize.TEXT, allowNull: true },
      serious_illness:       { type: Sequelize.TEXT, allowNull: true },
      other_info:            { type: Sequelize.TEXT, allowNull: true },
      // Status
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected'),
        defaultValue: 'draft',
      },
      hr_comment:  { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' } },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      submitted_at:{ type: Sequelize.DATE, allowNull: true },
      created_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' });
    await queryInterface.addIndex('employee_forms', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('employee_forms'); },
};
