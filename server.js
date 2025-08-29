require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config/config');
const connectDB = require('./src/config/database');

// Conectar ao banco de dados
connectDB();

// Inicializar o servidor
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando no modo ${config.env} na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('ERRO NÃO TRATADO! 💥 Fechando servidor...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
