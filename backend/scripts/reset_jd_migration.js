const { sequelize } = require('../config/database');
async function run() {
  await sequelize.query('DROP TABLE IF EXISTS jd_approvals');
  await sequelize.query("DELETE FROM SequelizeMeta WHERE name='033_create_jd_approvals.js'");
  console.log('done');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
