/**
 * Testes para o módulo de Upload
 */
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { conectarDB, limparBancoDeDados, desconectarDB } = require('../utils/db');
const apiClient = require('../utils/request');
const { criarUsuariosPorPapel } = require('../utils/auth');

// Transformar callbacks em promises
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Configuração antes de todos os testes
beforeAll(async () => {
  await conectarDB();
  
  // Garantir que os diretórios de upload existam
  const dirs = ['uploads/perfil', 'uploads/materiais', 'uploads/mensagens'];
  for (const dir of dirs) {
    try {
      await mkdir(path.join(process.cwd(), dir), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
  
  // Criar arquivo de teste
  const testImagePath = path.join(process.cwd(), 'tests/fixtures');
  try {
    await mkdir(testImagePath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  
  // Criar um arquivo de imagem de teste simples (1x1 pixel PNG)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x00, 0x02, 0x00,
    0x00, 0x05, 0x00, 0x01, 0xE2, 0x26, 0x05, 0x9B, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  await writeFile(path.join(testImagePath, 'test.png'), pngHeader);
  
  // Criar um arquivo PDF de teste simples
  const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n', 'utf-8');
  await writeFile(path.join(testImagePath, 'test.pdf'), pdfHeader);
});

// Limpar o banco de dados antes de cada teste
beforeEach(async () => {
  await limparBancoDeDados();
});

// Desconectar do banco após todos os testes
afterAll(async () => {
  await desconectarDB();
  
  // Limpar arquivos de teste
  try {
    await unlink(path.join(process.cwd(), 'tests/fixtures/test.png'));
    await unlink(path.join(process.cwd(), 'tests/fixtures/test.pdf'));
  } catch (err) {
    console.error('Erro ao limpar arquivos de teste:', err);
  }
});

describe('Módulo de Upload', () => {
  let usuariosAutenticados;
  let testImagePath;
  let testPdfPath;

  // Criar usuários de teste para cada papel antes dos testes
  beforeEach(async () => {
    usuariosAutenticados = await criarUsuariosPorPapel();
    testImagePath = path.join(process.cwd(), 'tests/fixtures/test.png');
    testPdfPath = path.join(process.cwd(), 'tests/fixtures/test.pdf');
  });

  describe('POST /api/uploads/perfil', () => {
    test('deve permitir upload de foto de perfil', async () => {
      const res = await apiClient
        .post('/api/uploads/perfil')
        .set('Authorization', `Bearer ${usuariosAutenticados.aluno.token}`)
        .attach('arquivo', testImagePath);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(res.body.data).toHaveProperty('arquivo');
      expect(res.body.data.arquivo).toHaveProperty('url');
      expect(res.body.data.arquivo.url).toMatch(/\/uploads\/perfil\//);
    });
    
    test('deve rejeitar upload sem autenticação', async () => {
      const res = await apiClient
        .post('/api/uploads/perfil')
        .attach('arquivo', testImagePath);
      
      expect(res.statusCode).toBe(401);
    });
    
    test('deve rejeitar arquivos que não são imagens', async () => {
      const res = await apiClient
        .post('/api/uploads/perfil')
        .set('Authorization', `Bearer ${usuariosAutenticados.aluno.token}`)
        .attach('arquivo', testPdfPath);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/formato de arquivo/i);
    });
  });
  
  describe('POST /api/uploads/materiais', () => {
    test('deve permitir upload de materiais por professores', async () => {
      const res = await apiClient
        .post('/api/uploads/materiais')
        .set('Authorization', `Bearer ${usuariosAutenticados.professor.token}`)
        .attach('arquivos', testPdfPath)
        .attach('arquivos', testImagePath)
        .field('cursoId', '60d21b4667d0d8992e610c85'); // ID fictício
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(Array.isArray(res.body.data.arquivos)).toBe(true);
      expect(res.body.data.arquivos).toHaveLength(2);
    });
    
    test('deve rejeitar upload de materiais por alunos', async () => {
      const res = await apiClient
        .post('/api/uploads/materiais')
        .set('Authorization', `Bearer ${usuariosAutenticados.aluno.token}`)
        .attach('arquivos', testPdfPath);
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('POST /api/uploads/mensagens', () => {
    test('deve permitir upload de anexos de mensagens', async () => {
      const res = await apiClient
        .post('/api/uploads/mensagens')
        .set('Authorization', `Bearer ${usuariosAutenticados.aluno.token}`)
        .attach('arquivos', testPdfPath)
        .attach('arquivos', testImagePath)
        .field('conversaId', '60d21b4667d0d8992e610c86'); // ID fictício
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'sucesso');
      expect(Array.isArray(res.body.data.arquivos)).toBe(true);
      expect(res.body.data.arquivos).toHaveLength(2);
    });
  });
  
  describe('GET /api/uploads/:tipo/:nomeArquivo', () => {
    test('deve servir arquivos de foto de perfil sem autenticação', async () => {
      // Primeiro fazer upload de um arquivo
      const uploadRes = await apiClient
        .post('/api/uploads/perfil')
        .set('Authorization', `Bearer ${usuariosAutenticados.aluno.token}`)
        .attach('arquivo', testImagePath);
      
      // Extrair o nome do arquivo da URL
      const url = uploadRes.body.data.arquivo.url;
      const nomeArquivo = url.split('/').pop();
      
      // Tentar acessar o arquivo
      const res = await apiClient
        .get(`/api/uploads/perfil/${nomeArquivo}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/^image\//);
    });
    
    test('deve requerer autenticação para materiais de curso', async () => {
      // Primeiro fazer upload de um arquivo
      const uploadRes = await apiClient
        .post('/api/uploads/materiais')
        .set('Authorization', `Bearer ${usuariosAutenticados.professor.token}`)
        .attach('arquivos', testPdfPath)
        .field('cursoId', '60d21b4667d0d8992e610c85'); // ID fictício
      
      // Extrair o nome do arquivo da URL
      const url = uploadRes.body.data.arquivos[0].url;
      const nomeArquivo = url.split('/').pop();
      
      // Tentar acessar o arquivo sem autenticação
      const res = await apiClient
        .get(`/api/uploads/materiais/${nomeArquivo}`);
      
      expect(res.statusCode).toBe(401);
      
      // Tentar acessar o arquivo com autenticação
      const resAuth = await apiClient
        .get(`/api/uploads/materiais/${nomeArquivo}`)
        .set('Authorization', `Bearer ${usuariosAutenticados.aluno.token}`);
      
      expect(resAuth.statusCode).toBe(200);
    });
  });
});
