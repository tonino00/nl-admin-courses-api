const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para criação de professor
exports.criarProfessorSchema = Joi.object({
  usuario: Joi.object({
    nome: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Nome deve ter pelo menos 3 caracteres',
      'string.max': 'Nome não pode ultrapassar 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
    
    email: schemas.email.required().messages({
      'any.required': 'Email é obrigatório'
    }),
    
    senha: schemas.senha.required().messages({
      'any.required': 'Senha é obrigatória'
    }),
    
    telefone: schemas.telefone,
    
    dataNascimento: schemas.data,
    
    fotoPerfil: Joi.string().uri(),
    
    cpf: schemas.cpf
  }).required().messages({
    'any.required': 'Dados do usuário são obrigatórios'
  }),
  
  registro: Joi.string().pattern(/^[A-Z0-9]{6,10}$/).messages({
    'string.pattern.base': 'Registro deve conter entre 6 e 10 caracteres alfanuméricos maiúsculos'
  }),
  
  dataContratacao: schemas.data,
  
  especialidade: Joi.string().required().messages({
    'any.required': 'Especialidade é obrigatória'
  }),
  
  formacao: Joi.string().valid('graduação', 'especialização', 'mestrado', 'doutorado', 'pós-doutorado')
    .required().messages({
      'any.required': 'Formação é obrigatória',
      'any.only': 'Formação deve ser uma das opções válidas'
    }),
  
  instituicaoFormacao: Joi.string(),
  
  biografia: Joi.string().max(1000).messages({
    'string.max': 'Biografia não pode ultrapassar 1000 caracteres'
  }),
  
  disponibilidade: Joi.array().items(
    Joi.object({
      diaSemana: Joi.number().integer().min(0).max(6).required(),
      horaInicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      horaFim: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    })
  ),
  
  endereco: Joi.object({
    rua: Joi.string().required(),
    numero: Joi.string().required(),
    complemento: Joi.string(),
    bairro: Joi.string().required(),
    cidade: Joi.string().required(),
    estado: Joi.string().length(2).required(),
    cep: Joi.string().pattern(/^\d{5}-\d{3}$/).required().messages({
      'string.pattern.base': 'CEP deve estar no formato 00000-000'
    })
  }),
  
  dadosBancarios: Joi.object({
    banco: Joi.string().required(),
    agencia: Joi.string().required(),
    conta: Joi.string().required(),
    tipoConta: Joi.string().valid('corrente', 'poupança').required()
  }),
  
  dadosAdicionais: Joi.object()
});

// Schema para atualização de professor
exports.atualizarProfessorSchema = Joi.object({
  usuario: Joi.object({
    nome: Joi.string().min(3).max(100),
    telefone: schemas.telefone,
    dataNascimento: schemas.data,
    fotoPerfil: Joi.string().uri(),
    cpf: schemas.cpf
  }),
  
  especialidade: Joi.string(),
  
  formacao: Joi.string().valid('graduação', 'especialização', 'mestrado', 'doutorado', 'pós-doutorado'),
  
  instituicaoFormacao: Joi.string(),
  
  biografia: Joi.string().max(1000).messages({
    'string.max': 'Biografia não pode ultrapassar 1000 caracteres'
  }),
  
  endereco: Joi.object({
    rua: Joi.string(),
    numero: Joi.string(),
    complemento: Joi.string(),
    bairro: Joi.string(),
    cidade: Joi.string(),
    estado: Joi.string().length(2),
    cep: Joi.string().pattern(/^\d{5}-\d{3}$/).messages({
      'string.pattern.base': 'CEP deve estar no formato 00000-000'
    })
  }),
  
  dadosBancarios: Joi.object({
    banco: Joi.string(),
    agencia: Joi.string(),
    conta: Joi.string(),
    tipoConta: Joi.string().valid('corrente', 'poupança')
  }),
  
  dadosAdicionais: Joi.object()
});

// Schema para atualização de disponibilidade
exports.atualizarDisponibilidadeSchema = Joi.array().items(
  Joi.object({
    diaSemana: Joi.number().integer().min(0).max(6).required().messages({
      'number.base': 'Dia da semana deve ser um número',
      'number.min': 'Dia da semana deve ser entre 0 (domingo) e 6 (sábado)',
      'number.max': 'Dia da semana deve ser entre 0 (domingo) e 6 (sábado)',
      'any.required': 'Dia da semana é obrigatório'
    }),
    horaInicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'Hora de início deve estar no formato HH:MM',
      'any.required': 'Hora de início é obrigatória'
    }),
    horaFim: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'Hora de fim deve estar no formato HH:MM',
      'any.required': 'Hora de fim é obrigatória'
    })
  })
).required().messages({
  'any.required': 'Disponibilidade é obrigatória'
});

// Schema para validar parâmetros de ID
exports.idParams = Joi.object({
  id: schemas.objectId.required().messages({
    'any.required': 'ID é obrigatório',
    'string.pattern.base': 'ID deve ser um ObjectId válido'
  })
});

// Schema para validar parâmetros de query para listagem
exports.listagemQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string(),
  nome: Joi.string(),
  especialidade: Joi.string(),
  formacao: Joi.string(),
  ativo: schemas.booleanString
});
