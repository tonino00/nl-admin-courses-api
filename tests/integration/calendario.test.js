/**
 * Testes para o módulo de Calendário Acadêmico
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuariosPorPapel } = require('../utils/auth');
const Calendario = require('../../src/models/Calendario');

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

describe('Módulo de Calendário Acadêmico', () => {
  let usuariosAutenticados;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
  });

  describe('GET /api/calendario', () => {
    test('deve listar eventos do calendário para usuários autenticados', async () => {
      // Criar alguns eventos para testar
      const dataAtual = new Date();
      const amanha = new Date(dataAtual);
      amanha.setDate(amanha.getDate() + 1);
      const semanaQueVem = new Date(dataAtual);
      semanaQueVem.setDate(semanaQueVem.getDate() + 7);
      
      await Calendario.create([
        {
          titulo: 'Início do Semestre',
          descricao: 'Início das aulas do semestre',
          dataInicio: dataAtual,
          dataFim: dataAtual,
          tipo: 'academico',
          criador: usuariosAutenticados.admin.usuario._id
        },
        {
          titulo: 'Entrega de Trabalho',
          descricao: 'Prazo final para entrega de trabalho',
          dataInicio: amanha,
          dataFim: amanha,
          tipo: 'curso',
          curso: new mongoose.Types.ObjectId(),
          criador: usuariosAutenticados.professor.usuario._id
        },
        {
          titulo: 'Prova Final',
          descricao: 'Avaliação final do semestre',
          dataInicio: semanaQueVem,
          dataFim: semanaQueVem,
          tipo: 'avaliacao',
          curso: new mongoose.Types.ObjectId(),
          criador: usuariosAutenticados.professor.usuario._id
        }
      ]);
      
      // Fazer requisição como aluno
      const res = await apiClient.get('/api/calendario', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 3);
      expect(Array.isArray(res.body.data.eventos)).toBe(true);
      expect(res.body.data.eventos).toHaveLength(3);
    });
    
    test('deve permitir filtrar eventos por tipo', async () => {
      // Criar eventos de tipos diferentes
      const dataAtual = new Date();
      
      await Calendario.create([
        {
          titulo: 'Evento Acadêmico',
          dataInicio: dataAtual,
          dataFim: dataAtual,
          tipo: 'academico',
          criador: usuariosAutenticados.admin.usuario._id
        },
        {
          titulo: 'Evento de Curso',
          dataInicio: dataAtual,
          dataFim: dataAtual,
          tipo: 'curso',
          curso: new mongoose.Types.ObjectId(),
          criador: usuariosAutenticados.professor.usuario._id
        }
      ]);
      
      // Filtrar por tipo
      const res = await apiClient.get('/api/calendario?tipo=academico', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resultados', 1);
      expect(res.body.data.eventos[0]).toHaveProperty('tipo', 'academico');
    });
    
    test('deve permitir filtrar eventos por intervalo de datas', async () => {
      // Criar eventos em datas diferentes
      const hoje = new Date();
      const proxSemana = new Date(hoje);
      proxSemana.setDate(proxSemana.getDate() + 7);
      const proxMes = new Date(hoje);
      proxMes.setMonth(proxMes.getMonth() + 1);
      
      await Calendario.create([
        {
          titulo: 'Evento Hoje',
          dataInicio: hoje,
          dataFim: hoje,
          tipo: 'academico',
          criador: usuariosAutenticados.admin.usuario._id
        },
        {
          titulo: 'Evento Próxima Semana',
          dataInicio: proxSemana,
          dataFim: proxSemana,
          tipo: 'academico',
          criador: usuariosAutenticados.admin.usuario._id
        },
        {
          titulo: 'Evento Próximo Mês',
          dataInicio: proxMes,
          dataFim: proxMes,
          tipo: 'academico',
          criador: usuariosAutenticados.admin.usuario._id
        }
      ]);
      
      // Filtrar por intervalo de datas
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() - 1); // Ontem
      
      const dataFim = new Date(hoje);
      dataFim.setDate(dataFim.getDate() + 10); // Daqui a 10 dias
      
      const res = await apiClient.get(`/api/calendario?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resultados', 2); // Hoje e próxima semana
    });
  });
  
  describe('POST /api/calendario', () => {
    test('deve permitir admin criar um novo evento', async () => {
      const dataEvento = new Date();
      dataEvento.setDate(dataEvento.getDate() + 14); // Daqui a 14 dias
      
      const dadosEvento = {
        titulo: 'Reunião de Professores',
        descricao: 'Reunião para discutir o planejamento do semestre',
        dataInicio: dataEvento.toISOString(),
        dataFim: new Date(dataEvento.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
        tipo: 'reuniao',
        local: 'Sala de Reuniões',
        cor: '#4285F4'
      };
      
      const res = await apiClient.post('/api/calendario', dadosEvento, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('evento');
      expect(res.body.data.evento).toHaveProperty('titulo', dadosEvento.titulo);
      expect(res.body.data.evento).toHaveProperty('tipo', dadosEvento.tipo);
    });
    
    test('deve permitir professor criar eventos relacionados a cursos', async () => {
      const cursoId = new mongoose.Types.ObjectId();
      const dataEvento = new Date();
      dataEvento.setDate(dataEvento.getDate() + 3); // Daqui a 3 dias
      
      const dadosEvento = {
        titulo: 'Entrega de Projeto',
        descricao: 'Prazo final para entrega do projeto',
        dataInicio: dataEvento.toISOString(),
        dataFim: dataEvento.toISOString(),
        tipo: 'curso',
        curso: cursoId.toString(),
        cor: '#DB4437'
      };
      
      const res = await apiClient.post('/api/calendario', dadosEvento, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.evento).toHaveProperty('curso', cursoId.toString());
    });
    
    test('deve impedir aluno de criar eventos acadêmicos', async () => {
      const dadosEvento = {
        titulo: 'Evento Não Autorizado',
        dataInicio: new Date().toISOString(),
        dataFim: new Date().toISOString(),
        tipo: 'academico'
      };
      
      const res = await apiClient.post('/api/calendario', dadosEvento, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
    
    test('deve rejeitar eventos com datas inválidas', async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() + 5); // Daqui a 5 dias
      
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 2); // Daqui a 2 dias (antes da data de início)
      
      const dadosEvento = {
        titulo: 'Evento com Datas Inválidas',
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        tipo: 'academico'
      };
      
      const res = await apiClient.post('/api/calendario', dadosEvento, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(400);
    });
  });
  
  describe('GET /api/calendario/:id', () => {
    test('deve retornar detalhes de um evento específico', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Palestra Especial',
        descricao: 'Palestra sobre inovações tecnológicas',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'evento',
        local: 'Auditório Principal',
        criador: usuariosAutenticados.admin.usuario._id
      });
      
      // Fazer requisição como aluno
      const res = await apiClient.get(`/api/calendario/${evento._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('evento');
      expect(res.body.data.evento).toHaveProperty('_id', evento._id.toString());
      expect(res.body.data.evento).toHaveProperty('titulo', evento.titulo);
    });
    
    test('deve retornar erro 404 para ID inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId();
      
      const res = await apiClient.get(`/api/calendario/${idInexistente}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('PUT /api/calendario/:id', () => {
    test('deve permitir criador atualizar seu próprio evento', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Evento Original',
        descricao: 'Descrição original',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'academico',
        criador: usuariosAutenticados.professor.usuario._id
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        titulo: 'Evento Atualizado',
        descricao: 'Nova descrição',
        local: 'Novo local'
      };
      
      // Fazer requisição como professor (criador)
      const res = await apiClient.put(`/api/calendario/${evento._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('evento');
      expect(res.body.data.evento).toHaveProperty('titulo', dadosAtualizados.titulo);
      expect(res.body.data.evento).toHaveProperty('local', dadosAtualizados.local);
    });
    
    test('deve permitir admin atualizar qualquer evento', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Evento para Admin Atualizar',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'curso',
        criador: usuariosAutenticados.professor.usuario._id
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        titulo: 'Evento Atualizado pelo Admin',
        cor: '#34A853'
      };
      
      // Fazer requisição como admin
      const res = await apiClient.put(`/api/calendario/${evento._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.evento).toHaveProperty('titulo', dadosAtualizados.titulo);
      expect(res.body.data.evento).toHaveProperty('cor', dadosAtualizados.cor);
    });
    
    test('deve impedir aluno de atualizar eventos', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Evento Protegido',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'academico',
        criador: usuariosAutenticados.professor.usuario._id
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        titulo: 'Tentativa de Atualização'
      };
      
      // Fazer requisição como aluno
      const res = await apiClient.put(`/api/calendario/${evento._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('DELETE /api/calendario/:id', () => {
    test('deve permitir criador excluir seu próprio evento', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Evento para Excluir',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'curso',
        criador: usuariosAutenticados.professor.usuario._id
      });
      
      // Fazer requisição como professor (criador)
      const res = await apiClient.delete(`/api/calendario/${evento._id}`, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o evento foi realmente excluído
      const eventoExcluido = await Calendario.findById(evento._id);
      expect(eventoExcluido).toBeNull();
    });
    
    test('deve permitir admin excluir qualquer evento', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Evento para Admin Excluir',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'academico',
        criador: usuariosAutenticados.professor.usuario._id
      });
      
      // Fazer requisição como admin
      const res = await apiClient.delete(`/api/calendario/${evento._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      
      // Verificar se o evento foi realmente excluído
      const eventoExcluido = await Calendario.findById(evento._id);
      expect(eventoExcluido).toBeNull();
    });
    
    test('deve impedir aluno de excluir eventos', async () => {
      // Criar um evento para teste
      const evento = await Calendario.create({
        titulo: 'Evento Protegido contra Exclusão',
        dataInicio: new Date(),
        dataFim: new Date(),
        tipo: 'academico',
        criador: usuariosAutenticados.admin.usuario._id
      });
      
      // Fazer requisição como aluno
      const res = await apiClient.delete(`/api/calendario/${evento._id}`, { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
      
      // Verificar se o evento ainda existe
      const eventoAinda = await Calendario.findById(evento._id);
      expect(eventoAinda).not.toBeNull();
    });
  });
});
