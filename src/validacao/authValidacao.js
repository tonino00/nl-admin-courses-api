const Joi = require('joi');
const { schemas } = require('../utils/validacao');

// Schema para registro de usuário
exports.registroSchema = Joi.object({
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
  
  confirmarSenha: Joi.string().valid(Joi.ref('senha')).required().messages({
    'any.only': 'As senhas não coincidem',
    'any.required': 'Confirmação de senha é obrigatória'
  }),
  
  role: Joi.string().valid('admin', 'professor', 'aluno').default('aluno').messages({
    'any.only': 'Função deve ser admin, professor ou aluno'
  }),
  
  telefone: schemas.telefone,
  
  dataNascimento: schemas.data,
  
  fotoPerfil: Joi.string().uri(),
  
  cpf: schemas.cpf
});

// Schema para login
exports.loginSchema = Joi.object({
  email: schemas.email.required().messages({
    'any.required': 'Email é obrigatório'
  }),
  
  senha: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
});

// Schema para atualização de senha
exports.atualizarSenhaSchema = Joi.object({
  senhaAtual: Joi.string().required().messages({
    'any.required': 'Senha atual é obrigatória'
  }),
  
  novaSenha: schemas.senha.required().messages({
    'any.required': 'Nova senha é obrigatória'
  }),
  
  confirmarSenha: Joi.string().valid(Joi.ref('novaSenha')).required().messages({
    'any.only': 'As senhas não coincidem',
    'any.required': 'Confirmação de senha é obrigatória'
  })
});

// Schema para esqueceu senha
exports.esqueceuSenhaSchema = Joi.object({
  email: schemas.email.required().messages({
    'any.required': 'Email é obrigatório'
  })
});

// Schema para redefinir senha
exports.redefinirSenhaSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token é obrigatório'
  }),
  
  novaSenha: schemas.senha.required().messages({
    'any.required': 'Nova senha é obrigatória'
  }),
  
  confirmarSenha: Joi.string().valid(Joi.ref('novaSenha')).required().messages({
    'any.only': 'As senhas não coincidem',
    'any.required': 'Confirmação de senha é obrigatória'
  })
});
