const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, forneça um email válido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: 6,
    select: false // Não incluir senha nas consultas
  },
  role: {
    type: String,
    enum: ['admin', 'professor', 'aluno'],
    default: 'aluno'
  },
  fotoPerfil: {
    type: String,
    default: 'default.jpg'
  },
  resetSenhaToken: String,
  resetSenhaExpiracao: Date,
  criadoEm: {
    type: Date,
    default: Date.now
  },
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm'
  }
});

// Criptografar senha antes de salvar
usuarioSchema.pre('save', async function(next) {
  // Só executa se a senha foi modificada
  if (!this.isModified('senha')) return next();

  // Gerar salt e hash
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para comparar senha
usuarioSchema.methods.compararSenha = async function(senha) {
  return await bcrypt.compare(senha, this.senha);
};

// Método para gerar token JWT
usuarioSchema.methods.gerarToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
