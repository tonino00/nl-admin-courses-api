/**
 * Testes para o módulo de Alunos
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuarioAutenticado, criarUsuariosPorPapel } = require('../utils/auth');
const Aluno = require('../../src/models/Aluno');
const Usuario = require('../../src/models/Usuario');

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

describe('Módulo de Alunos', () => {
  let usuariosAutenticados;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
  });

  describe('GET /api/alunos', () => {
    test('deve listar alunos para usuário admin', async () => {
      // Criar alguns alunos para testar
      const usuario1 = await Usuario.create({
        nome: 'Aluno Teste 1',
        email: 'aluno1@exemplo.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      const usuario2 = await Usuario.create({
        nome: 'Aluno Teste 2',
        email: 'aluno2@exemplo.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      await Aluno.create({ usuario: usuario1._id, matricula: 'ALU20250001' });
      await Aluno.create({ usuario: usuario2._id, matricula: 'ALU20250002' });
      
      // Fazer requisição como admin
      const res = await apiClient.get('/api/alunos', { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 2);
      expect(Array.isArray(res.body.data.alunos)).toBe(true);
      expect(res.body.data.alunos).toHaveLength(2);
    });
    
    test('deve retornar erro 403 para alunos tentando acessar lista', async () => {
      const res = await apiClient.get('/api/alunos', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
    
    test('deve retornar erro 401 para requisição sem autenticação', async () => {
      const res = await apiClient.get('/api/alunos');
      
      expect(res.statusCode).toBe(401);
    });
  });
  
  describe('POST /api/alunos', () => {
    test('deve criar um novo aluno como admin', async () => {
      const dadosAluno = {
        usuario: {
          nome: 'Novo Aluno',
          email: 'novoaluno@exemplo.com',
          senha: 'Senha@123',
          telefone: '(11) 98765-4321'
        },
        matricula: 'ALU20250003',
        dataMatricula: new Date().toISOString(),
        responsavel: {
          nome: 'Responsável',
          telefone: '(11) 91234-5678',
          parentesco: 'mãe'
        },
        endereco: {
          rua: 'Rua Exemplo',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01001-000'
        }
      };
      
      const res = await apiClient.post('/api/alunos', dadosAluno, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('aluno');
      expect(res.body.data.aluno).toHaveProperty('matricula', dadosAluno.matricula);
      expect(res.body.data.aluno.usuario).toHaveProperty('nome', dadosAluno.usuario.nome);
      expect(res.body.data.aluno.usuario).toHaveProperty('email', dadosAluno.usuario.email);
      expect(res.body.data.aluno.usuario).not.toHaveProperty('senha');
    });
    
    test('deve retornar erro para dados inválidos', async () => {
      // Dados sem campos obrigatórios
      const dadosInvalidos = {
        usuario: {
          nome: 'A', // Nome muito curto
          email: 'email-invalido', // Email inválido
          senha: '123' // Senha fraca
        }
      };
      
      const res = await apiClient.post('/api/alunos', dadosInvalidos, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('GET /api/alunos/:id', () => {
    test('deve retornar detalhes de um aluno específico', async () => {
      // Criar um aluno para teste
      const usuarioAluno = await Usuario.create({
        nome: 'Aluno Detalhado',
        email: 'detalhado@exemplo.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      const aluno = await Aluno.create({ 
        usuario: usuarioAluno._id, 
        matricula: 'ALU20250010',
        endereco: {
          rua: 'Rua Teste',
          numero: '456',
          bairro: 'Teste',
          cidade: 'Cidade Teste',
          estado: 'SP',
          cep: '04000-000'
        }
      });
      
      // Fazer requisição como admin
      const res = await apiClient.get(`/api/alunos/${aluno._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('aluno');
      expect(res.body.data.aluno).toHaveProperty('_id', aluno._id.toString());
      expect(res.body.data.aluno).toHaveProperty('matricula', aluno.matricula);
      expect(res.body.data.aluno.usuario).toHaveProperty('nome', usuarioAluno.nome);
    });
    
    test('deve retornar erro 404 para ID inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId();
      
      const res = await apiClient.get(`/api/alunos/${idInexistente}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('PUT /api/alunos/:id', () => {
    test('deve atualizar dados do aluno', async () => {
      // Criar um aluno para teste
      const usuarioAluno = await Usuario.create({
        nome: 'Aluno para Atualizar',
        email: 'atualizar@exemplo.com',
        senha: 'senha123',
        role: 'aluno'
      });
      
      const aluno = await Aluno.create({ 
        usuario: usuarioAluno._id, 
        matricula: 'ALU20250020'
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        usuario: {
          nome: 'Nome Atualizado'
        },
        endereco: {
          rua: 'Nova Rua',
          numero: '789',
          bairro: 'Novo Bairro',
          cidade: 'Nova Cidade',
          estado: 'RJ',
          cep: '20000-000'
        }
      };
      
      // Fazer requisição como admin
      const res = await apiClient.put(`/api/alunos/${aluno._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('aluno');
      expect(res.body.data.aluno.usuario).toHaveProperty('nome', dadosAtualizados.usuario.nome);
      expect(res.body.data.aluno).toHaveProperty('endereco');
      expect(res.body.data.aluno.endereco).toHaveProperty('cidade', dadosAtualizados.endereco.cidade);
    });
  });
  
  describe('DELETE /api/alunos/:id', () => {
    test('deve desativar um aluno (não excluir)', async () => {
      // Criar um aluno para teste
      const usuarioAluno = await Usuario.create({
        nome: 'Aluno para Desativar',
        email: 'desativar@exemplo.com',
        senha: 'senha123',
        role: 'aluno',
        ativo: true
      });
      
      const aluno = await Aluno.create({ 
        usuario: usuarioAluno._id, 
        matricula: 'ALU20250030'
      });
      
      // Fazer requisição como admin
      const res = await apiClient.delete(`/api/alunos/${aluno._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o usuário foi desativado, não excluído
      const usuarioAtualizado = await Usuario.findById(usuarioAluno._id);
      expect(usuarioAtualizado).not.toBeNull();
      expect(usuarioAtualizado.ativo).toBe(false);
    });
  });
});
