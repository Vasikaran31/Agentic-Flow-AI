const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results and returns 422 if invalid.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = { validate };
