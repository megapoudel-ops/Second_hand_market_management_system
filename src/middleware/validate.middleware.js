const ApiError = require('../utils/apiError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join('.'),
        message: item.message
      }));

      next(new ApiError(400, 'Validation failed', details));
      return;
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
