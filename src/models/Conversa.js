const mongoose = require('mongoose');

const conversaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['individual', 'grupo', 'curso'],
    required: [true, 'Tipo de conversa é obrigatório'],
    default: 'individual'
  },
  participantes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    adicionadoEm: {
      type: Date,
      default: Date.now
    },
    adicionadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    papel: {
      type: String,
      enum: ['admin', 'membro'],
      default: 'membro'
    },
    ativo: {
      type: Boolean,
      default: true
    }
  }],
  cursoRelacionado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso'
  },
  ultimaMensagem: {
    conteudo: String,
    remetente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    dataEnvio: Date,
    tipo: {
      type: String,
      enum: ['texto', 'imagem', 'arquivo', 'notificacao'],
      default: 'texto'
    }
  },
  configuracoes: {
    notificacoes: {
      type: Boolean,
      default: true
    },
    arquivada: {
      type: Boolean,
      default: false
    },
    fixada: {
      type: Boolean,
      default: false
    },
    soLeituraParticipantes: {
      type: Boolean,
      default: false
    }
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  ativa: {
    type: Boolean,
    default: true
  },
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

const Conversa = mongoose.model('Conversa', conversaSchema);

module.exports = Conversa;
