const mongoose = require('mongoose');

const calendarioAcademicoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título do evento é obrigatório'],
    trim: true
  },
  descricao: {
    type: String
  },
  dataInicio: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  dataFim: {
    type: Date,
    required: [true, 'Data de término é obrigatória']
  },
  tipo: {
    type: String,
    enum: ['aula', 'prova', 'feriado', 'evento', 'reuniao', 'outro'],
    default: 'evento'
  },
  cursosRelacionados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso'
  }],
  cor: {
    type: String,
    default: '#3788d8'  // Cor padrão para eventos
  },
  diaInteiro: {
    type: Boolean,
    default: false
  },
  recorrente: {
    type: Boolean,
    default: false
  },
  padraoRecorrencia: {
    frequencia: {
      type: String,
      enum: ['diaria', 'semanal', 'mensal', 'anual'],
      default: 'semanal'
    },
    intervalo: {
      type: Number,
      default: 1
    },
    diasSemana: [{
      type: Number,  // 0-6 (Domingo-Sábado)
    }],
    dataFimRecorrencia: Date
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
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

const CalendarioAcademico = mongoose.model('CalendarioAcademico', calendarioAcademicoSchema);

module.exports = CalendarioAcademico;
