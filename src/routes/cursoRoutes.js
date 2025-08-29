/**
 * @swagger
 * tags:
 *  name: Cursos
 *  description: Gerenciamento de cursos e matrículas
 */

const express = require('express');
const cursoController = require('../controllers/cursoController');
const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de cursos são protegidas
router.use(protegerRota);

/**
 * @swagger
 * /cursos:
 *   get:
 *     summary: Listar todos os cursos
 *     description: Recupera a lista de todos os cursos disponíveis. Acessível para todos os usuários autenticados.
 *     tags: [Cursos]
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
 *         description: Termo de busca para filtrar cursos
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria do curso
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
 *       - in: query
 *         name: professor
 *         schema:
 *           type: string
 *         description: ID do professor para filtrar cursos
 *     responses:
 *       200:
 *         description: Lista de cursos
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
 *                   description: Total de cursos encontrados
 *                 data:
 *                   type: object
 *                   properties:
 *                     cursos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Curso'
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
 *     summary: Criar um novo curso
 *     description: Cria um novo registro de curso. Acessível apenas para administradores.
 *     tags: [Cursos]
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
 *               - codigo
 *               - professorId
 *               - cargaHoraria
 *               - semestre
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do curso
 *               codigo:
 *                 type: string
 *                 description: Código único do curso
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada do curso
 *               professorId:
 *                 type: string
 *                 description: ID do professor responsável pelo curso
 *               cargaHoraria:
 *                 type: integer
 *                 description: Carga horária total do curso em horas
 *               semestre:
 *                 type: string
 *                 description: Semestre em que o curso será ministrado (ex. 2023.1)
 *               vagas:
 *                 type: integer
 *                 description: Número total de vagas disponíveis
 *               categoria:
 *                 type: string
 *                 description: Categoria do curso
 *               status:
 *                 type: string
 *                 enum: [ativo, concluido, planejado]
 *                 default: planejado
 *                 description: Status atual do curso
 *               dataInicio:
 *                 type: string
 *                 format: date
 *                 description: Data de início das aulas
 *               dataFim:
 *                 type: string
 *                 format: date
 *                 description: Data de término das aulas
 *               horarios:
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
 *         description: Curso criado com sucesso
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
 *                     curso:
 *                       $ref: '#/components/schemas/Curso'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Curso já existe com este código
 */
// Rotas para listagem e criação de cursos
router
  .route('/')
  .get(cursoController.getCursos) // Todos usuários autenticados podem ver cursos
  .post(restringirPara('admin'), cursoController.criarCurso); // Apenas admin pode criar

/**
 * @swagger
 * /cursos/{id}:
 *   get:
 *     summary: Obter detalhes de um curso
 *     description: Recupera informações detalhadas de um curso específico.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *     responses:
 *       200:
 *         description: Detalhes do curso
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
 *                     curso:
 *                       $ref: '#/components/schemas/Curso'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   put:
 *     summary: Atualizar um curso
 *     description: Atualiza informações de um curso existente. Admin e professor responsável podem editar.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do curso
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada do curso
 *               professorId:
 *                 type: string
 *                 description: ID do professor responsável pelo curso
 *               cargaHoraria:
 *                 type: integer
 *                 description: Carga horária total do curso em horas
 *               vagas:
 *                 type: integer
 *                 description: Número total de vagas disponíveis
 *               categoria:
 *                 type: string
 *                 description: Categoria do curso
 *               status:
 *                 type: string
 *                 enum: [ativo, concluido, planejado]
 *                 description: Status atual do curso
 *               dataInicio:
 *                 type: string
 *                 format: date
 *                 description: Data de início das aulas
 *               dataFim:
 *                 type: string
 *                 format: date
 *                 description: Data de término das aulas
 *               horarios:
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
 *       200:
 *         description: Curso atualizado com sucesso
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
 *                     curso:
 *                       $ref: '#/components/schemas/Curso'
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
 *     summary: Remover um curso
 *     description: Desativa (soft delete) um curso existente. Acessível apenas para administradores.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *     responses:
 *       204:
 *         description: Curso removido com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para operações com um curso específico
router
  .route('/:id')
  .get(cursoController.getCurso)
  .put(cursoController.atualizarCurso) // Admin e professor responsável podem editar
  .delete(restringirPara('admin'), cursoController.removerCurso); // Apenas admin pode remover

/**
 * @swagger
 * /cursos/{id}/matricular:
 *   post:
 *     summary: Matricular aluno em um curso
 *     description: Realiza a matrícula de um aluno no curso especificado. Admin pode matricular qualquer aluno, enquanto alunos só podem se matricular a si mesmos.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alunoId
 *             properties:
 *               alunoId:
 *                 type: string
 *                 description: ID do aluno a ser matriculado
 *     responses:
 *       200:
 *         description: Matrícula realizada com sucesso
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
 *                     matricula:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         aluno:
 *                           $ref: '#/components/schemas/Aluno'
 *                         curso:
 *                           $ref: '#/components/schemas/Curso'
 *                         dataMatricula:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Dados inválidos ou aluno já matriculado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Não há vagas disponíveis
 */
router.post('/:id/matricular', cursoController.matricularAluno);

/**
 * @swagger
 * /cursos/{id}/cancelar-matricula:
 *   post:
 *     summary: Cancelar matrícula de um aluno
 *     description: Cancela a matrícula de um aluno no curso especificado. Admin pode cancelar qualquer matrícula, alunos só podem cancelar suas próprias matrículas.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alunoId
 *             properties:
 *               alunoId:
 *                 type: string
 *                 description: ID do aluno
 *               motivo:
 *                 type: string
 *                 description: Motivo do cancelamento da matrícula
 *     responses:
 *       200:
 *         description: Matrícula cancelada com sucesso
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
 *                   example: Matrícula cancelada com sucesso
 *       400:
 *         description: Dados inválidos ou aluno não está matriculado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/cancelar-matricula', cursoController.cancelarMatricula);

/**
 * @swagger
 * /cursos/{id}/alunos:
 *   get:
 *     summary: Listar alunos matriculados em um curso
 *     description: Recupera a lista de todos os alunos matriculados em um curso específico. Acessível apenas para administradores e professores.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do curso
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo, trancado]
 *         description: Filtrar por status da matrícula
 *     responses:
 *       200:
 *         description: Lista de alunos matriculados
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
 *                   description: Total de alunos matriculados
 *                 data:
 *                   type: object
 *                   properties:
 *                     alunos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           aluno:
 *                             $ref: '#/components/schemas/Aluno'
 *                           dataMatricula:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [ativo, inativo, trancado]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rota para listar alunos matriculados
router.get('/:id/alunos', restringirPara('admin', 'professor'), cursoController.getAlunosMatriculados);

module.exports = router;
