/**
 * @swagger
 * tags:
 *  name: Calendário
 *  description: Gerenciamento do calendário acadêmico e eventos
 */

const express = require('express');
const calendarioController = require('../controllers/calendarioController');
const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de calendário são protegidas
router.use(protegerRota);

/**
 * @swagger
 * /calendario:
 *   get:
 *     summary: Listar todos os eventos do calendário
 *     description: Recupera a lista de todos os eventos no calendário acadêmico. Acessível para todos os usuários autenticados.
 *     tags: [Calendário]
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
 *         name: sort
 *         schema:
 *           type: string
 *         description: Campo para ordenação (ex. dataInicio,-dataCriacao)
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar eventos
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar eventos
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [aula, prova, feriado, evento, reuniao]
 *         description: Filtrar por tipo de evento
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para filtrar eventos
 *     responses:
 *       200:
 *         description: Lista de eventos do calendário
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
 *                   description: Total de eventos encontrados
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Evento'
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
 *     summary: Criar um novo evento no calendário
 *     description: Cria um novo evento no calendário acadêmico. Acessível apenas para administradores e professores.
 *     tags: [Calendário]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - dataInicio
 *               - dataFim
 *               - tipo
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título do evento
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada do evento
 *               dataInicio:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora de início do evento
 *               dataFim:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora de término do evento
 *               tipo:
 *                 type: string
 *                 enum: [aula, prova, feriado, evento, reuniao]
 *                 description: Tipo do evento
 *               local:
 *                 type: string
 *                 description: Local onde o evento acontecerá
 *               cursoId:
 *                 type: string
 *                 description: ID do curso associado (se aplicável)
 *               recorrente:
 *                 type: boolean
 *                 description: Se o evento é recorrente
 *               padraoRecorrencia:
 *                 type: string
 *                 description: Padrão de recorrência (ex. 'semanal', 'quinzenal')
 *               notificar:
 *                 type: boolean
 *                 description: Se os participantes devem ser notificados
 *     responses:
 *       201:
 *         description: Evento criado com sucesso
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
 *                     evento:
 *                       $ref: '#/components/schemas/Evento'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Rotas para listagem e criação de eventos
router
  .route('/')
  .get(calendarioController.getEventos) // Todos usuários autenticados podem ver eventos
  .post(restringirPara('admin', 'professor'), calendarioController.criarEvento); // Admin e professor podem criar

/**
 * @swagger
 * /calendario/{id}:
 *   get:
 *     summary: Obter detalhes de um evento do calendário
 *     description: Recupera informações detalhadas de um evento específico.
 *     tags: [Calendário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do evento
 *     responses:
 *       200:
 *         description: Detalhes do evento
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
 *                     evento:
 *                       $ref: '#/components/schemas/Evento'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   put:
 *     summary: Atualizar um evento do calendário
 *     description: Atualiza informações de um evento existente. Admin e professor criador podem editar.
 *     tags: [Calendário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título do evento
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada do evento
 *               dataInicio:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora de início do evento
 *               dataFim:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora de término do evento
 *               tipo:
 *                 type: string
 *                 enum: [aula, prova, feriado, evento, reuniao]
 *                 description: Tipo do evento
 *               local:
 *                 type: string
 *                 description: Local onde o evento acontecerá
 *               cursoId:
 *                 type: string
 *                 description: ID do curso associado (se aplicável)
 *               recorrente:
 *                 type: boolean
 *                 description: Se o evento é recorrente
 *               padraoRecorrencia:
 *                 type: string
 *                 description: Padrão de recorrência (ex. 'semanal', 'quinzenal')
 *               notificar:
 *                 type: boolean
 *                 description: Se os participantes devem ser notificados
 *     responses:
 *       200:
 *         description: Evento atualizado com sucesso
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
 *                     evento:
 *                       $ref: '#/components/schemas/Evento'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   delete:
 *     summary: Remover um evento do calendário
 *     description: Remove um evento existente. Admin e professor criador podem remover.
 *     tags: [Calendário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do evento
 *     responses:
 *       204:
 *         description: Evento removido com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para operações com um evento específico
router
  .route('/:id')
  .get(calendarioController.getEvento)
  .put(calendarioController.atualizarEvento) // Admin e professor criador podem editar
  .delete(calendarioController.removerEvento); // Admin e professor criador podem remover

/**
 * @swagger
 * /calendario/curso/{cursoId}:
 *   get:
 *     summary: Listar eventos de um curso específico
 *     description: Recupera todos os eventos associados a um curso específico.
 *     tags: [Calendário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cursoId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar eventos
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar eventos
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [aula, prova, feriado, evento, reuniao]
 *         description: Filtrar por tipo de evento
 *     responses:
 *       200:
 *         description: Lista de eventos do curso
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
 *                   description: Total de eventos encontrados
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Evento'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Curso não encontrado
 */
// Rota para eventos de um curso específico
router.get('/curso/:cursoId', calendarioController.getEventosCurso);

module.exports = router;
