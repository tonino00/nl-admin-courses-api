const AppError = require('./AppError');

/**
 * Erro para falhas de autenticação (401)
 */
class AuthenticationError extends AppError {
  /**
   * Cria uma nova instância de erro de autenticação
   * @param {string} message - Mensagem de erro
   * @param {boolean} isOperational - Indica se é um erro operacional
   */
  constructor(message = 'Não autenticado', isOperational = true) {
    super(message, 401, isOperational);
  }
}

module.exports = AuthenticationError;
