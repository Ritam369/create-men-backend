import ApiError from "../utils/api-error.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // duplicate key (e.g. unique slug) → 409 instead of a raw 500
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = ApiError.conflict(`Duplicate value for '${field}'`);
  }

  const isOperational = error instanceof ApiError;
  if (!isOperational) console.error(error);

  res.status(error.statusCode || 500).json({
    success: false,
    message: isOperational ? error.message : "Internal Server Error",
  });
};

export default errorHandler;
