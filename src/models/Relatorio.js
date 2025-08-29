const mongoose = require('mongoose');

const relatorioSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título do relatório é obrigatório'],
    trim: true
  },
  descricao: {
    type: String
  },
  tipo: {
    type: String,
    enum: ['desempenho', 'frequencia', 'financeiro', 'administrativo', 'personalizado'],
    required: [true, 'Tipo do relatório é obrigatório']
  },
  parametros: {
    // Parâmetros usados para gerar o relatório, como período, curso, etc.
    type: mongoose.Schema.Types.Mixed
  },
  dados: {
    // Dados do relatório em formato JSON
    type: mongoose.Schema.Types.Mixed
  },
  formato: {
    type: String,
    enum: ['pdf', 'csv', 'excel', 'json'],
    default: 'json'
  },
  dataGeracao: {
    type: Date,
    default: Date.now
  },
  periodoInicio: {
    type: Date
  },
  periodoFim: {
    type: Date
  },
  entidadesRelacionadas: {
    cursos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso'
    }],
    alunos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aluno'
    }],
    professores: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professor'
    }]
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Usuário que gerou o relatório é obrigatório']
  },
  acessivelPara: [{
    tipo: {
      type: String,
      enum: ['usuario', 'role'],
      required: true
    },
    valor: {
      type: String,
      required: true
    }
  }],
  arquivoUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['processando', 'concluido', 'erro'],
    default: 'processando'
  },
  mensagemErro: {
    type: String
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

const Relatorio = mongoose.model('Relatorio', relatorioSchema);

module.exports = Relatorio;
