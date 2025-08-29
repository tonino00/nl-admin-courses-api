/**
 * Testes para o módulo de autenticação
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const Usuario = require('../../src/models/Usuario');
const bcrypt = require('bcryptjs');

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

describe('Módulo de Autenticação', () => {
  describe('POST /api/auth/registro', () => {
    test('deve registrar um novo usuário com sucesso', async () => {
      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: 'Senha@123',
        role: 'aluno'
      };
      
      const res = await apiClient.post('/api/auth/registro', dadosUsuario);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('usuario');
      expect(res.body.usuario).toHaveProperty('nome', dadosUsuario.nome);
      expect(res.body.usuario).toHaveProperty('email', dadosUsuario.email);
      expect(res.body.usuario).toHaveProperty('role', dadosUsuario.role);
      expect(res.body.usuario).not.toHaveProperty('senha');
    });
    
    test('deve retornar erro para email já cadastrado', async () => {
      // Criar um usuário primeiro
      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: await bcrypt.hash('Senha@123', 10),
        role: 'aluno'
      };
      
      await Usuario.create(dadosUsuario);
      
      // Tentar registrar o mesmo email
      const res = await apiClient.post('/api/auth/registro', {
        nome: 'João Duplicado',
        email: 'joao@exemplo.com',
        senha: 'Senha@123',
        role: 'aluno'
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/email já está em uso/i);
    });
    
    test('deve retornar erro para dados inválidos', async () => {
      // Email inválido
      const res1 = await apiClient.post('/api/auth/registro', {
        nome: 'João Silva',
        email: 'email-invalido',
        senha: 'Senha@123',
        role: 'aluno'
      });
      
      expect(res1.statusCode).toBe(400);
      
      // Senha fraca
      const res2 = await apiClient.post('/api/auth/registro', {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: '123',
        role: 'aluno'
      });
      
      expect(res2.statusCode).toBe(400);
      
      // Papel inválido
      const res3 = await apiClient.post('/api/auth/registro', {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: 'Senha@123',
        role: 'super_admin'
      });
      
      expect(res3.statusCode).toBe(400);
    });
  });
  
  describe('POST /api/auth/login', () => {
    test('deve fazer login com credenciais corretas', async () => {
      // Criar um usuário para teste
      const senha = 'Senha@123';
      const senhaHash = await bcrypt.hash(senha, 10);
      
      const usuario = await Usuario.create({
        nome: 'Maria Santos',
        email: 'maria@exemplo.com',
        senha: senhaHash,
        role: 'professor'
      });
      
      // Fazer login
      const res = await apiClient.post('/api/auth/login', {
        email: 'maria@exemplo.com',
        senha: senha
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('usuario');
      expect(res.body.usuario).toHaveProperty('nome', usuario.nome);
      expect(res.body.usuario).toHaveProperty('email', usuario.email);
      expect(res.body.usuario).not.toHaveProperty('senha');
    });
    
    test('deve retornar erro para email não cadastrado', async () => {
      const res = await apiClient.post('/api/auth/login', {
        email: 'naoexiste@exemplo.com',
        senha: 'Senha@123'
      });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/credenciais inválidas/i);
    });
    
    test('deve retornar erro para senha incorreta', async () => {
      // Criar um usuário para teste
      await Usuario.create({
        nome: 'Carlos Oliveira',
        email: 'carlos@exemplo.com',
        senha: await bcrypt.hash('Senha@123', 10),
        role: 'aluno'
      });
      
      // Tentar login com senha errada
      const res = await apiClient.post('/api/auth/login', {
        email: 'carlos@exemplo.com',
        senha: 'senha_errada'
      });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/credenciais inválidas/i);
    });
    
    test('deve retornar erro para conta inativa', async () => {
      // Criar um usuário inativo
      await Usuario.create({
        nome: 'Pedro Souza',
        email: 'pedro@exemplo.com',
        senha: await bcrypt.hash('Senha@123', 10),
        role: 'aluno',
        ativo: false
      });
      
      // Tentar login
      const res = await apiClient.post('/api/auth/login', {
        email: 'pedro@exemplo.com',
        senha: 'Senha@123'
      });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/conta está inativa/i);
    });
  });
  
  describe('GET /api/auth/me', () => {
    test('deve retornar dados do usuário autenticado', async () => {
      // Criar um usuário
      const usuario = await Usuario.create({
        nome: 'Ana Lima',
        email: 'ana@exemplo.com',
        senha: await bcrypt.hash('Senha@123', 10),
        role: 'admin'
      });
      
      // Gerar token manualmente para teste
      const token = usuario.gerarAuthToken();
      
      // Obter perfil
      const res = await apiClient.get('/api/auth/me', { token });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('usuario');
      expect(res.body.usuario).toHaveProperty('_id', usuario._id.toString());
      expect(res.body.usuario).toHaveProperty('nome', usuario.nome);
      expect(res.body.usuario).toHaveProperty('email', usuario.email);
      expect(res.body.usuario).not.toHaveProperty('senha');
    });
    
    test('deve retornar erro para token inválido', async () => {
      const res = await apiClient.get('/api/auth/me', { token: 'token_invalido' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
    });
    
    test('deve retornar erro para requisição sem token', async () => {
      const res = await apiClient.get('/api/auth/me');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/token/i);
    });
  });
});
