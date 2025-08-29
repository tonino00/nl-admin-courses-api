/**
 * Testes para o módulo de Relatórios
 */
const mongoose = require('mongoose');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuariosPorPapel } = require('../utils/auth');
const Relatorio = require('../../src/models/Relatorio');

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

describe('Módulo de Relatórios', () => {
  let usuariosAutenticados;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
  });

  describe('GET /api/relatorios', () => {
    test('deve listar relatórios para usuário admin', async () => {
      // Criar alguns relatórios para testar
      const mesPassado = new Date();
      mesPassado.setMonth(mesPassado.getMonth() - 1);
      
      await Relatorio.create([
        {
          titulo: 'Relatório de Desempenho',
          tipo: 'desempenho',
          periodo: {
            inicio: mesPassado,
            fim: new Date()
          },
          criador: usuariosAutenticados.admin.usuario._id,
          status: 'concluido',
          dados: {
            resumo: 'Resumo do relatório',
            estatisticas: {
              aprovados: 85,
              reprovados: 15
            }
          }
        },
        {
          titulo: 'Relatório de Frequência',
          tipo: 'frequencia',
          periodo: {
            inicio: mesPassado,
            fim: new Date()
          },
          criador: usuariosAutenticados.professor.usuario._id,
          status: 'concluido',
          dados: {
            resumo: 'Resumo do relatório de frequência',
            estatisticas: {
              presencaMedia: 78
            }
          }
        }
      ]);
      
      // Fazer requisição como admin
      const res = await apiClient.get('/api/relatorios', { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body).toHaveProperty('resultados', 2);
      expect(Array.isArray(res.body.data.relatorios)).toBe(true);
      expect(res.body.data.relatorios).toHaveLength(2);
    });
    
    test('deve listar apenas relatórios criados pelo professor', async () => {
      // Criar relatórios com diferentes criadores
      await Relatorio.create([
        {
          titulo: 'Relatório Admin',
          tipo: 'financeiro',
          periodo: {
            inicio: new Date(),
            fim: new Date()
          },
          criador: usuariosAutenticados.admin.usuario._id,
          status: 'concluido'
        },
        {
          titulo: 'Relatório Professor',
          tipo: 'academico',
          periodo: {
            inicio: new Date(),
            fim: new Date()
          },
          criador: usuariosAutenticados.professor.usuario._id,
          status: 'concluido'
        }
      ]);
      
      // Fazer requisição como professor
      const res = await apiClient.get('/api/relatorios', { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resultados', 1);
      expect(res.body.data.relatorios[0]).toHaveProperty('titulo', 'Relatório Professor');
    });
    
    test('deve negar acesso para alunos', async () => {
      const res = await apiClient.get('/api/relatorios', { 
        token: usuariosAutenticados.aluno.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
    
    test('deve filtrar relatórios por tipo', async () => {
      // Criar relatórios de tipos diferentes
      await Relatorio.create([
        {
          titulo: 'Relatório de Desempenho',
          tipo: 'desempenho',
          periodo: { inicio: new Date(), fim: new Date() },
          criador: usuariosAutenticados.admin.usuario._id,
          status: 'concluido'
        },
        {
          titulo: 'Relatório Financeiro',
          tipo: 'financeiro',
          periodo: { inicio: new Date(), fim: new Date() },
          criador: usuariosAutenticados.admin.usuario._id,
          status: 'concluido'
        }
      ]);
      
      // Filtrar por tipo
      const res = await apiClient.get('/api/relatorios?tipo=financeiro', { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('resultados', 1);
      expect(res.body.data.relatorios[0]).toHaveProperty('tipo', 'financeiro');
    });
  });
  
  describe('POST /api/relatorios', () => {
    test('deve permitir admin criar um novo relatório', async () => {
      const mesPassado = new Date();
      mesPassado.setMonth(mesPassado.getMonth() - 1);
      
      const dadosRelatorio = {
        titulo: 'Novo Relatório',
        tipo: 'desempenho',
        periodo: {
          inicio: mesPassado.toISOString(),
          fim: new Date().toISOString()
        },
        filtros: {
          curso: new mongoose.Types.ObjectId().toString(),
          status: 'concluido'
        },
        formato: 'pdf'
      };
      
      const res = await apiClient.post('/api/relatorios', dadosRelatorio, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('relatorio');
      expect(res.body.data.relatorio).toHaveProperty('titulo', dadosRelatorio.titulo);
      expect(res.body.data.relatorio).toHaveProperty('tipo', dadosRelatorio.tipo);
      // Inicialmente o status do relatório deve ser 'pendente'
      expect(res.body.data.relatorio).toHaveProperty('status', 'pendente');
    });
    
    test('deve permitir professor criar relatórios de seus cursos', async () => {
      const cursoId = new mongoose.Types.ObjectId();
      
      const dadosRelatorio = {
        titulo: 'Relatório de Curso',
        tipo: 'frequencia',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fim: new Date().toISOString()
        },
        filtros: {
          curso: cursoId.toString()
        }
      };
      
      const res = await apiClient.post('/api/relatorios', dadosRelatorio, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.relatorio).toHaveProperty('filtros');
      expect(res.body.data.relatorio.filtros).toHaveProperty('curso', cursoId.toString());
    });
    
    test('deve rejeitar dados inválidos', async () => {
      // Período inválido (fim antes do início)
      const dataInicio = new Date();
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() - 10); // 10 dias antes
      
      const dadosInvalidos = {
        titulo: 'Relatório Inválido',
        tipo: 'desempenho',
        periodo: {
          inicio: dataInicio.toISOString(),
          fim: dataFim.toISOString()
        }
      };
      
      const res = await apiClient.post('/api/relatorios', dadosInvalidos, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('GET /api/relatorios/:id', () => {
    test('deve retornar detalhes de um relatório específico', async () => {
      // Criar um relatório para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório Detalhado',
        tipo: 'academico',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'concluido',
        dados: {
          resumo: 'Este é um resumo detalhado',
          graficos: [
            {
              tipo: 'barra',
              titulo: 'Desempenho por curso',
              dados: { curso1: 85, curso2: 78, curso3: 92 }
            }
          ]
        }
      });
      
      // Fazer requisição como admin
      const res = await apiClient.get(`/api/relatorios/${relatorio._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('relatorio');
      expect(res.body.data.relatorio).toHaveProperty('_id', relatorio._id.toString());
      expect(res.body.data.relatorio).toHaveProperty('titulo', relatorio.titulo);
      expect(res.body.data.relatorio).toHaveProperty('dados');
      expect(res.body.data.relatorio.dados).toHaveProperty('resumo', relatorio.dados.resumo);
    });
    
    test('deve permitir acesso ao criador do relatório', async () => {
      // Criar um relatório para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório do Professor',
        tipo: 'desempenho',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.professor.usuario._id,
        status: 'concluido'
      });
      
      // Fazer requisição como o próprio professor
      const res = await apiClient.get(`/api/relatorios/${relatorio._id}`, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(200);
    });
    
    test('deve negar acesso a outros usuários não autorizados', async () => {
      // Criar um relatório para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório Privado',
        tipo: 'financeiro',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'concluido'
      });
      
      // Fazer requisição como professor (não criador)
      const res = await apiClient.get(`/api/relatorios/${relatorio._id}`, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('PUT /api/relatorios/:id', () => {
    test('deve atualizar um relatório pendente', async () => {
      // Criar um relatório pendente para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório para Atualizar',
        tipo: 'desempenho',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'pendente'
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        titulo: 'Título Atualizado',
        filtros: {
          curso: new mongoose.Types.ObjectId().toString()
        }
      };
      
      // Fazer requisição como admin (criador)
      const res = await apiClient.put(`/api/relatorios/${relatorio._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('relatorio');
      expect(res.body.data.relatorio).toHaveProperty('titulo', dadosAtualizados.titulo);
      expect(res.body.data.relatorio).toHaveProperty('filtros');
    });
    
    test('deve negar atualização de relatório concluído', async () => {
      // Criar um relatório concluído para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório Concluído',
        tipo: 'desempenho',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'concluido'
      });
      
      // Dados para atualização
      const dadosAtualizados = {
        titulo: 'Tentativa de Atualização'
      };
      
      // Fazer requisição como admin
      const res = await apiClient.put(`/api/relatorios/${relatorio._id}`, dadosAtualizados, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/não pode ser atualizado/i);
    });
  });
  
  describe('DELETE /api/relatorios/:id', () => {
    test('deve excluir um relatório pendente', async () => {
      // Criar um relatório pendente para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório para Excluir',
        tipo: 'desempenho',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'pendente'
      });
      
      // Fazer requisição como admin (criador)
      const res = await apiClient.delete(`/api/relatorios/${relatorio._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'sucesso');
      
      // Verificar se o relatório foi excluído
      const relatorioExcluido = await Relatorio.findById(relatorio._id);
      expect(relatorioExcluido).toBeNull();
    });
    
    test('deve permitir apenas admin arquivar relatórios concluídos', async () => {
      // Criar um relatório concluído para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório para Arquivar',
        tipo: 'desempenho',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'concluido'
      });
      
      // Fazer requisição como admin
      const res = await apiClient.delete(`/api/relatorios/${relatorio._id}`, { 
        token: usuariosAutenticados.admin.token 
      });
      
      expect(res.statusCode).toBe(200);
      
      // Verificar se o relatório foi arquivado, não excluído
      const relatorioArquivado = await Relatorio.findById(relatorio._id);
      expect(relatorioArquivado).not.toBeNull();
      expect(relatorioArquivado.status).toBe('arquivado');
    });
    
    test('deve negar exclusão para usuários não autorizados', async () => {
      // Criar um relatório para teste
      const relatorio = await Relatorio.create({
        titulo: 'Relatório Protegido',
        tipo: 'financeiro',
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: new Date()
        },
        criador: usuariosAutenticados.admin.usuario._id,
        status: 'pendente'
      });
      
      // Fazer requisição como professor (não criador)
      const res = await apiClient.delete(`/api/relatorios/${relatorio._id}`, { 
        token: usuariosAutenticados.professor.token 
      });
      
      expect(res.statusCode).toBe(403);
      
      // Verificar se o relatório ainda existe
      const relatorioAinda = await Relatorio.findById(relatorio._id);
      expect(relatorioAinda).not.toBeNull();
    });
  });
});
