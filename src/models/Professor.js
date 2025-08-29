const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  especialidade: {
    type: String,
    required: [true, 'Especialidade é obrigatória'],
    trim: true
  },
  formacaoAcademica: {
    titulo: String,
    instituicao: String,
    anoConclusao: Number,
    area: String
  },
  disponibilidade: [{
    diaSemana: {
      type: String,
      enum: ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
    },
    horaInicio: String,
    horaFim: String
  }],
  cursosLecionados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso'
  }],
  registrosPonto: [{
    data: {
      type: Date,
      default: Date.now
    },
    horaEntrada: Date,
    horaSaida: Date,
    observacoes: String,
    status: {
      type: String,
      enum: ['presente', 'falta', 'falta_justificada', 'atraso'],
      default: 'presente'
    }
  }],
  documentos: {
    cpf: {
      type: String,
      trim: true
    },
    rg: {
      type: String,
      trim: true
    }
  },
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String
  },
  telefone: {
    type: String,
    trim: true
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

const Professor = mongoose.model('Professor', professorSchema);

module.exports = Professor;
