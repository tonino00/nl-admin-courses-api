/**
 * @swagger
 * tags:
 *  name: Professores
 *  description: Gerenciamento de professores
 */

const express = require('express');
const professorController = require('../controllers/professorController');
const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de professores são protegidas
router.use(protegerRota);

/**
 * @swagger
 * /professores:
 *   get:
 *     summary: Listar todos os professores
 *     description: Recupera a lista de todos os professores. Acessível apenas para administradores.
 *     tags: [Professores]
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
 *         description: Campo para ordenação (ex. nome,-dataCriacao)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para filtrar professores
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Filtrar por área de especialização
 *       - in: query
 *         name: disponivel
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidade
 *     responses:
 *       200:
 *         description: Lista de professores
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
 *                   description: Total de professores encontrados
 *                 data:
 *                   type: object
 *                   properties:
 *                     professores:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Professor'
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   post:
 *     summary: Criar um novo professor
 *     description: Cria um novo registro de professor. Acessível apenas para administradores.
 *     tags: [Professores]
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
 *               - registro
 *               - areaEspecializacao
 *               - titulacao
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do professor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do professor
 *               registro:
 *                 type: string
 *                 description: Número de registro único
 *               telefone:
 *                 type: string
 *                 description: Número de telefone do professor
 *               areaEspecializacao:
 *                 type: string
 *                 description: Área principal de especialização
 *               titulacao:
 *                 type: string
 *                 enum: [especialista, mestre, doutor, pos-doutor]
 *                 description: Título acadêmico do professor
 *               biografia:
 *                 type: string
 *                 description: Breve biografia profissional
 *               disponibilidade:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     diaSemana:
 *                       type: string
 *                       enum: [segunda, terca, quarta, quinta, sexta, sabado]
 *                     horarioInicio:
 *                       type: string
 *                       format: time
 *                     horarioFim:
 *                       type: string
 *                       format: time
 *     responses:
 *       201:
 *         description: Professor criado com sucesso
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
 *                     professor:
 *                       $ref: '#/components/schemas/Professor'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Professor já existe com este email ou registro
 */
// Rotas para listagem e criação de professores
router
  .route('/')
  .get(restringirPara('admin'), professorController.getProfessores)
  .post(restringirPara('admin'), professorController.criarProfessor);

/**
 * @swagger
 * /professores/{id}:
 *   get:
 *     summary: Obter detalhes de um professor
 *     description: Recupera informações detalhadas de um professor específico.
 *     tags: [Professores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do professor
 *     responses:
 *       200:
 *         description: Detalhes do professor
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
 *                     professor:
 *                       $ref: '#/components/schemas/Professor'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   put:
 *     summary: Atualizar um professor
 *     description: Atualiza informações de um professor existente. Admin e o próprio professor podem editar.
 *     tags: [Professores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do professor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do professor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do professor
 *               telefone:
 *                 type: string
 *                 description: Número de telefone do professor
 *               areaEspecializacao:
 *                 type: string
 *                 description: Área principal de especialização
 *               titulacao:
 *                 type: string
 *                 enum: [especialista, mestre, doutor, pos-doutor]
 *                 description: Título acadêmico do professor
 *               biografia:
 *                 type: string
 *                 description: Breve biografia profissional
 *     responses:
 *       200:
 *         description: Professor atualizado com sucesso
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
 *                     professor:
 *                       $ref: '#/components/schemas/Professor'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Email já em uso por outro professor
 *
 *   delete:
 *     summary: Desativar um professor
 *     description: Desativa (soft delete) um professor existente. Acessível apenas para administradores.
 *     tags: [Professores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do professor
 *     responses:
 *       204:
 *         description: Professor desativado com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para operações com um professor específico
router
  .route('/:id')
  .get(professorController.getProfessor)
  .put(professorController.atualizarProfessor) // Admin e o próprio professor podem editar
  .delete(restringirPara('admin'), professorController.removerProfessor);

/**
 * @swagger
 * /professores/{id}/cursos:
 *   get:
 *     summary: Listar cursos de um professor
 *     description: Recupera todos os cursos ministrados por um professor.
 *     tags: [Professores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do professor
 *       - in: query
 *         name: semestre
 *         schema:
 *           type: string
 *         description: Filtrar por semestre (ex. 2023.1)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, concluido, planejado]
 *         description: Filtrar por status do curso
 *     responses:
 *       200:
 *         description: Lista de cursos do professor
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
 *                     cursos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Curso'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/cursos', professorController.getCursosProfessor);

/**
 * @swagger
 * /professores/{id}/disponibilidade:
 *   get:
 *     summary: Obter disponibilidade de um professor
 *     description: Recupera os horários de disponibilidade de um professor.
 *     tags: [Professores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do professor
 *     responses:
 *       200:
 *         description: Disponibilidade do professor
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
 *                     disponibilidade:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           diaSemana:
 *                             type: string
 *                             enum: [segunda, terca, quarta, quinta, sexta, sabado]
 *                           horarioInicio:
 *                             type: string
 *                             format: time
 *                           horarioFim:
 *                             type: string
 *                             format: time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   put:
 *     summary: Atualizar disponibilidade de um professor
 *     description: Atualiza os horários de disponibilidade de um professor. Admin e o próprio professor podem editar.
 *     tags: [Professores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do professor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               disponibilidade:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - diaSemana
 *                     - horarioInicio
 *                     - horarioFim
 *                   properties:
 *                     diaSemana:
 *                       type: string
 *                       enum: [segunda, terca, quarta, quinta, sexta, sabado]
 *                     horarioInicio:
 *                       type: string
 *                       format: time
 *                       description: Formato HH:MM (24h)
 *                     horarioFim:
 *                       type: string
 *                       format: time
 *                       description: Formato HH:MM (24h)
 *     responses:
 *       200:
 *         description: Disponibilidade atualizada com sucesso
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
 *                     disponibilidade:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           diaSemana:
 *                             type: string
 *                           horarioInicio:
 *                             type: string
 *                           horarioFim:
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
router.get('/:id/disponibilidade', professorController.getDisponibilidade);
router.put('/:id/disponibilidade', professorController.atualizarDisponibilidade);

module.exports = router;
