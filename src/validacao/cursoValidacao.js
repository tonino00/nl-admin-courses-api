const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para criação de curso
exports.criarCursoSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome não pode ultrapassar 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  
  descricao: Joi.string().max(1000).messages({
    'string.max': 'Descrição não pode ultrapassar 1000 caracteres'
  }),
  
  categoria: Joi.string().required().messages({
    'any.required': 'Categoria é obrigatória'
  }),
  
  cargaHoraria: Joi.number().integer().min(1).required().messages({
    'number.base': 'Carga horária deve ser um número',
    'number.integer': 'Carga horária deve ser um número inteiro',
    'number.min': 'Carga horária deve ser maior que zero',
    'any.required': 'Carga horária é obrigatória'
  }),
  
  nivel: Joi.string().valid('iniciante', 'intermediário', 'avançado').required().messages({
    'any.required': 'Nível é obrigatório',
    'any.only': 'Nível deve ser iniciante, intermediário ou avançado'
  }),
  
  dataInicio: schemas.data.required().messages({
    'any.required': 'Data de início é obrigatória'
  }),
  
  dataFim: schemas.data.required().messages({
    'any.required': 'Data de fim é obrigatória'
  }),
  
  preco: Joi.number().min(0).required().messages({
    'number.base': 'Preço deve ser um número',
    'number.min': 'Preço não pode ser negativo',
    'any.required': 'Preço é obrigatório'
  }),
  
  professor: schemas.objectId.required().messages({
    'any.required': 'Professor é obrigatório'
  }),
  
  vagas: Joi.number().integer().min(1).required().messages({
    'number.base': 'Número de vagas deve ser um número',
    'number.integer': 'Número de vagas deve ser um número inteiro',
    'number.min': 'Número de vagas deve ser maior que zero',
    'any.required': 'Número de vagas é obrigatório'
  }),
  
  status: Joi.string().valid('aberto', 'em_andamento', 'concluído', 'cancelado').default('aberto'),
  
  prerequisitos: Joi.array().items(Joi.string()),
  
  materiais: Joi.array().items(
    Joi.object({
      titulo: Joi.string().required(),
      tipo: Joi.string().valid('documento', 'vídeo', 'link', 'exercício').required(),
      url: Joi.string().uri().required(),
      descricao: Joi.string()
    })
  ),
  
  cronograma: Joi.array().items(
    Joi.object({
      titulo: Joi.string().required(),
      descricao: Joi.string(),
      data: schemas.data.required()
    })
  ),
  
  imagem: Joi.string().uri(),
  
  tags: Joi.array().items(Joi.string()),
  
  localizacao: Joi.object({
    tipo: Joi.string().valid('presencial', 'online', 'híbrido').required(),
    endereco: Joi.when('tipo', {
      is: Joi.string().valid('presencial', 'híbrido'),
      then: Joi.object({
        sala: Joi.string(),
        predio: Joi.string(),
        campus: Joi.string(),
        rua: Joi.string(),
        cidade: Joi.string(),
        estado: Joi.string().length(2),
        cep: Joi.string().pattern(/^\d{5}-\d{3}$/)
      }).required(),
      otherwise: Joi.object().optional()
    }),
    plataforma: Joi.when('tipo', {
      is: Joi.string().valid('online', 'híbrido'),
      then: Joi.object({
        nome: Joi.string().required(),
        url: Joi.string().uri().required()
      }).required(),
      otherwise: Joi.object().optional()
    })
  })
});

// Schema para atualização de curso
exports.atualizarCursoSchema = Joi.object({
  nome: Joi.string().min(3).max(100),
  
  descricao: Joi.string().max(1000),
  
  categoria: Joi.string(),
  
  cargaHoraria: Joi.number().integer().min(1),
  
  nivel: Joi.string().valid('iniciante', 'intermediário', 'avançado'),
  
  dataInicio: schemas.data,
  
  dataFim: schemas.data,
  
  preco: Joi.number().min(0),
  
  professor: schemas.objectId,
  
  vagas: Joi.number().integer().min(1),
  
  status: Joi.string().valid('aberto', 'em_andamento', 'concluído', 'cancelado'),
  
  prerequisitos: Joi.array().items(Joi.string()),
  
  materiais: Joi.array().items(
    Joi.object({
      titulo: Joi.string().required(),
      tipo: Joi.string().valid('documento', 'vídeo', 'link', 'exercício').required(),
      url: Joi.string().uri().required(),
      descricao: Joi.string()
    })
  ),
  
  cronograma: Joi.array().items(
    Joi.object({
      titulo: Joi.string().required(),
      descricao: Joi.string(),
      data: schemas.data.required()
    })
  ),
  
  imagem: Joi.string().uri(),
  
  tags: Joi.array().items(Joi.string()),
  
  localizacao: Joi.object({
    tipo: Joi.string().valid('presencial', 'online', 'híbrido'),
    endereco: Joi.object({
      sala: Joi.string(),
      predio: Joi.string(),
      campus: Joi.string(),
      rua: Joi.string(),
      cidade: Joi.string(),
      estado: Joi.string().length(2),
      cep: Joi.string().pattern(/^\d{5}-\d{3}$/)
    }),
    plataforma: Joi.object({
      nome: Joi.string(),
      url: Joi.string().uri()
    })
  })
});

// Schema para matrícula de aluno em curso
exports.matricularAlunoSchema = Joi.object({
  alunoId: schemas.objectId.required().messages({
    'any.required': 'ID do aluno é obrigatório'
  }),
  
  situacao: Joi.string().valid('ativo', 'pendente', 'trancado').default('ativo')
});

// Schema para cancelamento de matrícula
exports.cancelarMatriculaSchema = Joi.object({
  alunoId: schemas.objectId.required().messages({
    'any.required': 'ID do aluno é obrigatório'
  }),
  
  motivo: Joi.string().messages({
    'string.base': 'Motivo deve ser um texto'
  })
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
  categoria: Joi.string(),
  nivel: Joi.string(),
  status: Joi.string(),
  professor: schemas.objectId,
  dataInicio: schemas.data,
  dataFim: schemas.data,
  precoMin: Joi.number().min(0),
  precoMax: Joi.number().min(0)
});
