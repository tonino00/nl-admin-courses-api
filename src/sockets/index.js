/**
 * Configuração do Socket.io para comunicação em tempo real
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Usuario = require('../models/Usuario');

// Armazena conexões ativas
const activeConnections = {};

/**
 * Inicializa o Socket.io com o servidor HTTP
 * @param {Object} server - Servidor HTTP
 * @returns {Object} - Instância do Socket.io
 */
const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: config.corsOrigin || '*', // Permitir origem definida em config ou qualquer origem
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware de autenticação para Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                   socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Acesso não autorizado'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      
      const user = await Usuario.findById(decoded.id).select('-senha');
      
      if (!user) {
        return next(new Error('Usuário não encontrado'));
      }
      
      // Anexar dados do usuário ao socket para uso posterior
      socket.user = user;
      next();
    } catch (error) {
      console.error('Erro de autenticação Socket.io:', error.message);
      next(new Error('Acesso não autorizado'));
    }
  });

  // Configurar eventos de conexão
  io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.user.nome} (${socket.user._id})`);
    
    // Registrar conexão ativa
    activeConnections[socket.user._id] = socket.id;
    
    // Entrar em salas específicas
    socket.join(`user_${socket.user._id}`); // Sala pessoal para o usuário
    
    if (socket.user.role === 'professor' || socket.user.role === 'admin') {
      socket.join('staff'); // Sala para equipe (professores e admins)
    }
    
    // Registrar handler para chat
    registerChatHandlers(io, socket);
    
    // Registrar handler para notificações
    registerNotificationHandlers(io, socket);
    
    // Tratamento de desconexão
    socket.on('disconnect', () => {
      console.log(`Usuário desconectado: ${socket.user.nome} (${socket.user._id})`);
      delete activeConnections[socket.user._id];
    });
  });

  return io;
};

/**
 * Registra os handlers para eventos de chat
 * @param {Object} io - Instância do Socket.io
 * @param {Object} socket - Socket do cliente conectado
 */
const registerChatHandlers = (io, socket) => {
  // Entrar em uma sala de chat específica
  socket.on('join_chat', (conversaId) => {
    socket.join(`chat_${conversaId}`);
    console.log(`${socket.user.nome} entrou na conversa ${conversaId}`);
  });
  
  // Sair de uma sala de chat
  socket.on('leave_chat', (conversaId) => {
    socket.leave(`chat_${conversaId}`);
    console.log(`${socket.user.nome} saiu da conversa ${conversaId}`);
  });
  
  // Enviar mensagem para uma sala de chat
  socket.on('send_message', async (data) => {
    try {
      const { conversaId, conteudo, tipo } = data;
      
      // Aqui você pode persistir a mensagem no banco de dados
      // e então emitir para todos na sala
      
      // Emitir para todos na sala de chat específica
      io.to(`chat_${conversaId}`).emit('new_message', {
        conversaId,
        mensagem: {
          conteudo,
          tipo,
          autor: {
            _id: socket.user._id,
            nome: socket.user.nome
          },
          timestamp: new Date()
        }
      });
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('error', { message: 'Erro ao processar mensagem' });
    }
  });
  
  // Indicar que o usuário está digitando
  socket.on('typing', (data) => {
    const { conversaId } = data;
    
    // Emitir para todos na sala exceto o emissor
    socket.to(`chat_${conversaId}`).emit('user_typing', {
      conversaId,
      usuario: {
        _id: socket.user._id,
        nome: socket.user.nome
      }
    });
  });
};

/**
 * Registra os handlers para eventos de notificação
 * @param {Object} io - Instância do Socket.io
 * @param {Object} socket - Socket do cliente conectado
 */
const registerNotificationHandlers = (io, socket) => {
  // Marcar notificação como lida
  socket.on('mark_notification_read', async (notificationId) => {
    try {
      // Lógica para marcar notificação como lida no banco de dados
      console.log(`${socket.user.nome} marcou a notificação ${notificationId} como lida`);
      
      // Confirmar para o cliente que a notificação foi marcada como lida
      socket.emit('notification_marked_read', { notificationId });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      socket.emit('error', { message: 'Erro ao processar notificação' });
    }
  });
};

/**
 * Envia uma notificação para um usuário específico
 * @param {String} userId - ID do usuário destinatário
 * @param {Object} notification - Objeto de notificação
 */
const sendNotification = (userId, notification) => {
  const socketId = activeConnections[userId];
  
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
  
  // Também emitir para sala pessoal do usuário
  // (caso esteja conectado em múltiplos dispositivos)
  io.to(`user_${userId}`).emit('notification', notification);
};

/**
 * Envia notificação para todos os usuários com um determinado papel
 * @param {String} role - Papel (aluno, professor, admin)
 * @param {Object} notification - Objeto de notificação
 */
const sendRoleNotification = (role, notification) => {
  if (role === 'professor' || role === 'admin') {
    io.to('staff').emit('notification', notification);
  } else {
    // Se precisar enviar para todos os alunos, precisaríamos
    // implementar uma sala específica ou outro mecanismo
  }
};

module.exports = {
  initializeSocket,
  sendNotification,
  sendRoleNotification
};
