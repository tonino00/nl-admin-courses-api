/**
 * Testes unitários para as funções de validação
 */
const validar = require('../../src/utils/validacao');
const alunoSchema = require('../../src/validacao/alunoValidacao');
const professorSchema = require('../../src/validacao/professorValidacao');
const cursoSchema = require('../../src/validacao/cursoValidacao');
const calendarioSchema = require('../../src/validacao/calendarioValidacao');
const relatorioSchema = require('../../src/validacao/relatorioValidacao');
const chatSchema = require('../../src/validacao/chatValidacao');

describe('Funções de Validação', () => {
  describe('validar()', () => {
    test('deve validar dados corretos', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({ error: null, value: { id: 1 } })
      };
      
      const resultado = validar(schema, { id: 1 });
      
      expect(resultado).toEqual({ id: 1 });
      expect(schema.validate).toHaveBeenCalledWith({ id: 1 }, { abortEarly: false });
    });
    
    test('deve lançar erro para dados inválidos', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({ 
          error: { 
            details: [{ message: 'Erro de validação' }] 
          } 
        })
      };
      
      expect(() => {
        validar(schema, { id: -1 });
      }).toThrow();
    });
  });
  
  describe('Schemas de Validação', () => {
    describe('alunoSchema', () => {
      test('deve validar dados de criação de aluno corretos', () => {
        const dadosAluno = {
          usuario: {
            nome: 'João Silva',
            email: 'joao@exemplo.com',
            senha: 'Senha@123',
            telefone: '(11) 98765-4321'
          },
          matricula: 'ALU20250001',
          endereco: {
            rua: 'Rua Exemplo',
            numero: '123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01001-000'
          }
        };
        
        expect(() => {
          validar(alunoSchema.criar, dadosAluno);
        }).not.toThrow();
      });
      
      test('deve rejeitar dados de aluno inválidos', () => {
        const dadosInvalidos = {
          usuario: {
            nome: 'J', // Nome muito curto
            email: 'email-invalido',
            senha: '123' // Senha fraca
          }
        };
        
        expect(() => {
          validar(alunoSchema.criar, dadosInvalidos);
        }).toThrow();
      });
    });
    
    describe('professorSchema', () => {
      test('deve validar dados de criação de professor corretos', () => {
        const dadosProfessor = {
          usuario: {
            nome: 'Maria Santos',
            email: 'maria@exemplo.com',
            senha: 'Senha@123',
            telefone: '(11) 91234-5678'
          },
          especialidade: 'Matemática',
          formacao: 'doutorado',
          instituicaoFormacao: 'USP'
        };
        
        expect(() => {
          validar(professorSchema.criar, dadosProfessor);
        }).not.toThrow();
      });
    });
    
    describe('cursoSchema', () => {
      test('deve validar dados de criação de curso corretos', () => {
        const dadosCurso = {
          nome: 'Curso de JavaScript',
          descricao: 'Aprenda JavaScript do zero',
          categoria: 'Programação',
          cargaHoraria: 40,
          nivel: 'iniciante',
          dataInicio: new Date().toISOString(),
          dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          preco: 199.90,
          professor: '60d21b4667d0d8992e610c87',
          vagas: 30
        };
        
        expect(() => {
          validar(cursoSchema.criar, dadosCurso);
        }).not.toThrow();
      });
      
      test('deve validar dados de matrícula em curso', () => {
        const dadosMatricula = {
          alunoId: '60d21b4667d0d8992e610c88',
          formaPagamento: 'cartao',
          parcelas: 3
        };
        
        expect(() => {
          validar(cursoSchema.matricular, dadosMatricula);
        }).not.toThrow();
      });
    });
    
    describe('calendarioSchema', () => {
      test('deve validar dados de evento do calendário', () => {
        const dadosEvento = {
          titulo: 'Início das Aulas',
          descricao: 'Início do semestre letivo',
          dataInicio: new Date().toISOString(),
          dataFim: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          tipo: 'academico',
          cor: '#4285F4'
        };
        
        expect(() => {
          validar(calendarioSchema.criar, dadosEvento);
        }).not.toThrow();
      });
    });
    
    describe('relatorioSchema', () => {
      test('deve validar dados de criação de relatório', () => {
        const dadosRelatorio = {
          titulo: 'Relatório de Desempenho',
          tipo: 'desempenho',
          periodo: {
            inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            fim: new Date().toISOString()
          },
          filtros: {
            cursoId: '60d21b4667d0d8992e610c89',
            status: 'concluido'
          }
        };
        
        expect(() => {
          validar(relatorioSchema.criar, dadosRelatorio);
        }).not.toThrow();
      });
    });
    
    describe('chatSchema', () => {
      test('deve validar dados de criação de conversa', () => {
        const dadosConversa = {
          titulo: 'Dúvidas sobre o curso',
          participantes: ['60d21b4667d0d8992e610c8a', '60d21b4667d0d8992e610c8b'],
          mensagemInicial: {
            conteudo: 'Olá, tenho algumas dúvidas sobre o curso.',
            tipo: 'texto'
          }
        };
        
        expect(() => {
          validar(chatSchema.criarConversa, dadosConversa);
        }).not.toThrow();
      });
      
      test('deve validar dados de envio de mensagem', () => {
        const dadosMensagem = {
          conteudo: 'Esta é uma mensagem de teste',
          tipo: 'texto'
        };
        
        expect(() => {
          validar(chatSchema.enviarMensagem, dadosMensagem);
        }).not.toThrow();
      });
    });
  });
});
