class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Scheduling Errors
 */
class DomainRateLimitError extends AppError {
  constructor(hostname) {
    super(`Domain ${hostname} is currently rate limited`, 429);
    this.hostname = hostname;
  }
}

/**
 * Network Errors
 */
class DnsResolutionError extends AppError {
  constructor(hostname) {
    super(`Failed to resolve hostname: ${hostname}`, 502);
    this.hostname = hostname;
  }
}

class ConnectionTimeoutError extends AppError {
  constructor(url) {
    super(`Connection timed out while fetching ${url}`, 504);
    this.url = url;
  }
}

/**
 * HTTP Errors
 */
class Http429Error extends AppError {
  constructor(url) {
    super(`Target server rate limited request: ${url}`, 429);
    this.url = url;
  }
}

class Http5xxError extends AppError {
  constructor(url, statusCode) {
    super(`Server error (${statusCode}) while fetching ${url}`, statusCode);
    this.url = url;
  }
}

class Http404Error extends AppError {
  constructor(url) {
    super(`Page not found: ${url}`, 404);
    this.url = url;
  }
}

/**
 * Content Errors
 */
class UnsupportedContentTypeError extends AppError {
  constructor(contentType) {
    super(`Unsupported content type: ${contentType}`, 415);
    this.contentType = contentType;
  }
}

class ResponseTooLargeError extends AppError {
  constructor(size) {
    super(`Response size exceeded limit: ${size} bytes`, 413);
    this.size = size;
  }
}

/**
 * Storage Errors
 */
class HtmlStorageError extends AppError {
  constructor(filePath) {
    super(`Failed to store HTML at ${filePath}`, 500);
    this.filePath = filePath;
  }
}

module.exports = {
  AppError,
  DomainRateLimitError,
  DnsResolutionError,
  ConnectionTimeoutError,
  Http429Error,
  Http5xxError,
  Http404Error,
  UnsupportedContentTypeError,
  ResponseTooLargeError,
  HtmlStorageError,
};
