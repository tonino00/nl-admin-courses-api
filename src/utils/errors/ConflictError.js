const AppError = require('./AppError');

/**
 * Erro para conflitos de recursos (409)
 * Usado para situações como tentativa de criar um recurso que já existe
 */
class ConflictError extends AppError {
  /**
   * Cria uma nova instância de erro de conflito
   * @param {string} message - Mensagem de erro
   * @param {boolean} isOperational - Indica se é um erro operacional
   */
  constructor(message = 'Recurso já existe ou está em conflito', isOperational = true) {
    super(message, 409, isOperational);
  }
}

module.exports = ConflictError;
