const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  titulo: {
    type: String,
    required: [true, 'Título da avaliação é obrigatório'],
    trim: true
  },
  descricao: {
    type: String
  },
  peso: {
    type: Number,
    required: [true, 'Peso da avaliação é obrigatório'],
    default: 1
  },
  dataAplicacao: {
    type: Date,
    required: [true, 'Data de aplicação é obrigatória']
  },
  tipo: {
    type: String,
    enum: ['prova', 'trabalho', 'projeto', 'seminario', 'participacao', 'outro'],
    default: 'prova'
  },
  notas: [{
    aluno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aluno',
      required: true
    },
    valor: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },
    observacoes: String,
    dataLancamento: {
      type: Date,
      default: Date.now
    }
  }],
  notaMaxima: {
    type: Number,
    default: 10
  },
  mediaAprovacao: {
    type: Number,
    default: 7
  },
  status: {
    type: String,
    enum: ['planejada', 'aplicada', 'corrigida', 'cancelada'],
    default: 'planejada'
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

const Avaliacao = mongoose.model('Avaliacao', avaliacaoSchema);

module.exports = Avaliacao;
