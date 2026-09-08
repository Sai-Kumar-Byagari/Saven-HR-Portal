/**
 * Run this once to apply pending migrations:
 * node scripts/run_pending_migrations.js
 */
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running pending migrations...');
  const result = execSync('npx sequelize-cli db:migrate', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe',
  });
  console.log(result);
  console.log('✅ All migrations applied successfully.');
} catch (e) {
  console.error('Migration failed:', e.stdout || e.message);
  process.exit(1);
}
