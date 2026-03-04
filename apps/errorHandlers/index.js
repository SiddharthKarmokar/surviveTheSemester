class AppError extends Error{
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = this.isOperational;
        this.details = this.details;

        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = null) {
    super(message, 404, true, details);
  }
}

class ValidationError extends AppError{
    constructor(message = "Validation Error", details = null){
        super(message, 400, true, details);
    }
}

class RedisError extends AppError{
    constructor(message = "Redis Error", details = null){
        super(message, 400, true, details);
    }
}

class KafkaError extends AppError{
    constructor(message = "Kafka Error", details = null){
        super(message, 400, true, details);
    }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed", details = null) {
    super(message, 401, true, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", details = null) {
    super(message, 403, true, details);
  }
}

class DataError extends AppError {
  constructor(message = "Data error", details = null) {
    super(message, 500, true, details);
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error", details = null) {
    super(message, 500, false, details);
  }
}

class RateLimitError extends AppError {
  constructor(
    message = "Too many requests, please try again later.",
    details = null
  ) {
    super(message, 429, true, details);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  RedisError,
  KafkaError,
  AuthenticationError,
  ForbiddenError,
  DataError,
  InternalServerError,
  RateLimitError,
};