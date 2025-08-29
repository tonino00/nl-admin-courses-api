const AppError = require('./AppError');

/**
 * Erro para falhas de validação (400)
 */
class ValidationError extends AppError {
  /**
   * Cria uma nova instância de erro de validação
   * @param {string} message - Mensagem de erro
   * @param {Array|Object} errors - Lista de erros de validação ou objeto com detalhes
   * @param {boolean} isOperational - Indica se é um erro operacional
   */
  constructor(message = 'Dados de entrada inválidos', errors = null, isOperational = true) {
    super(message, 400, isOperational);
    this.errors = errors;
  }
}

module.exports = ValidationError;
