/**
 * Classe base para erros da aplicação
 * Estende a classe Error nativa do JavaScript
 */
class AppError extends Error {
  /**
   * Cria uma nova instância de erro da aplicação
   * @param {string} message - Mensagem de erro
   * @param {number} statusCode - Código de status HTTP (padrão: 500)
   * @param {boolean} isOperational - Indica se é um erro operacional conhecido ou um erro de programação
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'erro' : 'falha';
    this.isOperational = isOperational;
    
    // Captura a stack trace do erro
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
