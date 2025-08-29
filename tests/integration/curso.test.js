/**
 * Testes para o módulo de Cursos
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuariosPorPapel } = require('../utils/auth');
const Curso = require('../../src/models/Curso');
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

describe('Módulo de Cursos', () => {
  let usuariosAutenticados;
  let professorId;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
    
    // Criar um professor para associar aos cursos
    const professor = await Professor.create({
      usuario: usuariosAutenticados.professor.usuario._id,
      especialidade: 'Programação',
      formacao: 'doutorado',
      instituicaoFormacao: 'USP'
    });
    
    professorId = professor._id;
  });

  describe('GET /api/cursos', () => {
    test('deve listar cursos para usuário autenticado', async () => {
      // Criar alguns cursos para testar
      await Curso.create([
        {
          nome: 'Curso de JavaScript',
          descricao: 'Aprenda JavaScript do zero',
          categoria: 'Programação',
          cargaHoraria: 40,
          nivel: 'iniciante',
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          preco: 199.90,
          professor: professorId,
          vagas: 30
        },
        {
          nome: 'Curso de Node.js',
          descricao: 'Desenvolvimento backend com Node.js',
          categoria: 'Programação',
          cargaHoraria: 60,
          nivel: 'intermediário',
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          preco: 299.90,
          professor: professorId,
          vagas: 20
        }
      ]);
      
      // Fazer requisição como aluno
      const res = await apiClient.get('/api/cursos', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 2);
      expect(Array.isArray(res.body.data.cursos)).toBe(true);
      expect(res.body.data.cursos).toHaveLength(2);
    });
    
    test('deve permitir filtrar cursos por categoria', async () => {
      // Criar cursos de categorias diferentes
      await Curso.create([
        {
          nome: 'Curso de JavaScript',
          categoria: 'Programação',
          cargaHoraria: 40,
          nivel: 'iniciante',
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          preco: 199.90,
          professor: professorId,
          vagas: 30
        },
        {
          nome: 'Curso de Marketing Digital',
          categoria: 'Marketing',
          cargaHoraria: 30,
          nivel: 'iniciante',
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          preco: 249.90,
          professor: professorId,
          vagas: 25
        }
      ]);
      
      // Filtrar por categoria
      const res = await apiClient.get('/api/cursos?categoria=Marketing', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resultados', 1);
      expect(res.body.data.cursos[0]).toHaveProperty('categoria', 'Marketing');
    });
  });
  
  describe('POST /api/cursos', () => {
    test('deve criar um novo curso como professor', async () => {
      const dadosCurso = {
        nome: 'Curso de React',
        descricao: 'Aprenda React do zero ao avançado',
        categoria: 'Desenvolvimento Web',
        cargaHoraria: 50,
        nivel: 'intermediário',
        dataInicio: new Date().toISOString(),
        dataFim: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        preco: 399.90,
        professor: professorId.toString(),
        vagas: 25,
        status: 'aberto',
        materiais: [
          {
            titulo: 'Introdução ao React',
            tipo: 'documento',
            url: 'https://exemplo.com/intro-react.pdf',
            descricao: 'Material introdutório'
          }
        ],
        localizacao: {
          tipo: 'online',
          plataforma: {
            nome: 'Zoom',
            url: 'https://zoom.us/meeting/123'
          }
        }
      };
      
      const res = await apiClient.post('/api/cursos', dadosCurso, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('curso');
      expect(res.body.data.curso).toHaveProperty('nome', dadosCurso.nome);
      expect(res.body.data.curso).toHaveProperty('professor', professorId.toString());
    });
    
    test('deve retornar erro para dados inválidos', async () => {
      // Dados sem campos obrigatórios
      const dadosInvalidos = {
        nome: 'Cu', // Nome muito curto
        nivel: 'expert', // Nível inválido
        preco: -50 // Preço negativo
      };
      
      const res = await apiClient.post('/api/cursos', dadosInvalidos, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
    });
    
    test('deve negar criação de curso para alunos', async () => {
      const dadosCurso = {
        nome: 'Curso de React',
        categoria: 'Desenvolvimento Web',
        cargaHoraria: 50,
        nivel: 'intermediário',
        dataInicio: new Date().toISOString(),
        dataFim: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        preco: 399.90,
        professor: professorId.toString(),
        vagas: 25
      };
      
      const res = await apiClient.post('/api/cursos', dadosCurso, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('GET /api/cursos/:id', () => {
    test('deve retornar detalhes de um curso específico', async () => {
      // Criar um curso para teste
      const curso = await Curso.create({
        nome: 'Curso de Python',
        descricao: 'Aprenda Python do zero',
        categoria: 'Programação',
        cargaHoraria: 45,
        nivel: 'iniciante',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        preco: 259.90,
        professor: professorId,
        vagas: 30
      });
      
      // Fazer requisição como aluno
      const res = await apiClient.get(`/api/cursos/${curso._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('curso');
      expect(res.body.data.curso).toHaveProperty('_id', curso._id.toString());
      expect(res.body.data.curso).toHaveProperty('nome', curso.nome);
    });
    
    test('deve retornar erro 404 para ID inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId();
      
      const res = await apiClient.get(`/api/cursos/${idInexistente}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('PUT /api/cursos/:id', () => {
    test('deve permitir professor atualizar seu próprio curso', async () => {
      // Criar um curso para teste
      const curso = await Curso.create({
        nome: 'Curso Original',
        categoria: 'Categoria Original',
        cargaHoraria: 30,
        nivel: 'iniciante',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        preco: 199.90,
        professor: professorId,
        vagas: 25
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        nome: 'Curso Atualizado',
        descricao: 'Nova descrição',
        preco: 249.90
      };
      
      // Fazer requisição como professor
      const res = await apiClient.put(`/api/cursos/${curso._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('curso');
      expect(res.body.data.curso).toHaveProperty('nome', dadosAtualizados.nome);
      expect(res.body.data.curso).toHaveProperty('preco', dadosAtualizados.preco);
    });
  });
  
  describe('DELETE /api/cursos/:id', () => {
    test('deve permitir admin cancelar um curso', async () => {
      // Criar um curso para teste
      const curso = await Curso.create({
        nome: 'Curso para Cancelar',
        categoria: 'Teste',
        cargaHoraria: 20,
        nivel: 'iniciante',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        preco: 99.90,
        professor: professorId,
        vagas: 15,
        status: 'aberto'
      });
      
      // Fazer requisição como admin
      const res = await apiClient.delete(`/api/cursos/${curso._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o curso foi cancelado, não excluído
      const cursoAtualizado = await Curso.findById(curso._id);
      expect(cursoAtualizado).not.toBeNull();
      expect(cursoAtualizado.status).toBe('cancelado');
    });
    
    test('deve negar exclusão para alunos', async () => {
      // Criar um curso para teste
      const curso = await Curso.create({
        nome: 'Curso Teste',
        categoria: 'Teste',
        cargaHoraria: 10,
        nivel: 'iniciante',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        preco: 49.90,
        professor: professorId,
        vagas: 10
      });
      
      // Fazer requisição como aluno
      const res = await apiClient.delete(`/api/cursos/${curso._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
});
