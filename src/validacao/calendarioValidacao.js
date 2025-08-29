const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para criação de evento no calendário
exports.criarEventoSchema = Joi.object({
  titulo: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Título deve ter pelo menos 3 caracteres',
    'string.max': 'Título não pode ultrapassar 100 caracteres',
    'any.required': 'Título é obrigatório'
  }),
  
  descricao: Joi.string().max(1000).messages({
    'string.max': 'Descrição não pode ultrapassar 1000 caracteres'
  }),
  
  tipo: Joi.string().valid(
    'aula',
    'prova',
    'evento',
    'feriado',
    'recesso',
    'reuniao',
    'prazo',
    'outro'
  ).required().messages({
    'any.required': 'Tipo do evento é obrigatório',
    'any.only': 'Tipo do evento deve ser um valor válido'
  }),
  
  dataInicio: schemas.data.required().messages({
    'any.required': 'Data de início é obrigatória'
  }),
  
  dataFim: schemas.data.messages({
    'date.base': 'Data de fim deve ser uma data válida'
  }),
  
  recorrencia: Joi.object({
    tipo: Joi.string().valid('diaria', 'semanal', 'mensal', 'anual').required(),
    intervalo: Joi.number().integer().min(1).required(),
    diasSemana: Joi.array().items(Joi.number().integer().min(0).max(6)),
    dataFim: schemas.data,
    ocorrencias: Joi.number().integer().min(1)
  }),
  
  diaInteiro: Joi.boolean().default(false),
  
  local: Joi.string(),
  
  cor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).messages({
    'string.pattern.base': 'Cor deve ser um código hexadecimal válido (ex: #FF5733)'
  }),
  
  prioridade: Joi.string().valid('baixa', 'media', 'alta').default('media'),
  
  cursos: Joi.array().items(schemas.objectId),
  
  participantes: Joi.array().items(schemas.objectId),
  
  lembrete: Joi.object({
    ativo: Joi.boolean().default(true),
    tempoAntecedencia: Joi.number().integer().min(5).default(30),
    unidade: Joi.string().valid('minutos', 'horas', 'dias').default('minutos')
  })
});

// Schema para atualização de evento
exports.atualizarEventoSchema = Joi.object({
  titulo: Joi.string().min(3).max(100),
  
  descricao: Joi.string().max(1000),
  
  tipo: Joi.string().valid(
    'aula',
    'prova',
    'evento',
    'feriado',
    'recesso',
    'reuniao',
    'prazo',
    'outro'
  ),
  
  dataInicio: schemas.data,
  
  dataFim: schemas.data,
  
  recorrencia: Joi.object({
    tipo: Joi.string().valid('diaria', 'semanal', 'mensal', 'anual'),
    intervalo: Joi.number().integer().min(1),
    diasSemana: Joi.array().items(Joi.number().integer().min(0).max(6)),
    dataFim: schemas.data,
    ocorrencias: Joi.number().integer().min(1)
  }),
  
  diaInteiro: Joi.boolean(),
  
  local: Joi.string(),
  
  cor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  
  prioridade: Joi.string().valid('baixa', 'media', 'alta'),
  
  cursos: Joi.array().items(schemas.objectId),
  
  participantes: Joi.array().items(schemas.objectId),
  
  lembrete: Joi.object({
    ativo: Joi.boolean(),
    tempoAntecedencia: Joi.number().integer().min(5),
    unidade: Joi.string().valid('minutos', 'horas', 'dias')
  })
});

// Schema para validar parâmetros de ID
exports.idParams = Joi.object({
  id: schemas.objectId.required().messages({
    'any.required': 'ID é obrigatório',
    'string.pattern.base': 'ID deve ser um ObjectId válido'
  })
});

// Schema para validar ID de curso nos parâmetros
exports.cursoIdParams = Joi.object({
  cursoId: schemas.objectId.required().messages({
    'any.required': 'ID do curso é obrigatório',
    'string.pattern.base': 'ID do curso deve ser um ObjectId válido'
  })
});

// Schema para validar parâmetros de query para listagem
exports.listagemQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string(),
  tipo: Joi.string(),
  dataInicio: schemas.data,
  dataFim: schemas.data,
  curso: schemas.objectId,
  prioridade: Joi.string().valid('baixa', 'media', 'alta')
});
