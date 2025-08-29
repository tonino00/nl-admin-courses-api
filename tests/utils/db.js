/**
 * Utilitários para testes de banco de dados
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Instância do servidor MongoDB em memória
let mongoServer;

/**
 * Conecta ao banco de dados de teste em memória
 * Deve ser chamada antes dos testes
 */
const conectarDB = async () => {
  // Criar servidor MongoDB em memória
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar ao MongoDB
  await mongoose.connect(mongoUri);
};

/**
 * Limpa todas as coleções do banco de dados
 * Útil para executar entre testes
 */
const limparBancoDeDados = async () => {
  const colecoes = mongoose.connection.collections;
  
  for (const key in colecoes) {
    const colecao = colecoes[key];
    await colecao.deleteMany({});
  }
};

/**
 * Desconecta do banco de dados e fecha o servidor MongoDB em memória
 * Deve ser chamada após os testes
 */
const desconectarDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
};

/**
 * Popula o banco de dados com dados de teste
 * @param {Object} modelo - Modelo Mongoose
 * @param {Array} dados - Dados para inserir
 * @returns {Array} Documentos criados
 */
const popularDados = async (modelo, dados) => {
  return await modelo.create(dados);
};

module.exports = {
  conectarDB,
  limparBancoDeDados,
  desconectarDB,
  popularDados
};
