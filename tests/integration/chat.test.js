/**
 * Testes para o módulo de Chat
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuariosPorPapel } = require('../utils/auth');
const Chat = require('../../src/models/Chat');
const Mensagem = require('../../src/models/Mensagem');

// Configuração antes de todos os testes
beforeAll(async () => {
  await conectarDB();
});

// Limpar o banco de dados antes de cada teste
beforeEach(async () => {
  await limparBancoDeDados();
});

// Desconectar do banco após todos os testes
afterAll(async () => {
  await desconectarDB();
});

describe('Módulo de Chat', () => {
  let usuariosAutenticados;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
  });

  describe('GET /api/chats', () => {
    test('deve listar chats do usuário autenticado', async () => {
      // Criar alguns chats para teste
      await Chat.create([
        {
          tipo: 'individual',
          participantes: [
            usuariosAutenticados.aluno.usuario._id,
            usuariosAutenticados.professor.usuario._id
          ],
          ultimaMensagem: {
            conteudo: 'Olá, como vai?',
            remetente: usuariosAutenticados.professor.usuario._id,
            dataEnvio: new Date()
          }
        },
        {
          tipo: 'individual',
          participantes: [
            usuariosAutenticados.aluno.usuario._id,
            usuariosAutenticados.admin.usuario._id
          ],
          ultimaMensagem: {
            conteudo: 'Preciso da sua ajuda',
            remetente: usuariosAutenticados.aluno.usuario._id,
            dataEnvio: new Date()
          }
        }
      ]);
      
      // Fazer requisição como aluno
      const res = await apiClient.get('/api/chats', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 2);
      expect(Array.isArray(res.body.data.chats)).toBe(true);
      expect(res.body.data.chats).toHaveLength(2);
      
      // Verificar se o último participante (não o usuário autenticado) está incluído
      const primeiroChat = res.body.data.chats[0];
      expect(primeiroChat).toHaveProperty('outroParticipante');
    });
    
    test('deve retornar lista vazia quando não há chats', async () => {
      const res = await apiClient.get('/api/chats', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resultados', 0);
      expect(res.body.data.chats).toHaveLength(0);
    });
  });
  
  describe('POST /api/chats', () => {
    test('deve criar um novo chat individual', async () => {
      const dadosChat = {
        tipo: 'individual',
        participanteId: usuariosAutenticados.professor.usuario._id.toString()
      };
      
      const res = await apiClient.post('/api/chats', dadosChat, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('chat');
      expect(res.body.data.chat).toHaveProperty('tipo', dadosChat.tipo);
      expect(res.body.data.chat.participantes).toContain(usuariosAutenticados.aluno.usuario._id.toString());
      expect(res.body.data.chat.participantes).toContain(dadosChat.participanteId);
    });
    
    test('deve criar um chat de grupo', async () => {
      // Criar alguns usuários extras para o grupo
      const usuario1 = await mongoose.model('Usuario').create({
        nome: 'Participante 1',
        email: 'participante1@example.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      const usuario2 = await mongoose.model('Usuario').create({
        nome: 'Participante 2',
        email: 'participante2@example.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      const dadosChat = {
        tipo: 'grupo',
        nome: 'Grupo de Estudos',
        participantesIds: [
          usuario1._id.toString(),
          usuario2._id.toString(),
          usuariosAutenticados.professor.usuario._id.toString()
        ]
      };
      
      const res = await apiClient.post('/api/chats', dadosChat, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.chat).toHaveProperty('tipo', 'grupo');
      expect(res.body.data.chat).toHaveProperty('nome', dadosChat.nome);
      expect(res.body.data.chat.participantes).toHaveLength(4); // 3 + o criador
      expect(res.body.data.chat.participantes).toContain(usuariosAutenticados.aluno.usuario._id.toString());
      expect(res.body.data.chat.admin).toBe(usuariosAutenticados.aluno.usuario._id.toString());
    });
    
    test('deve evitar criar chat duplicado entre mesmos usuários', async () => {
      // Criar um chat existente
      await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Tentar criar o mesmo chat novamente
      const dadosChat = {
        tipo: 'individual',
        participanteId: usuariosAutenticados.professor.usuario._id.toString()
      };
      
      const res = await apiClient.post('/api/chats', dadosChat, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200); // Não cria novo, retorna o existente
      expect(res.body.data).toHaveProperty('chat');
      expect(res.body.data.chat.participantes).toContain(usuariosAutenticados.aluno.usuario._id.toString());
      expect(res.body.data.chat.participantes).toContain(dadosChat.participanteId);
    });
  });
  
  describe('GET /api/chats/:id', () => {
    test('deve retornar detalhes de um chat específico', async () => {
      // Criar um chat para teste
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Fazer requisição como aluno
      const res = await apiClient.get(`/api/chats/${chat._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('chat');
      expect(res.body.data.chat).toHaveProperty('_id', chat._id.toString());
      expect(res.body.data.chat).toHaveProperty('tipo', chat.tipo);
    });
    
    test('deve negar acesso a chat que o usuário não participa', async () => {
      // Criar um chat entre outros usuários
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.admin.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Tentar acessar como aluno
      const res = await apiClient.get(`/api/chats/${chat._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('GET /api/chats/:id/mensagens', () => {
    test('deve listar mensagens de um chat', async () => {
      // Criar um chat para teste
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Criar algumas mensagens para o chat
      await Mensagem.create([
        {
          chat: chat._id,
          remetente: usuariosAutenticados.professor.usuario._id,
          conteudo: 'Olá, tudo bem?',
          dataEnvio: new Date(Date.now() - 1000 * 60 * 60) // 1 hora atrás
        },
        {
          chat: chat._id,
          remetente: usuariosAutenticados.aluno.usuario._id,
          conteudo: 'Olá professor, tudo bem!',
          dataEnvio: new Date(Date.now() - 1000 * 60 * 30) // 30 min atrás
        },
        {
          chat: chat._id,
          remetente: usuariosAutenticados.professor.usuario._id,
          conteudo: 'Tenho uma dúvida sobre a aula',
          dataEnvio: new Date() // Agora
        }
      ]);
      
      // Fazer requisição como aluno
      const res = await apiClient.get(`/api/chats/${chat._id}/mensagens`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 3);
      expect(Array.isArray(res.body.data.mensagens)).toBe(true);
      expect(res.body.data.mensagens).toHaveLength(3);
      
      // Verificar se as mensagens estão em ordem cronológica (mais antiga primeiro)
      const mensagens = res.body.data.mensagens;
      expect(new Date(mensagens[0].dataEnvio).getTime()).toBeLessThan(
        new Date(mensagens[1].dataEnvio).getTime()
      );
      expect(new Date(mensagens[1].dataEnvio).getTime()).toBeLessThan(
        new Date(mensagens[2].dataEnvio).getTime()
      );
    });
    
    test('deve suportar paginação de mensagens', async () => {
      // Criar um chat para teste
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Criar 15 mensagens para o chat
      const mensagens = [];
      for (let i = 0; i < 15; i++) {
        mensagens.push({
          chat: chat._id,
          remetente: i % 2 === 0 ? usuariosAutenticados.aluno.usuario._id : usuariosAutenticados.professor.usuario._id,
          conteudo: `Mensagem de teste ${i+1}`,
          dataEnvio: new Date(Date.now() - (15 - i) * 1000 * 60) // Mais recentes por último
        });
      }
      await Mensagem.create(mensagens);
      
      // Obter primeira página (limite padrão 10)
      const res1 = await apiClient.get(`/api/chats/${chat._id}/mensagens`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res1.statusCode).toBe(200);
      expect(res1.body).toHaveProperty('resultados', 10);
      expect(res1.body.data.mensagens).toHaveLength(10);
      expect(res1.body).toHaveProperty('paginacao');
      expect(res1.body.paginacao).toHaveProperty('proxPagina');
      
      // Obter segunda página
      const res2 = await apiClient.get(`/api/chats/${chat._id}/mensagens?pagina=2`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res2.statusCode).toBe(200);
      expect(res2.body).toHaveProperty('resultados', 5);
      expect(res2.body.data.mensagens).toHaveLength(5);
    });
  });
  
  describe('POST /api/chats/:id/mensagens', () => {
    test('deve enviar uma nova mensagem de texto', async () => {
      // Criar um chat para teste
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      const dadosMensagem = {
        tipo: 'texto',
        conteudo: 'Esta é uma mensagem de teste'
      };
      
      const res = await apiClient.post(`/api/chats/${chat._id}/mensagens`, dadosMensagem, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('mensagem');
      expect(res.body.data.mensagem).toHaveProperty('conteudo', dadosMensagem.conteudo);
      expect(res.body.data.mensagem).toHaveProperty('remetente', usuariosAutenticados.aluno.usuario._id.toString());
      expect(res.body.data.mensagem).toHaveProperty('lida', false);
      
      // Verificar se o chat foi atualizado com a última mensagem
      const chatAtualizado = await Chat.findById(chat._id);
      expect(chatAtualizado.ultimaMensagem).toBeDefined();
      expect(chatAtualizado.ultimaMensagem.conteudo).toBe(dadosMensagem.conteudo);
    });
    
    test('deve suportar upload de anexo com mensagem', async () => {
      // Criar um chat para teste
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Simular upload de arquivo
      const anexo = {
        fieldname: 'anexo',
        originalname: 'documento.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        destination: './uploads/mensagens',
        filename: 'documento-12345.pdf',
        path: 'uploads/mensagens/documento-12345.pdf',
        size: 12345
      };
      
      const dadosMensagem = {
        tipo: 'arquivo',
        conteudo: 'Enviando um documento importante',
        anexo: JSON.stringify(anexo) // Simular o anexo processado pelo multer
      };
      
      const res = await apiClient.post(`/api/chats/${chat._id}/mensagens`, dadosMensagem, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.mensagem).toHaveProperty('tipo', 'arquivo');
      expect(res.body.data.mensagem).toHaveProperty('anexo');
      expect(res.body.data.mensagem.anexo).toHaveProperty('originalname', 'documento.pdf');
    });
    
    test('deve impedir envio de mensagem em chat que usuário não participa', async () => {
      // Criar um chat entre outros usuários
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.admin.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      const dadosMensagem = {
        tipo: 'texto',
        conteudo: 'Tentativa de mensagem'
      };
      
      // Tentar enviar mensagem como aluno
      const res = await apiClient.post(`/api/chats/${chat._id}/mensagens`, dadosMensagem, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('PATCH /api/chats/:id/mensagens/lidas', () => {
    test('deve marcar todas mensagens como lidas', async () => {
      // Criar um chat para teste
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Criar mensagens não lidas
      await Mensagem.create([
        {
          chat: chat._id,
          remetente: usuariosAutenticados.professor.usuario._id,
          conteudo: 'Mensagem 1',
          dataEnvio: new Date(Date.now() - 1000 * 60 * 60),
          lida: false
        },
        {
          chat: chat._id,
          remetente: usuariosAutenticados.professor.usuario._id,
          conteudo: 'Mensagem 2',
          dataEnvio: new Date(Date.now() - 1000 * 60 * 30),
          lida: false
        }
      ]);
      
      // Marcar mensagens como lidas
      const res = await apiClient.patch(`/api/chats/${chat._id}/mensagens/lidas`, {}, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('mensagensLidas');
      expect(res.body.mensagensLidas).toBe(2);
      
      // Verificar se as mensagens foram marcadas como lidas
      const mensagensAtualizadas = await Mensagem.find({ chat: chat._id });
      expect(mensagensAtualizadas[0].lida).toBe(true);
      expect(mensagensAtualizadas[1].lida).toBe(true);
    });
  });
  
  describe('PUT /api/chats/:id', () => {
    test('deve atualizar nome do chat de grupo', async () => {
      // Criar um chat de grupo
      const chat = await Chat.create({
        tipo: 'grupo',
        nome: 'Grupo Original',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id,
          usuariosAutenticados.admin.usuario._id
        ],
        admin: usuariosAutenticados.aluno.usuario._id
      });
      
      const dadosAtualizados = {
        nome: 'Novo Nome do Grupo'
      };
      
      // Atualizar como admin do grupo
      const res = await apiClient.put(`/api/chats/${chat._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('chat');
      expect(res.body.data.chat).toHaveProperty('nome', dadosAtualizados.nome);
    });
    
    test('deve impedir não-admin de atualizar chat de grupo', async () => {
      // Criar um chat de grupo
      const chat = await Chat.create({
        tipo: 'grupo',
        nome: 'Grupo do Professor',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id,
          usuariosAutenticados.admin.usuario._id
        ],
        admin: usuariosAutenticados.professor.usuario._id
      });
      
      const dadosAtualizados = {
        nome: 'Tentativa de Alteração'
      };
      
      // Tentar atualizar como aluno (não admin)
      const res = await apiClient.put(`/api/chats/${chat._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('POST /api/chats/:id/participantes', () => {
    test('deve adicionar participantes a um chat de grupo', async () => {
      // Criar um chat de grupo
      const chat = await Chat.create({
        tipo: 'grupo',
        nome: 'Grupo para Adicionar',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ],
        admin: usuariosAutenticados.aluno.usuario._id
      });
      
      // Criar um novo usuário para adicionar
      const novoUsuario = await mongoose.model('Usuario').create({
        nome: 'Novo Participante',
        email: 'novo@example.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      const dadosParticipante = {
        participanteId: novoUsuario._id.toString()
      };
      
      // Adicionar participante como admin do grupo
      const res = await apiClient.post(`/api/chats/${chat._id}/participantes`, dadosParticipante, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o participante foi adicionado
      const chatAtualizado = await Chat.findById(chat._id);
      expect(chatAtualizado.participantes).toContainEqual(novoUsuario._id);
    });
    
    test('deve impedir adicionar participantes a chat individual', async () => {
      // Criar um chat individual
      const chat = await Chat.create({
        tipo: 'individual',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id
        ]
      });
      
      // Criar um novo usuário para tentar adicionar
      const novoUsuario = await mongoose.model('Usuario').create({
        nome: 'Tentativa',
        email: 'tentativa@example.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      const dadosParticipante = {
        participanteId: novoUsuario._id.toString()
      };
      
      // Tentar adicionar participante
      const res = await apiClient.post(`/api/chats/${chat._id}/participantes`, dadosParticipante, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(400);
    });
  });
  
  describe('DELETE /api/chats/:id/participantes/:participanteId', () => {
    test('deve remover um participante do chat de grupo', async () => {
      // Criar um usuário para ser removido
      const usuarioRemover = await mongoose.model('Usuario').create({
        nome: 'Para Remover',
        email: 'remover@example.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      // Criar um chat de grupo
      const chat = await Chat.create({
        tipo: 'grupo',
        nome: 'Grupo para Remoção',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id,
          usuarioRemover._id
        ],
        admin: usuariosAutenticados.aluno.usuario._id
      });
      
      // Remover participante como admin do grupo
      const res = await apiClient.delete(`/api/chats/${chat._id}/participantes/${usuarioRemover._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o participante foi removido
      const chatAtualizado = await Chat.findById(chat._id);
      expect(chatAtualizado.participantes).not.toContainEqual(usuarioRemover._id);
    });
    
    test('deve permitir participante sair do grupo', async () => {
      // Criar um chat de grupo
      const chat = await Chat.create({
        tipo: 'grupo',
        nome: 'Grupo para Saída',
        participantes: [
          usuariosAutenticados.aluno.usuario._id,
          usuariosAutenticados.professor.usuario._id,
          usuariosAutenticados.admin.usuario._id
        ],
        admin: usuariosAutenticados.professor.usuario._id
      });
      
      // Aluno sai do grupo (remove a si mesmo)
      const res = await apiClient.delete(`/api/chats/${chat._id}/participantes/${usuariosAutenticados.aluno.usuario._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      
      // Verificar se o aluno foi removido
      const chatAtualizado = await Chat.findById(chat._id);
      expect(chatAtualizado.participantes.map(p => p.toString())).not.toContain(
        usuariosAutenticados.aluno.usuario._id.toString()
      );
    });
  });
});
