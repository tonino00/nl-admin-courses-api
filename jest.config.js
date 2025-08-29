/**
 * Configuração do Jest para testes
 */
module.exports = {
  // Diretório raiz para testes
  testEnvironment: 'node',
  
  // Padrão para arquivos de teste
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  
  // Ignorar diretórios
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/uploads/**',
    '!src/server.js',
    '!**/node_modules/**'
  ],
  
  // Timeout para testes
  testTimeout: 30000,
  
  // Setup para testes
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Mock de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
