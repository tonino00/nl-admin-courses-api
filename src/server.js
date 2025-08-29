/**
 * Arquivo principal do servidor
 * Responsável por inicializar o servidor HTTP e integrar o Socket.io
 */

const http = require('http');
const config = require('./config/config');
const app = require('./app');
const { connectDB } = require('./config/database');
const { initializeSocket } = require('./sockets');

// Definir porta
const PORT = config.port || 3000;

// Criar servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.io
const io = initializeSocket(server);

// Disponibilizar a instância do Socket.io para o app
app.set('io', io);

// Iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDB();
    console.log('Conexão com o banco de dados estabelecida com sucesso');

    // Iniciar o servidor HTTP
    server.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Documentação da API disponível em http://localhost:${PORT}/api-docs`);
      console.log('Socket.io inicializado e pronto para conexões');
    });

  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratar eventos do processo
process.on('uncaughtException', (error) => {
  console.error('Erro não tratado:', error);
  // Graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Promise rejeitada não tratada:', error);
  // Graceful shutdown
  process.exit(1);
});

// Iniciar o servidor
startServer();
