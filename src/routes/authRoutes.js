/**
 * @swagger
 * tags:
 *  name: Autenticação
 *  description: Gerenciamento de autenticação e usuários
 */

const express = require('express');
const authController = require('../controllers/authController');
const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               senha:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sucesso
 *                 token:
 *                   type: string
 *                   description: JWT token para autenticação
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuario:
 *                       $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Credenciais inválidas
 *       400:
 *         description: Validação falhou
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar redefinição de senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *     responses:
 *       200:
 *         description: Email de redefinição enviado
 *       404:
 *         description: Email não encontrado
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   patch:
 *     summary: Redefinir senha com token
 *     tags: [Autenticação]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token de redefinição de senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senha
 *               - confirmarSenha
 *             properties:
 *               senha:
 *                 type: string
 *                 format: password
 *                 description: Nova senha
 *               confirmarSenha:
 *                 type: string
 *                 format: password
 *                 description: Confirmação da nova senha
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.patch('/reset-password/:token', authController.resetPassword);

// Rotas protegidas
router.use(protegerRota); // Middleware de autenticação para todas as rotas abaixo

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obter perfil do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuario:
 *                       $ref: '#/components/schemas/Usuario'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authController.getMe);

/**
 * @swagger
 * /auth/update-password:
 *   patch:
 *     summary: Atualizar senha do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senhaAtual
 *               - novaSenha
 *               - confirmarSenha
 *             properties:
 *               senhaAtual:
 *                 type: string
 *                 format: password
 *                 description: Senha atual
 *               novaSenha:
 *                 type: string
 *                 format: password
 *                 description: Nova senha
 *               confirmarSenha:
 *                 type: string
 *                 format: password
 *                 description: Confirmação da nova senha
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       400:
 *         description: Validação falhou
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/update-password', authController.updatePassword);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar um novo usuário
 *     description: Apenas administradores podem registrar novos usuários
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - confirmarSenha
 *               - role
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email único do usuário
 *               senha:
 *                 type: string
 *                 format: password
 *                 description: Senha (mínimo 8 caracteres)
 *               confirmarSenha:
 *                 type: string
 *                 format: password
 *                 description: Confirmação da senha
 *               role:
 *                 type: string
 *                 enum: [admin, professor, aluno]
 *                 description: Papel do usuário no sistema
 *               telefone:
 *                 type: string
 *                 description: Número de telefone do usuário
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Validação falhou
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Rotas apenas para admin
router.post('/register', protegerRota, restringirPara('admin'), authController.register);

module.exports = router;
