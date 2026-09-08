function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message, err.stack);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the allowed limit.',
      errors: [],
    });
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      errors,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      errors: [],
    });
  }

  // JWT errors (should normally be caught in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      errors: [],
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired.',
      errors: [],
    });
  }

  // Custom app errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Generic 500
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    errors: [],
  });
}

module.exports = errorHandler;
