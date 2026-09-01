// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message).join(", ");
    error = { message, statusCode: 400 };
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = { message: "File size too large. Maximum size is 5MB per image", statusCode: 400 };
    } else if (err.code === "LIMIT_FILE_COUNT") {
      error = { message: "Too many files. Maximum is 10 images", statusCode: 400 };
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      error = { message: "Unexpected field in file upload", statusCode: 400 };
    } else {
      error = { message: err.message, statusCode: 400 };
    }
  }

  // Custom file type error
  if (err.message === "Only image files are allowed!") {
    error = { message: "Only image files (jpg, jpeg, png, webp, gif) are allowed", statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
