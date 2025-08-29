/**
 * @swagger
 * tags:
 *  name: Relatórios
 *  description: Gerenciamento de relatórios acadêmicos
 */

const express = require('express');
const relatorioController = require('../controllers/relatorioController');
const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de relatórios são protegidas
router.use(protegerRota);

/**
 * @swagger
 * /relatorios:
 *   get:
 *     summary: Listar todos os relatórios
 *     description: Recupera a lista de relatórios disponíveis. Acessível apenas para administradores e professores.
 *     tags: [Relatórios]
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
 *         description: Campo para ordenação (ex. dataCriacao,-titulo)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [desempenho, frequencia, atividades, notas, curso]
 *         description: Filtrar por tipo de relatório
 *       - in: query
 *         name: autor
 *         schema:
 *           type: string
 *         description: ID do autor do relatório
 *       - in: query
 *         name: cursoId
 *         schema:
 *           type: string
 *         description: ID do curso associado ao relatório
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca para filtrar relatórios
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtrar relatórios
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtrar relatórios
 *     responses:
 *       200:
 *         description: Lista de relatórios
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
 *                   description: Total de relatórios encontrados
 *                 data:
 *                   type: object
 *                   properties:
 *                     relatorios:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Relatorio'
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
 *     summary: Criar um novo relatório
 *     description: Cria um novo relatório acadêmico. Acessível apenas para administradores e professores.
 *     tags: [Relatórios]
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
 *               - tipo
 *               - conteudo
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título do relatório
 *               descricao:
 *                 type: string
 *                 description: Descrição resumida do relatório
 *               tipo:
 *                 type: string
 *                 enum: [desempenho, frequencia, atividades, notas, curso]
 *                 description: Tipo do relatório
 *               conteudo:
 *                 type: object
 *                 description: Conteúdo do relatório, varia conforme o tipo
 *               filtros:
 *                 type: object
 *                 description: Filtros aplicados para gerar o relatório
 *               cursoId:
 *                 type: string
 *                 description: ID do curso associado (se aplicável)
 *               alunoId:
 *                 type: string
 *                 description: ID do aluno associado (se aplicável)
 *               periodo:
 *                 type: object
 *                 properties:
 *                   inicio:
 *                     type: string
 *                     format: date
 *                     description: Data inicial do período do relatório
 *                   fim:
 *                     type: string
 *                     format: date
 *                     description: Data final do período do relatório
 *               formato:
 *                 type: string
 *                 enum: [json, pdf, csv, xlsx]
 *                 default: json
 *                 description: Formato de saída do relatório
 *               publico:
 *                 type: boolean
 *                 default: false
 *                 description: Se o relatório é público (visível para alunos)
 *     responses:
 *       201:
 *         description: Relatório criado com sucesso
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
 *                     relatorio:
 *                       $ref: '#/components/schemas/Relatorio'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Rotas para listagem e criação de relatórios
router
  .route('/')
  .get(restringirPara('admin', 'professor'), relatorioController.getRelatorios)
  .post(restringirPara('admin', 'professor'), relatorioController.criarRelatorio);

/**
 * @swagger
 * /relatorios/{id}:
 *   get:
 *     summary: Obter detalhes de um relatório
 *     description: Recupera informações detalhadas de um relatório específico. Acesso baseado nas permissões do relatório.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do relatório
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, pdf, csv, xlsx]
 *           default: json
 *         description: Formato de saída desejado para o relatório
 *     responses:
 *       200:
 *         description: Detalhes do relatório
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
 *                     relatorio:
 *                       $ref: '#/components/schemas/Relatorio'
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Relatório em formato PDF
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Relatório em formato CSV
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Relatório em formato Excel
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 *   put:
 *     summary: Atualizar um relatório
 *     description: Atualiza informações de um relatório existente. Admin e criador do relatório podem editar.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do relatório
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título do relatório
 *               descricao:
 *                 type: string
 *                 description: Descrição resumida do relatório
 *               conteudo:
 *                 type: object
 *                 description: Conteúdo do relatório
 *               filtros:
 *                 type: object
 *                 description: Filtros aplicados para gerar o relatório
 *               periodo:
 *                 type: object
 *                 properties:
 *                   inicio:
 *                     type: string
 *                     format: date
 *                     description: Data inicial do período do relatório
 *                   fim:
 *                     type: string
 *                     format: date
 *                     description: Data final do período do relatório
 *               publico:
 *                 type: boolean
 *                 description: Se o relatório é público (visível para alunos)
 *     responses:
 *       200:
 *         description: Relatório atualizado com sucesso
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
 *                     relatorio:
 *                       $ref: '#/components/schemas/Relatorio'
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
 *     summary: Remover um relatório
 *     description: Remove um relatório existente. Admin e criador podem remover.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do relatório
 *     responses:
 *       204:
 *         description: Relatório removido com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rotas para operações com um relatório específico
router
  .route('/:id')
  .get(relatorioController.getRelatorio) // Acesso baseado nas permissões do relatório
  .put(relatorioController.atualizarRelatorio) // Admin e criador podem editar
  .delete(relatorioController.removerRelatorio); // Admin e criador podem remover

module.exports = router;
