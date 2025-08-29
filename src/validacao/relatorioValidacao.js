const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para criação de relatório
exports.criarRelatorioSchema = Joi.object({
  titulo: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Título deve ter pelo menos 3 caracteres',
    'string.max': 'Título não pode ultrapassar 100 caracteres',
    'any.required': 'Título é obrigatório'
  }),
  
  descricao: Joi.string().max(500).messages({
    'string.max': 'Descrição não pode ultrapassar 500 caracteres'
  }),
  
  tipo: Joi.string().valid(
    'desempenho',
    'frequencia',
    'financeiro',
    'administrativo',
    'personalizado'
  ).required().messages({
    'any.required': 'Tipo do relatório é obrigatório',
    'any.only': 'Tipo do relatório deve ser um valor válido'
  }),
  
  parametros: Joi.object(),
  
  formato: Joi.string().valid('pdf', 'csv', 'excel', 'json').default('json'),
  
  periodoInicio: schemas.data,
  
  periodoFim: schemas.data,
  
  entidadesRelacionadas: Joi.object({
    cursos: Joi.array().items(schemas.objectId),
    alunos: Joi.array().items(schemas.objectId),
    professores: Joi.array().items(schemas.objectId)
  }),
  
  acessivelPara: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('usuario', 'role').required(),
      valor: Joi.string().required()
    })
  ).default([{ tipo: 'role', valor: 'admin' }])
});

// Schema para atualização de relatório
exports.atualizarRelatorioSchema = Joi.object({
  titulo: Joi.string().min(3).max(100),
  
  descricao: Joi.string().max(500),
  
  acessivelPara: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('usuario', 'role').required(),
      valor: Joi.string().required()
    })
  )
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
  tipo: Joi.string().valid(
    'desempenho',
    'frequencia',
    'financeiro',
    'administrativo',
    'personalizado'
  ),
  dataInicio: schemas.data,
  dataFim: schemas.data
});
