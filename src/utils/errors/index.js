/**
 * Arquivo de índice para exportar todas as classes de erro
 * Facilita a importação de múltiplas classes de erro
 */

const AppError = require('./AppError');
const NotFoundError = require('./NotFoundError');
const ValidationError = require('./ValidationError');
const AuthenticationError = require('./AuthenticationError');
const ForbiddenError = require('./ForbiddenError');
const ConflictError = require('./ConflictError');
const RateLimitError = require('./RateLimitError');

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
  RateLimitError
};
