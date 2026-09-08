const { AuditLog } = require('../models');

const AUDITABLE_TABLES = ['users', 'leaves', 'payroll', 'policies', 'job_positions', 'candidates'];

function auditLogger(tableName, action) {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Only audit successful mutations
      if (data && data.success && req.user) {
        try {
          const recordId = data.data?.id || req.params?.id || null;
          await AuditLog.create({
            user_id: req.user.id,
            action,
            table_name: tableName,
            record_id: recordId ? parseInt(recordId, 10) : null,
            old_value: req.auditOldValue || null,
            new_value: action !== 'DELETE' ? (data.data || null) : null,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.headers['user-agent'],
          });
        } catch (auditError) {
          console.error('[AuditLog] Failed to write audit entry:', auditError.message);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

module.exports = auditLogger;
