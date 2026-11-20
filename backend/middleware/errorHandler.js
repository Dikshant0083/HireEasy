// Turn bad-input errors from Mongoose into 400s with a readable message.
function clientError(err) {
  if (err.name === 'MulterError') return err.message;
  if (err.name === 'CastError') return err.path === '_id' ? 'Not found.' : `Invalid value for ${err.path}.`;
  if (err.name === 'ValidationError') {
    return Object.values(err.errors).map((e) =>
      e.kind === 'enum' ? `${e.path} must be one of: ${e.properties.enumValues.join(', ')}.`
        : e.name === 'CastError' ? `Invalid value for ${e.path}.`
          : e.message).join(' ');
  }
  return null;
}

const errorHandler = (err, req, res, next) => {
  const known = clientError(err);
  const statusCode = err.statusCode || (known ? (err.name === 'CastError' && err.path === '_id' ? 404 : 400) : 500);
  if (statusCode >= 500) console.error('❌ Error:', err.stack || err.message);
  res.status(statusCode).json({
    success: false,
    // Client errors explain themselves; server errors never expose internals (DB messages, stacks).
    message: statusCode < 500 ? (known || err.message) : 'Something went wrong on our side. Please try again.',
  });
};

module.exports = errorHandler;
