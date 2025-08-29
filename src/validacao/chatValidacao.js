const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para criação de conversa
exports.criarConversaSchema = Joi.object({
  titulo: Joi.string().max(100),
  
  tipo: Joi.string().valid('individual', 'grupo', 'curso').required().messages({
    'any.required': 'Tipo de conversa é obrigatório',
    'any.only': 'Tipo de conversa deve ser individual, grupo ou curso'
  }),
  
  participantes: Joi.array().items(schemas.objectId).when('tipo', {
    is: 'individual',
    then: Joi.array().length(1).required().messages({
      'array.length': 'Conversas individuais devem ter exatamente 1 participante',
      'any.required': 'Participante é obrigatório para conversas individuais'
    }),
    otherwise: Joi.array().min(1).messages({
      'array.min': 'É necessário pelo menos 1 participante'
    })
  }),
  
  cursoRelacionado: Joi.when('tipo', {
    is: 'curso',
    then: schemas.objectId.required().messages({
      'any.required': 'Curso relacionado é obrigatório para conversas do tipo curso'
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Curso relacionado só é permitido para conversas do tipo curso'
    })
  }),
  
  mensagemInicial: Joi.string().max(2000).messages({
    'string.max': 'Mensagem inicial não pode ultrapassar 2000 caracteres'
  }),
  
  configuracoes: Joi.object({
    notificacoes: Joi.boolean(),
    arquivada: Joi.boolean(),
    fixada: Joi.boolean(),
    soLeituraParticipantes: Joi.boolean()
  })
});

// Schema para adicionar participantes
exports.adicionarParticipantesSchema = Joi.object({
  participantes: Joi.array().items(schemas.objectId).min(1).required().messages({
    'array.min': 'É necessário pelo menos 1 participante',
    'any.required': 'Participantes são obrigatórios'
  })
});

// Schema para envio de mensagem
exports.enviarMensagemSchema = Joi.object({
  conteudo: Joi.string().max(5000).required().messages({
    'string.max': 'Mensagem não pode ultrapassar 5000 caracteres',
    'any.required': 'Conteúdo da mensagem é obrigatório'
  }),
  
  tipo: Joi.string().valid('texto', 'imagem', 'arquivo', 'notificacao').default('texto'),
  
  anexos: Joi.array().items(
    Joi.object({
      nome: Joi.string().required(),
      tipo: Joi.string().required(),
      tamanho: Joi.number().integer().positive().required(),
      url: Joi.string().uri().required()
    })
  ),
  
  respondendo: schemas.objectId
});

// Schema para arquivar/desarquivar conversa
exports.arquivarConversaSchema = Joi.object({
  arquivada: Joi.boolean().required().messages({
    'any.required': 'Status de arquivamento é obrigatório'
  })
});

// Schema para validar parâmetros de ID
exports.idParams = Joi.object({
  id: schemas.objectId.required().messages({
    'any.required': 'ID é obrigatório',
    'string.pattern.base': 'ID deve ser um ObjectId válido'
  })
});

// Schema para validar ID de usuário nos parâmetros
exports.usuarioIdParams = Joi.object({
  usuarioId: schemas.objectId.required().messages({
    'any.required': 'ID do usuário é obrigatório',
    'string.pattern.base': 'ID do usuário deve ser um ObjectId válido'
  })
});

// Schema para validar parâmetros de query para listagem de conversas
exports.listagemConversasQuery = Joi.object({
  arquivadas: schemas.booleanString
});

// Schema para validar parâmetros de query para listagem de mensagens
exports.listagemMensagensQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  antes: schemas.data
});
