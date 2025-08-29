const AppError = require('./AppError');

/**
 * Erro para recurso não encontrado (404)
 */
class NotFoundError extends AppError {
  /**
   * Cria uma nova instância de erro de recurso não encontrado
   * @param {string} message - Mensagem de erro
   * @param {boolean} isOperational - Indica se é um erro operacional
   */
  constructor(message = 'Recurso não encontrado', isOperational = true) {
    super(message, 404, isOperational);
  }
}

module.exports = NotFoundError;
