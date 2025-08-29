const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const crypto = require('crypto');

/**
 * Registrar novo usuário
 * @route POST /api/auth/register
 * @access Privado (apenas admin)
 */
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;

    // Verificar se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'erro',
        message: 'Email já está sendo utilizado'
      });
    }

    // Criar novo usuário
    const usuario = await Usuario.create({
      nome,
      email,
      senha,
      role: role || 'aluno'
    });

    // Remover a senha da resposta
    usuario.senha = undefined;

    // Gerar token
    const token = usuario.gerarToken();

    res.status(201).json({
      status: 'sucesso',
      token,
      data: {
        usuario
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Login de usuário
 * @route POST /api/auth/login
 * @access Público
 */
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verificar se email e senha foram fornecidos
    if (!email || !senha) {
      return res.status(400).json({
        status: 'erro',
        message: 'Por favor, forneça email e senha'
      });
    }

    // Verificar se o usuário existe
    const usuario = await Usuario.findOne({ email }).select('+senha');
    if (!usuario) {
      return res.status(401).json({
        status: 'erro',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar se a senha está correta
    const senhaCorreta = await usuario.compararSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        status: 'erro',
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = usuario.gerarToken();

    // Remover a senha da resposta
    usuario.senha = undefined;

    res.status(200).json({
      status: 'sucesso',
      token,
      data: {
        usuario
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Obter dados do usuário atual
 * @route GET /api/auth/me
 * @access Privado
 */
exports.getMe = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    res.status(200).json({
      status: 'sucesso',
      data: {
        usuario
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Atualizar senha do usuário
 * @route PATCH /api/auth/update-password
 * @access Privado
 */
exports.updatePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    // Buscar usuário com senha
    const usuario = await Usuario.findById(req.usuario.id).select('+senha');

    // Verificar se a senha atual está correta
    const senhaCorreta = await usuario.compararSenha(senhaAtual);
    if (!senhaCorreta) {
      return res.status(401).json({
        status: 'erro',
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    usuario.senha = novaSenha;
    await usuario.save();

    // Gerar novo token
    const token = usuario.gerarToken();

    res.status(200).json({
      status: 'sucesso',
      token,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Solicitar redefinição de senha
 * @route POST /api/auth/forgot-password
 * @access Público
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuário pelo email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({
        status: 'erro',
        message: 'Não existe usuário com este email'
      });
    }

    // Gerar token de redefinição de senha
    const resetToken = crypto.randomBytes(32).toString('hex');
    usuario.resetSenhaToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    usuario.resetSenhaExpiracao = Date.now() + 10 * 60 * 1000; // 10 minutos
    await usuario.save({ validateBeforeSave: false });

    // Enviar email com token (implementação simplificada)
    // Na implementação real, usar um serviço de email

    res.status(200).json({
      status: 'sucesso',
      message: 'Token de redefinição enviado para o email',
      // Em ambiente de desenvolvimento, retornar o token para testes
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Redefinir senha com token
 * @route PATCH /api/auth/reset-password/:token
 * @access Público
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { senha } = req.body;

    // Hash do token recebido
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuário pelo token de redefinição
    const usuario = await Usuario.findOne({
      resetSenhaToken: hashedToken,
      resetSenhaExpiracao: { $gt: Date.now() }
    });

    // Verificar se o token é válido e não expirou
    if (!usuario) {
      return res.status(400).json({
        status: 'erro',
        message: 'Token inválido ou expirado'
      });
    }

    // Atualizar senha e remover campos de redefinição
    usuario.senha = senha;
    usuario.resetSenhaToken = undefined;
    usuario.resetSenhaExpiracao = undefined;
    await usuario.save();

    // Gerar novo token de autenticação
    const authToken = usuario.gerarToken();

    res.status(200).json({
      status: 'sucesso',
      token: authToken,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};
