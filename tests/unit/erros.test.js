/**
 * Testes unitários para as classes de erro e middleware de erros
 */
const {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
  RateLimitError
} = require('../../src/errors');
const errorHandler = require('../../src/middleware/errorHandler');

describe('Classes de Erro', () => {
  describe('AppError', () => {
    test('deve criar um erro base com propriedades corretas', () => {
      const erro = new AppError('Erro de teste', 400);
      
      expect(erro).toBeInstanceOf(Error);
      expect(erro.message).toBe('Erro de teste');
      expect(erro.statusCode).toBe(400);
      expect(erro.status).toBe('error');
      expect(erro.isOperational).toBe(true);
    });
  });
  
  describe('NotFoundError', () => {
    test('deve criar um erro 404 com mensagem padrão', () => {
      const erro = new NotFoundError();
      
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(404);
      expect(erro.message).toBe('Recurso não encontrado');
    });
    
    test('deve criar um erro 404 com mensagem personalizada', () => {
      const erro = new NotFoundError('Aluno não encontrado');
      
      expect(erro.statusCode).toBe(404);
      expect(erro.message).toBe('Aluno não encontrado');
    });
  });
  
  describe('ValidationError', () => {
    test('deve criar um erro 400 para validação', () => {
      const erro = new ValidationError('Dados inválidos');
      
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(400);
      expect(erro.message).toBe('Dados inválidos');
    });
  });
  
  describe('AuthenticationError', () => {
    test('deve criar um erro 401 para autenticação', () => {
      const erro = new AuthenticationError('Credenciais inválidas');
      
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(401);
      expect(erro.message).toBe('Credenciais inválidas');
    });
  });
  
  describe('ForbiddenError', () => {
    test('deve criar um erro 403 para autorização', () => {
      const erro = new ForbiddenError('Acesso negado');
      
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(403);
      expect(erro.message).toBe('Acesso negado');
    });
  });
  
  describe('ConflictError', () => {
    test('deve criar um erro 409 para conflitos', () => {
      const erro = new ConflictError('Recurso já existe');
      
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(409);
      expect(erro.message).toBe('Recurso já existe');
    });
  });
  
  describe('RateLimitError', () => {
    test('deve criar um erro 429 para limite de taxa', () => {
      const erro = new RateLimitError('Muitas requisições');
      
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(429);
      expect(erro.message).toBe('Muitas requisições');
    });
  });
});

describe('Middleware de Tratamento de Erros', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Simular ambiente de produção ou desenvolvimento
    process.env.NODE_ENV = 'development';
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('deve tratar erros operacionais corretamente', () => {
    const erro = new ValidationError('Dados inválidos');
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Dados inválidos'
    });
  });
  
  test('deve tratar erros do Mongoose (CastError)', () => {
    const erro = {
      name: 'CastError',
      message: 'Cast to ObjectId failed',
      path: 'id',
      value: 'invalid-id'
    };
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('ID inválido')
      })
    );
  });
  
  test('deve tratar erros de validação do Mongoose', () => {
    const erro = {
      name: 'ValidationError',
      errors: {
        nome: { message: 'Nome é obrigatório' },
        email: { message: 'Email inválido' }
      }
    };
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('validação')
      })
    );
  });
  
  test('deve tratar erros de duplicidade do MongoDB', () => {
    const erro = {
      name: 'MongoError',
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'teste@exemplo.com' }
    };
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('duplicado')
      })
    );
  });
  
  test('deve tratar erros JWT', () => {
    const erro = {
      name: 'JsonWebTokenError',
      message: 'invalid token'
    };
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('token')
      })
    );
  });
  
  test('deve tratar erros JWT expirados', () => {
    const erro = {
      name: 'TokenExpiredError',
      message: 'jwt expired',
      expiredAt: new Date()
    };
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('expirado')
      })
    );
  });
  
  test('deve ter comportamento diferente em produção e desenvolvimento', () => {
    // Testar em ambiente de desenvolvimento
    process.env.NODE_ENV = 'development';
    
    const erro = new Error('Erro interno');
    erro.stack = 'Stack trace simulada';
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Erro interno',
        stack: 'Stack trace simulada'
      })
    );
    
    jest.resetAllMocks();
    
    // Testar em ambiente de produção
    process.env.NODE_ENV = 'production';
    
    errorHandler(erro, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Algo deu errado. Por favor, tente novamente mais tarde.'
    });
    
    // Não deve incluir stack trace em produção
    const resData = res.json.mock.calls[0][0];
    expect(resData).not.toHaveProperty('stack');
  });
});
