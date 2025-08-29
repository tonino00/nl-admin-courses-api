const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  matricula: {
    type: String,
    required: [true, 'Número de matrícula é obrigatório'],
    unique: true,
    trim: true
  },
  documentos: {
    rg: {
      type: String,
      trim: true
    },
    cpf: {
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
  dataNascimento: {
    type: Date
  },
  cursosMatriculados: [{
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso'
    },
    dataMatricula: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ativo', 'concluido', 'trancado', 'desistente'],
      default: 'ativo'
    }
  }],
  historicoAcademico: [{
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso'
    },
    notaFinal: Number,
    frequencia: Number,
    status: {
      type: String,
      enum: ['aprovado', 'reprovado', 'em_andamento'],
      default: 'em_andamento'
    },
    observacoes: String,
    dataConclusao: Date
  }],
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

const Aluno = mongoose.model('Aluno', alunoSchema);

module.exports = Aluno;
