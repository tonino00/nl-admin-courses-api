const Joi = require('joi');

/**
 * Função de validação genérica usando Joi
 * @param {Object} schema - Schema Joi para validação
 * @returns {Function} Middleware Express para validação
 */
exports.validar = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false, // Retornar todos os erros, não apenas o primeiro
      allowUnknown: true, // Permitir propriedades não especificadas no schema
      stripUnknown: false // Não remover propriedades não especificadas
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        mensagem: detail.message.replace(/['"]/g, ''),
        caminho: detail.path.join('.')
      }));
      
      return res.status(400).json({
        status: 'erro',
        mensagem: 'Dados de entrada inválidos',
        erros: errorDetails
      });
    }
    
    next();
  };
};

/**
 * Função de validação para parâmetros de rota
 * @param {Object} schema - Schema Joi para validação
 * @returns {Function} Middleware Express para validação
 */
exports.validarParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { 
      abortEarly: false, 
      allowUnknown: true, 
      stripUnknown: false
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        mensagem: detail.message.replace(/['"]/g, ''),
        caminho: detail.path.join('.')
      }));
      
      return res.status(400).json({
        status: 'erro',
        mensagem: 'Parâmetros de rota inválidos',
        erros: errorDetails
      });
    }
    
    next();
  };
};

/**
 * Função de validação para parâmetros de query (URL)
 * @param {Object} schema - Schema Joi para validação
 * @returns {Function} Middleware Express para validação
 */
exports.validarQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { 
      abortEarly: false, 
      allowUnknown: true, 
      stripUnknown: false
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        mensagem: detail.message.replace(/['"]/g, ''),
        caminho: detail.path.join('.')
      }));
      
      return res.status(400).json({
        status: 'erro',
        mensagem: 'Parâmetros de consulta inválidos',
        erros: errorDetails
      });
    }
    
    next();
  };
};

// Schemas de validação reutilizáveis para tipos comuns
exports.schemas = {
  // ID do MongoDB
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Deve ser um ObjectId válido'),
  
  // Paginação
  paginacao: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string()
  }),
  
  // Email
  email: Joi.string().email().message('Deve ser um email válido'),
  
  // Senha
  senha: Joi.string()
    .min(8).message('A senha deve ter pelo menos 8 caracteres')
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
    .message('A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial'),
  
  // Data
  data: Joi.date().iso().message('Deve ser uma data válida no formato ISO'),
  
  // Arquivo
  arquivo: Joi.object({
    nome: Joi.string().required(),
    tipo: Joi.string().required(),
    tamanho: Joi.number().integer().positive().required(),
    url: Joi.string().uri().required()
  }),
  
  // Telefone (BR)
  telefone: Joi.string()
    .pattern(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/)
    .message('Deve ser um telefone válido no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX'),
  
  // CPF
  cpf: Joi.string()
    .pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .message('Deve ser um CPF válido no formato XXX.XXX.XXX-XX'),
    
  // Boolean em string
  booleanString: Joi.string().valid('true', 'false')
};

// Utilitário para verificar role do usuário
exports.verificarRole = (roles = []) => {
  return (req, res, next) => {
    if (typeof roles === 'string') {
      roles = [roles];
    }

    if (roles.length && !roles.includes(req.usuario.role)) {
      return res.status(403).json({
        status: 'erro',
        mensagem: 'Você não tem permissão para acessar este recurso'
      });
    }

    next();
  };
};
