const { AppError } = require('../utils/errors');

/**
 * Formata erros do Mongoose para um formato padronizado
 * @param {Error} err - Erro original do Mongoose
 * @returns {Object} Erro formatado
 */
const handleMongooseError = (err) => {
  // Erros de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    
    return {
      message: 'Erro de validação',
      errors,
      statusCode: 400
    };
  }
  
  // Erro de documento não encontrado
  if (err.name === 'DocumentNotFoundError') {
    return {
      message: 'Documento não encontrado',
      statusCode: 404
    };
  }
  
  // Erro de cast (ObjectId inválido)
  if (err.name === 'CastError') {
    return {
      message: `Formato inválido para o campo ${err.path}: ${err.value}`,
      statusCode: 400
    };
  }
  
  // Erro de chave duplicada (índice único)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return {
      message: `Campo duplicado: ${field} com valor '${value}' já existe`,
      statusCode: 409
    };
  }
  
  return null;
};

/**
 * Formata erros de JWT para um formato padronizado
 * @param {Error} err - Erro original do JWT
 * @returns {Object} Erro formatado
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return {
      message: 'Token inválido. Por favor, faça login novamente',
      statusCode: 401
    };
  }
  
  if (err.name === 'TokenExpiredError') {
    return {
      message: 'Sua sessão expirou. Por favor, faça login novamente',
      statusCode: 401
    };
  }
  
  return null;
};

/**
 * Formata erros de desenvolvimento com detalhes completos
 * @param {Error} err - Erro original
 * @param {Object} res - Objeto de resposta Express
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    stack: err.stack,
    error: err
  });
};

/**
 * Formata erros de produção com mensagens mais amigáveis e sem detalhes sensíveis
 * @param {Error} err - Erro original
 * @param {Object} res - Objeto de resposta Express
 */
const sendErrorProd = (err, res) => {
  // Erros operacionais: enviar mensagem para o cliente
  if (err.isOperational) {
    const response = {
      status: err.status || 'error',
      message: err.message
    };
    
    // Adiciona erros detalhados se existirem (para erros de validação)
    if (err.errors) {
      response.errors = err.errors;
    }
    
    // Adiciona campo retryAfter para erros de rate limit
    if (err.retryAfter) {
      response.retryAfter = err.retryAfter;
      res.set('Retry-After', err.retryAfter.toString());
    }
    
    return res.status(err.statusCode || 500).json(response);
  }
  
  // Erros de programação/desconhecidos: não vazar detalhes
  console.error('ERRO NÃO OPERACIONAL:', err);
  res.status(500).json({
    status: 'error',
    message: 'Algo deu errado'
  });
};

/**
 * Middleware global para tratamento de erros
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Verificar ambiente de execução
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // Criar uma cópia do erro para não modificar o original
    let error = { ...err };
    error.message = err.message;
    
    // Verificar e formatar erros conhecidos
    const mongooseError = handleMongooseError(err);
    if (mongooseError) {
      error.message = mongooseError.message;
      error.statusCode = mongooseError.statusCode;
      error.errors = mongooseError.errors;
    }
    
    const jwtError = handleJWTError(err);
    if (jwtError) {
      error.message = jwtError.message;
      error.statusCode = jwtError.statusCode;
    }
    
    // Enviar resposta formatada
    sendErrorProd(error, res);
  }
};
