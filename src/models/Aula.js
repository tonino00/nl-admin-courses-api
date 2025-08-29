const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema({
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  titulo: {
    type: String,
    required: [true, 'Título da aula é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    required: [true, 'Descrição da aula é obrigatória']
  },
  dataHora: {
    type: Date,
    required: [true, 'Data e hora são obrigatórias']
  },
  duracao: {
    type: Number, // em minutos
    required: [true, 'Duração é obrigatória']
  },
  conteudo: {
    type: String
  },
  recursos: [{
    titulo: String,
    tipo: {
      type: String,
      enum: ['documento', 'video', 'link', 'outro'],
      default: 'documento'
    },
    url: String,
    arquivo: String
  }],
  presenca: [{
    aluno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aluno'
    },
    status: {
      type: String,
      enum: ['presente', 'ausente', 'justificado'],
      default: 'ausente'
    },
    justificativa: String
  }],
  observacoes: String,
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

const Aula = mongoose.model('Aula', aulaSchema);

module.exports = Aula;
