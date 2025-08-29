const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para criação de aluno
exports.criarAlunoSchema = Joi.object({
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
  
  matricula: Joi.string().pattern(/^[A-Z0-9]{8,12}$/).messages({
    'string.pattern.base': 'Matrícula deve conter entre 8 e 12 caracteres alfanuméricos maiúsculos'
  }),
  
  dataMatricula: schemas.data,
  
  responsavel: Joi.object({
    nome: Joi.string().min(3).max(100).required(),
    telefone: schemas.telefone.required(),
    email: schemas.email,
    parentesco: Joi.string().valid('pai', 'mãe', 'avô', 'avó', 'tio', 'tia', 'outro').required()
  }),
  
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
  
  dadosAdicionais: Joi.object()
});

// Schema para atualização de aluno
exports.atualizarAlunoSchema = Joi.object({
  usuario: Joi.object({
    nome: Joi.string().min(3).max(100),
    telefone: schemas.telefone,
    dataNascimento: schemas.data,
    fotoPerfil: Joi.string().uri(),
    cpf: schemas.cpf
  }),
  
  responsavel: Joi.object({
    nome: Joi.string().min(3).max(100),
    telefone: schemas.telefone,
    email: schemas.email,
    parentesco: Joi.string().valid('pai', 'mãe', 'avô', 'avó', 'tio', 'tia', 'outro')
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
  
  dadosAdicionais: Joi.object()
});

// Schema para matrícula em curso
exports.matricularEmCursoSchema = Joi.object({
  cursoId: schemas.objectId.required().messages({
    'any.required': 'ID do curso é obrigatório'
  }),
  
  dataMatricula: schemas.data,
  
  situacao: Joi.string().valid('ativo', 'pendente', 'trancado').default('ativo')
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
  matricula: Joi.string(),
  ativo: schemas.booleanString
});
