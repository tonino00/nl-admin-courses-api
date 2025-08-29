const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config/config');

/**
 * Middleware para proteger rotas - verifica se o usuário está autenticado
 */
exports.protegerRota = async (req, res, next) => {
  try {
    let token;

    // Verificar se o token está no cabeçalho Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar se o token existe
    if (!token) {
      return res.status(401).json({
        status: 'erro',
        message: 'Você não está autenticado. Por favor, faça login para acessar.'
      });
    }

    // Verificar se o token é válido
    const decoded = jwt.verify(token, config.jwtSecret);

    // Verificar se o usuário ainda existe
    const usuarioAtual = await Usuario.findById(decoded.id);
    if (!usuarioAtual) {
      return res.status(401).json({
        status: 'erro',
        message: 'O usuário associado a este token não existe mais.'
      });
    }

    // Guardar informações do usuário na requisição para uso posterior
    req.usuario = usuarioAtual;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'erro',
      message: 'Token inválido ou expirado'
    });
  }
};

/**
 * Middleware para restringir acesso com base na função do usuário
 * @param {...String} roles - Lista de funções permitidas
 */
exports.restringirPara = (...roles) => {
  return (req, res, next) => {
    // O middleware protegerRota deve ser chamado antes
    if (!req.usuario || !req.usuario.role) {
      return res.status(500).json({
        status: 'erro',
        message: 'Erro na configuração da proteção de rotas'
      });
    }

    // Verificar se a função do usuário está entre as permitidas
    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para realizar esta ação'
      });
    }

    next();
  };
};
