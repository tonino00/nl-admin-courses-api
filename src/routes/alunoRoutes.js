/**
 * @swagger
 * tags:
 *  name: Alunos
 *  description: Gerenciamento de alunos
 */

const express = require('express');
const alunoController = require('../controllers/alunoController');
const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de alunos são protegidas
router.use(protegerRota);

/**
 * @swagger
 * /alunos:
 *   get:
 *     summary: Listar todos os alunos
 *     description: Recupera a lista de todos os alunos. Acessível apenas para administradores e professores.
 *     tags: [Alunos]
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
 *         description: Termo de busca para filtrar alunos
 *     responses:
 *       200:
 *         description: Lista de alunos
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
 *                   description: Total de alunos encontrados
 *                 data:
 *                   type: object
 *                   properties:
 *                     alunos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Aluno'
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
 *     summary: Criar um novo aluno
 *     description: Cria um novo registro de aluno. Acessível apenas para administradores.
 *     tags: [Alunos]
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
 *               - matricula
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do aluno
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do aluno
 *               matricula:
 *                 type: string
 *                 description: Número de matrícula único
 *               telefone:
 *                 type: string
 *                 description: Número de telefone do aluno
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento do aluno
 *               endereco:
 *                 type: object
 *                 properties:
 *                   rua:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   complemento:
 *                     type: string
 *                   bairro:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   cep:
 *                     type: string
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso
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
 *                     aluno:
 *                       $ref: '#/components/schemas/Aluno'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Aluno já existe com este email ou matrícula
 */
// Rotas para listagem e criação de alunos
router
  .route('/')
  .get(restringirPara('admin', 'professor'), alunoController.getAlunos)
  .post(restringirPara('admin'), alunoController.criarAluno);

/**
 * @swagger
 * /alunos/{id}:
 *   get:
 *     summary: Obter detalhes de um aluno
 *     description: Recupera informações detalhadas de um aluno específico. Alunos podem ver apenas seus próprios detalhes, enquanto professores e administradores podem ver qualquer aluno.
 *     tags: [Alunos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do aluno
 *     responses:
 *       200:
 *         description: Detalhes do aluno
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
 *                     aluno:
 *                       $ref: '#/components/schemas/Aluno'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   put:
 *     summary: Atualizar um aluno
 *     description: Atualiza informações de um aluno existente. Acessível apenas para administradores.
 *     tags: [Alunos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do aluno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do aluno
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do aluno
 *               telefone:
 *                 type: string
 *                 description: Número de telefone do aluno
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento do aluno
 *               endereco:
 *                 type: object
 *                 properties:
 *                   rua:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   complemento:
 *                     type: string
 *                   bairro:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   cep:
 *                     type: string
 *     responses:
 *       200:
 *         description: Aluno atualizado com sucesso
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
 *                     aluno:
 *                       $ref: '#/components/schemas/Aluno'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Email já em uso por outro aluno
 *
 *   delete:
 *     summary: Desativar um aluno
 *     description: Desativa (soft delete) um aluno existente. Acessível apenas para administradores.
 *     tags: [Alunos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do aluno
 *     responses:
 *       204:
 *         description: Aluno desativado com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para operações com um aluno específico
router
  .route('/:id')
  .get(alunoController.getAluno)
  .put(restringirPara('admin'), alunoController.atualizarAluno)
  .delete(restringirPara('admin'), alunoController.removerAluno);

/**
 * @swagger
 * /alunos/{id}/cursos:
 *   get:
 *     summary: Listar cursos de um aluno
 *     description: Recupera todos os cursos em que um aluno está matriculado.
 *     tags: [Alunos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do aluno
 *     responses:
 *       200:
 *         description: Lista de cursos do aluno
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/cursos', alunoController.getCursosAluno);

/**
 * @swagger
 * /alunos/{id}/notas:
 *   get:
 *     summary: Listar notas de um aluno
 *     description: Recupera todas as notas de um aluno em todos os cursos.
 *     tags: [Alunos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do aluno
 *       - in: query
 *         name: curso
 *         schema:
 *           type: string
 *         description: ID do curso para filtrar notas
 *     responses:
 *       200:
 *         description: Notas do aluno
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
 *                     notas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           curso:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               nome:
 *                                 type: string
 *                           avaliacoes:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 titulo:
 *                                   type: string
 *                                 tipo:
 *                                   type: string
 *                                 valor:
 *                                   type: number
 *                                 peso:
 *                                   type: number
 *                                 data:
 *                                   type: string
 *                                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/notas', alunoController.getNotasAluno);

/**
 * @swagger
 * /alunos/{id}/frequencia:
 *   get:
 *     summary: Obter frequência de um aluno
 *     description: Recupera os registros de frequência de um aluno em todos os cursos ou em um curso específico.
 *     tags: [Alunos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do aluno
 *       - in: query
 *         name: curso
 *         schema:
 *           type: string
 *         description: ID do curso para filtrar frequência
 *       - in: query
 *         name: inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtrar frequência
 *       - in: query
 *         name: fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtrar frequência
 *     responses:
 *       200:
 *         description: Frequência do aluno
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
 *                     frequencia:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           curso:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               nome:
 *                                 type: string
 *                           aulas:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 data:
 *                                   type: string
 *                                   format: date
 *                                 presente:
 *                                   type: boolean
 *                                 justificativa:
 *                                   type: string
 *                           estatisticas:
 *                             type: object
 *                             properties:
 *                               totalAulas:
 *                                 type: integer
 *                               presencas:
 *                                 type: integer
 *                               faltas:
 *                                 type: integer
 *                               percentualPresenca:
 *                                 type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/frequencia', alunoController.getFrequenciaAluno);

module.exports = router;
