const AppError = require('./AppError');

/**
 * Erro para limite de requisições excedido (429)
 */
class RateLimitError extends AppError {
  /**
   * Cria uma nova instância de erro de limite de requisições
   * @param {string} message - Mensagem de erro
   * @param {number} retryAfter - Tempo em segundos para tentar novamente
   * @param {boolean} isOperational - Indica se é um erro operacional
   */
  constructor(message = 'Limite de requisições excedido', retryAfter = 60, isOperational = true) {
    super(message, 429, isOperational);
    this.retryAfter = retryAfter;
  }
}

module.exports = RateLimitError;
