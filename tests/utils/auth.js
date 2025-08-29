/**
 * Utilitários para testes de autenticação
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../../src/models/Usuario');
const config = require('../../src/config/config');

/**
 * Gera um token JWT para um usuário de teste
 * @param {Object} usuario - Objeto com dados do usuário
 * @returns {String} Token JWT
 */
const gerarToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id, role: usuario.role },
    config.jwt.secret || 'segredo-super-secreto-para-testes',
    { expiresIn: config.jwt.expiresIn || '1h' }
  );
};

/**
 * Cria um usuário de teste e gera um token JWT
 * @param {Object} dadosUsuario - Dados para criar o usuário (opcional)
 * @returns {Object} Objeto com usuário e token
 */
const criarUsuarioAutenticado = async (dadosUsuario = {}) => {
  // Dados padrão para usuário de teste
  const dadosPadrao = {
    nome: 'Usuário Teste',
    email: `teste-${Date.now()}@example.com`,
    senha: 'Senha@123',
    role: 'aluno',
    ativo: true,
    ...dadosUsuario
  };
  
  // Criar o usuário
  const usuario = await Usuario.create(dadosPadrao);
  
  // Gerar token
  const token = gerarToken(usuario);
  
  return { usuario, token };
};

/**
 * Cria usuários para diferentes papéis para testes
 * @returns {Object} Objeto com tokens para diferentes papéis
 */
const criarUsuariosPorPapel = async () => {
  // Criar um usuário admin
  const { usuario: admin, token: tokenAdmin } = await criarUsuarioAutenticado({
    nome: 'Admin Teste',
    email: `admin-${Date.now()}@example.com`,
    role: 'admin'
  });
  
  // Criar um usuário professor
  const { usuario: professor, token: tokenProfessor } = await criarUsuarioAutenticado({
    nome: 'Professor Teste',
    email: `professor-${Date.now()}@example.com`,
    role: 'professor'
  });
  
  // Criar um usuário aluno
  const { usuario: aluno, token: tokenAluno } = await criarUsuarioAutenticado({
    nome: 'Aluno Teste',
    email: `aluno-${Date.now()}@example.com`,
    role: 'aluno'
  });
  
  return {
    admin: { usuario: admin, token: tokenAdmin },
    professor: { usuario: professor, token: tokenProfessor },
    aluno: { usuario: aluno, token: tokenAluno }
  };
};

module.exports = {
  gerarToken,
  criarUsuarioAutenticado,
  criarUsuariosPorPapel
};
