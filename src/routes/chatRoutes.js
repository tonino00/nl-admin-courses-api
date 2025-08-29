/**
 * @swagger
 * tags:
 *  name: Chat
 *  description: Gerenciamento do sistema de mensagens e conversas
 */

const express = require('express');
const chatController = require('../controllers/chatController');
const { protegerRota } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de chat são protegidas
router.use(protegerRota);

/**
 * @swagger
 * /chat/conversas:
 *   get:
 *     summary: Listar conversas do usuário
 *     description: Recupera todas as conversas que o usuário logado participa.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página para paginação de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de itens por página
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [individual, grupo, curso]
 *         description: Filtrar por tipo de conversa
 *       - in: query
 *         name: arquivadas
 *         schema:
 *           type: boolean
 *         description: Incluir conversas arquivadas (true) ou apenas ativas (false)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por título ou participante
 *     responses:
 *       200:
 *         description: Lista de conversas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sucesso
 *                 resultados:
 *                   type: integer
 *                   description: Total de conversas encontradas
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Conversa'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: Página atual
 *                     limit:
 *                       type: integer
 *                       description: Itens por página
 *                     totalPages:
 *                       type: integer
 *                       description: Total de páginas
 *                     total:
 *                       type: integer
 *                       description: Total de registros
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     summary: Criar uma nova conversa
 *     description: Inicia uma nova conversa individual ou em grupo.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantes
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título da conversa (obrigatório para grupos)
 *               participantes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs dos participantes (excluindo o criador que é adicionado automaticamente)
 *               tipo:
 *                 type: string
 *                 enum: [individual, grupo]
 *                 default: individual
 *                 description: Tipo da conversa
 *               cursoId:
 *                 type: string
 *                 description: ID do curso associado (opcional)
 *     responses:
 *       201:
 *         description: Conversa criada com sucesso
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
 *                     conversa:
 *                       $ref: '#/components/schemas/Conversa'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Um ou mais participantes não encontrados
 */
// Rotas para gestão de conversas
router
  .route('/conversas')
  .get(chatController.getConversas)
  .post(chatController.criarConversa);

/**
 * @swagger
 * /chat/conversas/{id}:
 *   get:
 *     summary: Obter detalhes de uma conversa
 *     description: Recupera informações detalhadas de uma conversa específica, incluindo metadados e últimas mensagens.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conversa
 *       - in: query
 *         name: incluirMensagens
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Incluir as últimas mensagens da conversa na resposta
 *       - in: query
 *         name: mensagensLimit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de mensagens a retornar
 *     responses:
 *       200:
 *         description: Detalhes da conversa
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
 *                     conversa:
 *                       $ref: '#/components/schemas/Conversa'
 *                     mensagens:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Mensagem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para uma conversa específica
router
  .route('/conversas/:id')
  .get(chatController.getConversa);

/**
 * @swagger
 * /chat/conversas/{id}/participantes:
 *   post:
 *     summary: Adicionar participantes a uma conversa
 *     description: Adiciona novos participantes a uma conversa existente. Apenas o criador da conversa ou administradores podem realizar esta ação.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conversa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantes
 *             properties:
 *               participantes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs dos novos participantes
 *               notificar:
 *                 type: boolean
 *                 default: true
 *                 description: Notificar os novos participantes
 *     responses:
 *       200:
 *         description: Participantes adicionados com sucesso
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
 *                     conversa:
 *                       $ref: '#/components/schemas/Conversa'
 *                     adicionados:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nome:
 *                             type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para gerenciar participantes
router
  .route('/conversas/:id/participantes')
  .post(chatController.adicionarParticipantes);

/**
 * @swagger
 * /chat/conversas/{id}/participantes/{usuarioId}:
 *   delete:
 *     summary: Remover participante de uma conversa
 *     description: Remove um participante de uma conversa existente. O criador pode remover qualquer participante, um participante pode se remover, mas não pode remover outros.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conversa
 *       - in: path
 *         name: usuarioId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário a ser removido
 *     responses:
 *       200:
 *         description: Participante removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sucesso
 *                 message:
 *                   type: string
 *                   example: Participante removido com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router
  .route('/conversas/:id/participantes/:usuarioId')
  .delete(chatController.removerParticipante);

/**
 * @swagger
 * /chat/conversas/{id}/mensagens:
 *   get:
 *     summary: Listar mensagens de uma conversa
 *     description: Recupera as mensagens de uma conversa específica, com suporte a paginação e filtragem.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conversa
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página para paginação de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número de mensagens por página
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Recuperar mensagens anteriores a esta data/hora
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Recuperar mensagens posteriores a esta data/hora
 *       - in: query
 *         name: autor
 *         schema:
 *           type: string
 *         description: Filtrar por ID do autor da mensagem
 *     responses:
 *       200:
 *         description: Lista de mensagens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sucesso
 *                 resultados:
 *                   type: integer
 *                   description: Total de mensagens encontradas
 *                 data:
 *                   type: object
 *                   properties:
 *                     mensagens:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Mensagem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: Página atual
 *                     limit:
 *                       type: integer
 *                       description: Itens por página
 *                     totalPages:
 *                       type: integer
 *                       description: Total de páginas
 *                     total:
 *                       type: integer
 *                       description: Total de mensagens
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   post:
 *     summary: Enviar uma nova mensagem
 *     description: Envia uma nova mensagem para a conversa.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conversa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conteudo
 *             properties:
 *               conteudo:
 *                 type: string
 *                 description: Conteúdo textual da mensagem
 *               tipo:
 *                 type: string
 *                 enum: [texto, arquivo, imagem]
 *                 default: texto
 *                 description: Tipo da mensagem
 *               anexoId:
 *                 type: string
 *                 description: ID do anexo, se houver (deve ser enviado previamente via rota de upload)
 *               respostaA:
 *                 type: string
 *                 description: ID da mensagem que está sendo respondida (se for uma resposta)
 *     responses:
 *       201:
 *         description: Mensagem enviada com sucesso
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
 *                     mensagem:
 *                       $ref: '#/components/schemas/Mensagem'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para mensagens
router
  .route('/conversas/:id/mensagens')
  .get(chatController.getMensagens)
  .post(chatController.enviarMensagem);

/**
 * @swagger
 * /chat/conversas/{id}/arquivar:
 *   patch:
 *     summary: Arquivar ou desarquivar uma conversa
 *     description: Altera o status de arquivamento de uma conversa. Um usuário pode arquivar uma conversa para si mesmo sem impactar outros participantes.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conversa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - arquivada
 *             properties:
 *               arquivada:
 *                 type: boolean
 *                 description: True para arquivar, false para desarquivar
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sucesso
 *                 message:
 *                   type: string
 *                   example: Conversa arquivada com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversa:
 *                       $ref: '#/components/schemas/Conversa'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rota para arquivar/desarquivar conversa
router
  .route('/conversas/:id/arquivar')
  .patch(chatController.arquivarConversa);

module.exports = router;
