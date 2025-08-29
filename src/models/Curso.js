const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do curso é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    required: [true, 'Descrição do curso é obrigatória']
  },
  professorResponsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor',
    required: true
  },
  cargaHoraria: {
    type: Number,
    required: [true, 'Carga horária é obrigatória']
  },
  dataInicio: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  dataFim: {
    type: Date,
    required: [true, 'Data de término é obrigatória']
  },
  status: {
    type: String,
    enum: ['ativo', 'concluido', 'cancelado', 'em_planejamento'],
    default: 'em_planejamento'
  },
  alunosMatriculados: [{
    aluno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aluno'
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
  aulas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aula'
  }],
  materialDidatico: [{
    titulo: String,
    descricao: String,
    tipo: {
      type: String,
      enum: ['documento', 'video', 'link', 'outro']
    },
    url: String,
    arquivo: String,
    dataUpload: {
      type: Date,
      default: Date.now
    }
  }],
  avaliacoes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Avaliacao'
  }],
  categorias: [String],
  vagas: {
    type: Number,
    default: 30
  },
  vagasDisponiveis: {
    type: Number,
    default: function() {
      return this.vagas;
    }
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

// Middleware para atualizar vagas disponíveis quando alunos são matriculados
cursoSchema.pre('save', function(next) {
  if (this.isModified('alunosMatriculados')) {
    const alunosAtivos = this.alunosMatriculados.filter(
      matricula => matricula.status === 'ativo'
    ).length;
    this.vagasDisponiveis = Math.max(0, this.vagas - alunosAtivos);
  }
  next();
});

const Curso = mongoose.model('Curso', cursoSchema);

module.exports = Curso;
