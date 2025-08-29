/**
 * Configurações iniciais para testes
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;
process.env.MONGO_URI = 'mongodb://localhost:27017/nl-admin-courses-test';
process.env.JWT_SECRET = 'segredo-super-secreto-para-testes';
process.env.JWT_EXPIRES_IN = '1h';

// Aumentar o timeout do Jest para testes de integração
jest.setTimeout(30000);

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
