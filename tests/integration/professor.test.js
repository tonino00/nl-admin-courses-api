/**
 * Testes para o módulo de Professores
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuariosPorPapel } = require('../utils/auth');
const Professor = require('../../src/models/Professor');
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

describe('Módulo de Professores', () => {
  let usuariosAutenticados;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
  });

  describe('GET /api/professores', () => {
    test('deve listar professores para usuário admin', async () => {
      // Criar alguns professores para testar
      const usuario1 = await Usuario.create({
        nome: 'Professor Teste 1',
        email: 'professor1@exemplo.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      const usuario2 = await Usuario.create({
        nome: 'Professor Teste 2',
        email: 'professor2@exemplo.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      await Professor.create({
        usuario: usuario1._id,
        especialidade: 'Matemática',
        formacao: 'mestrado',
        instituicaoFormacao: 'UFRJ'
      });
      
      await Professor.create({
        usuario: usuario2._id,
        especialidade: 'História',
        formacao: 'doutorado',
        instituicaoFormacao: 'USP'
      });
      
      // Fazer requisição como admin
      const res = await apiClient.get('/api/professores', { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 2);
      expect(Array.isArray(res.body.data.professores)).toBe(true);
      expect(res.body.data.professores).toHaveLength(2);
    });
    
    test('deve permitir alunos listar professores', async () => {
      // Criar um professor para testar
      const usuario = await Usuario.create({
        nome: 'Professor Visível',
        email: 'visivel@exemplo.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      await Professor.create({
        usuario: usuario._id,
        especialidade: 'Física',
        formacao: 'doutorado'
      });
      
      // Fazer requisição como aluno
      const res = await apiClient.get('/api/professores', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.professores).toHaveLength(1);
    });
    
    test('deve retornar erro 401 para requisição sem autenticação', async () => {
      const res = await apiClient.get('/api/professores');
      
      expect(res.statusCode).toBe(401);
    });
  });
  
  describe('POST /api/professores', () => {
    test('deve criar um novo professor como admin', async () => {
      const dadosProfessor = {
        usuario: {
          nome: 'Novo Professor',
          email: 'novoprofessor@exemplo.com',
          senha: 'Senha@123',
          telefone: '(11) 98765-4321'
        },
        especialidade: 'Ciência da Computação',
        formacao: 'doutorado',
        instituicaoFormacao: 'UNICAMP',
        areasInteresse: ['Programação', 'Inteligência Artificial']
      };
      
      const res = await apiClient.post('/api/professores', dadosProfessor, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('professor');
      expect(res.body.data.professor).toHaveProperty('especialidade', dadosProfessor.especialidade);
      expect(res.body.data.professor.usuario).toHaveProperty('nome', dadosProfessor.usuario.nome);
      expect(res.body.data.professor.usuario).toHaveProperty('email', dadosProfessor.usuario.email);
      expect(res.body.data.professor.usuario).not.toHaveProperty('senha');
    });
    
    test('deve retornar erro para dados inválidos', async () => {
      // Dados com campos inválidos
      const dadosInvalidos = {
        usuario: {
          nome: 'A', // Nome muito curto
          email: 'email-invalido', // Email inválido
          senha: '123' // Senha fraca
        }
      };
      
      const res = await apiClient.post('/api/professores', dadosInvalidos, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('GET /api/professores/:id', () => {
    test('deve retornar detalhes de um professor específico', async () => {
      // Criar um professor para teste
      const usuarioProfessor = await Usuario.create({
        nome: 'Professor Detalhado',
        email: 'detalhado@exemplo.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      const professor = await Professor.create({ 
        usuario: usuarioProfessor._id, 
        especialidade: 'Biologia',
        formacao: 'pos-doutorado',
        instituicaoFormacao: 'Oxford'
      });
      
      // Fazer requisição como aluno (permissão para visualizar)
      const res = await apiClient.get(`/api/professores/${professor._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('professor');
      expect(res.body.data.professor).toHaveProperty('_id', professor._id.toString());
      expect(res.body.data.professor).toHaveProperty('especialidade', professor.especialidade);
      expect(res.body.data.professor.usuario).toHaveProperty('nome', usuarioProfessor.nome);
    });
    
    test('deve retornar erro 404 para ID inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId();
      
      const res = await apiClient.get(`/api/professores/${idInexistente}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('PUT /api/professores/:id', () => {
    test('deve atualizar dados do professor', async () => {
      // Criar um professor para teste
      const usuarioProfessor = await Usuario.create({
        nome: 'Professor para Atualizar',
        email: 'atualizar@exemplo.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      const professor = await Professor.create({ 
        usuario: usuarioProfessor._id, 
        especialidade: 'Química',
        formacao: 'mestrado'
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        usuario: {
          nome: 'Nome Atualizado'
        },
        especialidade: 'Química Orgânica',
        formacao: 'doutorado',
        disponibilidade: {
          segunda: ['08:00-12:00', '14:00-18:00'],
          quarta: ['08:00-12:00']
        }
      };
      
      // Fazer requisição como o próprio professor
      const res = await apiClient.put(`/api/professores/${professor._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('professor');
      expect(res.body.data.professor.usuario).toHaveProperty('nome', dadosAtualizados.usuario.nome);
      expect(res.body.data.professor).toHaveProperty('especialidade', dadosAtualizados.especialidade);
      expect(res.body.data.professor).toHaveProperty('formacao', dadosAtualizados.formacao);
      expect(res.body.data.professor).toHaveProperty('disponibilidade');
      expect(res.body.data.professor.disponibilidade).toHaveProperty('segunda');
    });
  });
  
  describe('PATCH /api/professores/:id/disponibilidade', () => {
    test('deve atualizar disponibilidade do professor', async () => {
      // Criar um professor para teste
      const usuarioProfessor = await Usuario.create({
        nome: 'Professor Disponibilidade',
        email: 'disponibilidade@exemplo.com',
        senha: 'senha123',
        role: 'professor'
      });
      
      const professor = await Professor.create({ 
        usuario: usuarioProfessor._id, 
        especialidade: 'Inglês',
        formacao: 'mestrado'
      });
      
      // Dados de disponibilidade
      const disponibilidade = {
        segunda: ['08:00-12:00', '14:00-18:00'],
        terca: ['14:00-18:00'],
        quarta: ['08:00-12:00'],
        quinta: ['08:00-12:00', '14:00-18:00'],
        sexta: ['08:00-12:00']
      };
      
      // Fazer requisição como admin
      const res = await apiClient.patch(`/api/professores/${professor._id}/disponibilidade`, { disponibilidade }, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data.professor).toHaveProperty('disponibilidade');
      expect(res.body.data.professor.disponibilidade).toHaveProperty('segunda');
      expect(res.body.data.professor.disponibilidade.segunda).toHaveLength(2);
    });
  });
  
  describe('DELETE /api/professores/:id', () => {
    test('deve desativar um professor (não excluir)', async () => {
      // Criar um professor para teste
      const usuarioProfessor = await Usuario.create({
        nome: 'Professor para Desativar',
        email: 'desativar@exemplo.com',
        senha: 'senha123',
        role: 'professor',
        ativo: true
      });
      
      const professor = await Professor.create({ 
        usuario: usuarioProfessor._id, 
        especialidade: 'Geografia'
      });
      
      // Fazer requisição como admin
      const res = await apiClient.delete(`/api/professores/${professor._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o usuário foi desativado, não excluído
      const usuarioAtualizado = await Usuario.findById(usuarioProfessor._id);
      expect(usuarioAtualizado).not.toBeNull();
      expect(usuarioAtualizado.ativo).toBe(false);
    });
  });
});
