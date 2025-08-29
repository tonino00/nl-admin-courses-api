const mongoose = require('mongoose');

const notificacaoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['sistema', 'curso', 'avaliacao', 'aula', 'matricula', 'mensagem', 'outro'],
    default: 'sistema'
  },
  titulo: {
    type: String,
    required: [true, 'Título da notificação é obrigatório'],
    trim: true
  },
  mensagem: {
    type: String,
    required: [true, 'Mensagem da notificação é obrigatória']
  },
  dataHora: {
    type: Date,
    default: Date.now
  },
  destinatarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    lida: {
      type: Boolean,
      default: false
    },
    dataLeitura: Date
  }],
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  link: {
    type: String
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  acao: {
    type: String,
    enum: ['nenhuma', 'confirmar', 'responder'],
    default: 'nenhuma'
  },
  entidadeRelacionada: {
    tipo: {
      type: String,
      enum: ['curso', 'aula', 'avaliacao', 'aluno', 'professor', 'usuario', 'mensagem', 'nenhum'],
      default: 'nenhum'
    },
    id: mongoose.Schema.Types.ObjectId
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  expiracaoEm: Date
}, {
  timestamps: {
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm'
  }
});

const Notificacao = mongoose.model('Notificacao', notificacaoSchema);

module.exports = Notificacao;
