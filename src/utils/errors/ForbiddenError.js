const AppError = require('./AppError');

/**
 * Erro para acesso proibido (403)
 */
class ForbiddenError extends AppError {
  /**
   * Cria uma nova instância de erro de acesso proibido
   * @param {string} message - Mensagem de erro
   * @param {boolean} isOperational - Indica se é um erro operacional
   */
  constructor(message = 'Acesso proibido', isOperational = true) {
    super(message, 403, isOperational);
  }
}

module.exports = ForbiddenError;
