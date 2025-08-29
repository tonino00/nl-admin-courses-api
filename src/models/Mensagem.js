const mongoose = require('mongoose');

const mensagemSchema = new mongoose.Schema({
  conteudo: {
    type: String,
    required: [true, 'Conteúdo da mensagem é obrigatório']
  },
  tipo: {
    type: String,
    enum: ['texto', 'imagem', 'arquivo', 'notificacao'],
    default: 'texto'
  },
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Remetente é obrigatório']
  },
  destinatario: {
    tipo: {
      type: String,
      enum: ['usuario', 'grupo', 'curso', 'sistema'],
      required: [true, 'Tipo de destinatário é obrigatório']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'ID do destinatário é obrigatório']
    }
  },
  dataEnvio: {
    type: Date,
    default: Date.now
  },
  leituras: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    dataLeitura: {
      type: Date,
      default: Date.now
    }
  }],
  anexos: [{
    nome: String,
    tipo: String,
    tamanho: Number,
    url: String
  }],
  metadados: {
    // Campo para dados adicionais, como localização, etc.
    type: mongoose.Schema.Types.Mixed
  },
  respondendo: {
    // Referência a outra mensagem que esta está respondendo
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mensagem'
  },
  status: {
    type: String,
    enum: ['enviado', 'entregue', 'lido', 'erro'],
    default: 'enviado'
  },
  editado: {
    type: Boolean,
    default: false
  },
  excluido: {
    type: Boolean,
    default: false
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

const Mensagem = mongoose.model('Mensagem', mensagemSchema);

module.exports = Mensagem;
