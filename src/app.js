const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');
const { setupSwagger } = require('./config/swagger');
const { authLimiter, apiLimiter, adminLimiter } = require('./middleware/rateLimiter');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const alunoRoutes = require('./routes/alunoRoutes');
const professorRoutes = require('./routes/professorRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Criar a aplicação Express
const app = express();

// Middlewares básicos
app.use(helmet({  // Segurança para cabeçalhos HTTP
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"]
    }
  }
})); 
app.use(cors());    // Habilitar CORS
app.use(express.json({ limit: '10mb' }));  // Parsear requisições JSON com limite aumentado
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  // Parsear requisições com formulários
app.use(morgan('dev'));  // Logging de requisições

// Configurar pasta de arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota básica para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.json({ 
    message: 'API do Sistema de Gestão Acadêmica',
    version: '1.0.0',
    status: 'online'
  });
});

// Aplicar limitador de requisições nas rotas sensíveis
app.use('/api/auth', authLimiter, authRoutes);  // Proteção rigorosa para autenticação
app.use('/api/alunos', apiLimiter, alunoRoutes);
app.use('/api/professores', apiLimiter, professorRoutes);
app.use('/api/cursos', apiLimiter, cursoRoutes);
app.use('/api/calendario', apiLimiter, calendarioRoutes);
app.use('/api/relatorios', apiLimiter, relatorioRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/uploads', apiLimiter, uploadRoutes);

// Configurar Swagger para documentação da API
setupSwagger(app);

// Middleware para tratamento de rotas não encontradas
app.use('*', (req, res, next) => {
  next(new NotFoundError('Rota não encontrada'));
});

// Middleware para tratamento de erros
app.use(errorHandler);

module.exports = app;
