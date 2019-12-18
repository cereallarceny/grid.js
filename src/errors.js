export class UnauthorizedError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UnauthorizedError);
    this.statusCode = 401;
    this.message = 'Unauthorized Access';
  }
}

export class ForbiddenError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, ForbiddenError);
    this.statusCode = 403;
    this.message = 'Forbidden Response';
  }
}

export class NotFoundError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, NotFoundError);
    this.statusCode = 404;
    this.message = 'Resource Not Found';
  }
}
