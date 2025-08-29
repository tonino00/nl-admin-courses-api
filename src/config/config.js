/**
 * Configurações da aplicação
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nl-admin-courses'
};

module.exports = config;
