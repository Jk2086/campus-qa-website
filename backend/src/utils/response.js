export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, extra = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || message,
  });
};
