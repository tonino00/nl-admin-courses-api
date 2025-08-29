/**
 * @swagger
 * tags:
 *  name: Uploads
 *  description: Gerenciamento de uploads e arquivos estáticos
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/uploadHandler');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

/**
 * @swagger
 * /uploads/perfil:
 *   post:
 *     summary: Upload de foto de perfil
 *     description: Faz o upload de uma imagem para ser usada como foto de perfil do usuário.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foto
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem para foto de perfil (jpg, jpeg, png)
 *     responses:
 *       200:
 *         description: Foto de perfil enviada com sucesso
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
 *                     arquivo:
 *                       type: object
 *                       properties:
 *                         nomeOriginal:
 *                           type: string
 *                           description: Nome original do arquivo
 *                         nomeArquivo:
 *                           type: string
 *                           description: Nome do arquivo no sistema
 *                         tipo:
 *                           type: string
 *                           description: Tipo MIME do arquivo
 *                         tamanho:
 *                           type: integer
 *                           description: Tamanho do arquivo em bytes
 *                         url:
 *                           type: string
 *                           description: URL para acessar o arquivo
 *       400:
 *         description: Erro no upload (formato inválido ou arquivo muito grande)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/perfil',
  protect,
  (req, res, next) => upload('perfil', false)(req, res, (err) => {
    if (err) return next(err);
    next();
  }),
  uploadController.uploadFotoPerfil
);

/**
 * @swagger
 * /uploads/materiais:
 *   post:
 *     summary: Upload de materiais de curso
 *     description: Faz o upload de arquivos para serem usados como materiais de curso. Permite múltiplos arquivos.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - arquivos
 *               - cursoId
 *             properties:
 *               arquivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Arquivos a serem enviados (docs, pdf, ppt, xls, zip, etc)
 *               cursoId:
 *                 type: string
 *                 description: ID do curso ao qual os materiais pertencem
 *               aulaId:
 *                 type: string
 *                 description: ID da aula relacionada (opcional)
 *               descricao:
 *                 type: string
 *                 description: Descrição do material (opcional)
 *     responses:
 *       200:
 *         description: Materiais enviados com sucesso
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
 *                     arquivos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nomeOriginal:
 *                             type: string
 *                             description: Nome original do arquivo
 *                           nomeArquivo:
 *                             type: string
 *                             description: Nome do arquivo no sistema
 *                           tipo:
 *                             type: string
 *                             description: Tipo MIME do arquivo
 *                           tamanho:
 *                             type: integer
 *                             description: Tamanho do arquivo em bytes
 *                           url:
 *                             type: string
 *                             description: URL para acessar o arquivo
 *       400:
 *         description: Erro no upload (formato inválido ou arquivo muito grande)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/materiais',
  protect,
  (req, res, next) => {
    // Verificar se o usuário é professor ou admin
    if (!['professor', 'admin'].includes(req.usuario.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso não autorizado'
      });
    }
    next();
  },
  (req, res, next) => upload('materiais', true)(req, res, (err) => {
    if (err) return next(err);
    next();
  }),
  uploadController.uploadMaterialCurso
);

/**
 * @swagger
 * /uploads/mensagens:
 *   post:
 *     summary: Upload de anexos de mensagens
 *     description: Faz o upload de arquivos para serem usados como anexos em mensagens de chat.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - arquivos
 *               - conversaId
 *             properties:
 *               arquivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Arquivos a serem enviados como anexos (imagens, documentos, etc)
 *               conversaId:
 *                 type: string
 *                 description: ID da conversa na qual o anexo será utilizado
 *     responses:
 *       200:
 *         description: Anexos enviados com sucesso
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
 *                     arquivos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nomeOriginal:
 *                             type: string
 *                             description: Nome original do arquivo
 *                           nomeArquivo:
 *                             type: string
 *                             description: Nome do arquivo no sistema
 *                           tipo:
 *                             type: string
 *                             description: Tipo MIME do arquivo
 *                           tamanho:
 *                             type: integer
 *                             description: Tamanho do arquivo em bytes
 *                           url:
 *                             type: string
 *                             description: URL para acessar o arquivo
 *       400:
 *         description: Erro no upload (formato inválido ou arquivo muito grande)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/mensagens',
  protect,
  (req, res, next) => upload('mensagens', true)(req, res, (err) => {
    if (err) return next(err);
    next();
  }),
  uploadController.uploadAnexoMensagem
);

/**
 * @swagger
 * /uploads/{tipo}/{nomeArquivo}:
 *   get:
 *     summary: Acessar arquivo enviado
 *     description: Recupera e serve um arquivo enviado anteriormente pelo sistema de upload.
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [perfil, materiais, mensagens]
 *         required: true
 *         description: Tipo do arquivo (perfil, materiais ou mensagens)
 *       - in: path
 *         name: nomeArquivo
 *         schema:
 *           type: string
 *         required: true
 *         description: Nome do arquivo no sistema
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Arquivo recuperado com sucesso
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Autenticação necessária (exceto para fotos de perfil)
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:tipo/:nomeArquivo',
  (req, res, next) => {
    // Se o tipo for 'perfil', o acesso é público
    // Para outros tipos, o acesso é autenticado
    if (req.params.tipo !== 'perfil') {
      return protect(req, res, next);
    }
    next();
  },
  uploadController.servirArquivo
);

module.exports = router;
