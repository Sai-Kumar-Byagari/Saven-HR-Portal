const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token missing. Please log in.',
        errors: [],
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh your session.',
          errors: [{ code: 'TOKEN_EXPIRED' }],
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid access token.',
        errors: [{ code: 'TOKEN_INVALID' }],
      });
    }

    const user = await User.findOne({
      where: { id: decoded.id, is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'role',
        'is_first_login', 'employee_type', 'onboarding_complete', 'reporting_manager_id'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
        errors: [],
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
