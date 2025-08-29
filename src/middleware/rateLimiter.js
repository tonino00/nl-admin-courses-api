/**
 * Middleware de limitação de taxa (Rate Limiter)
 * Protege contra ataques de força bruta e abuso de API
 */

const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

/**
 * Configuração básica para limite de requisições
 * @param {Object} options - Opções de configuração do limitador
 * @returns {Function} - Middleware de limitação
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // Padrão: 15 minutos
    max: options.max || 100, // Limite de requisições por IP
    standardHeaders: true, // Retornar info de limite nos cabeçalhos `RateLimit-*`
    legacyHeaders: false, // Desabilitar cabeçalhos `X-RateLimit-*` (legado)
    message: {
      status: 'error',
      message: options.message || 'Muitas requisições deste IP, tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res, next, options) => {
      next(new RateLimitError(options.message || 'Muitas requisições deste IP, tente novamente mais tarde.'));
    },
    // Opcionalmente, use uma store personalizada (Redis, etc.) para aplicações em cluster
    // store: ...
    ...options
  });
};

/**
 * Limitador para rotas de autenticação (login, registro, reset de senha)
 * Configuração mais restritiva para proteger contra ataques de força bruta
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 tentativas por 15 minutos
  message: 'Muitas tentativas de autenticação, tente novamente após 15 minutos.'
});

/**
 * Limitador para endpoints de API geral
 * Configuração mais permissiva para uso normal da API
 */
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  message: 'Muitas requisições, tente novamente após alguns instantes.'
});

/**
 * Limitador para operações administrativas sensíveis
 */
const adminLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // 30 requisições por hora para operações admin
  message: 'Limite de operações administrativas excedido, tente novamente mais tarde.'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  adminLimiter
};
