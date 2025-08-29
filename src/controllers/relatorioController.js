const Relatorio = require('../models/Relatorio');
const Curso = require('../models/Curso');
const Aluno = require('../models/Aluno');
const Professor = require('../models/Professor');
const mongoose = require('mongoose');

/**
 * Obter todos os relatórios
 * @route GET /api/relatorios
 * @access Privado (admin, professor)
 */
exports.getRelatorios = async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo, dataInicio, dataFim } = req.query;
    
    // Construir o filtro de busca
    const filtro = {};
    
    // Filtrar por tipo
    if (tipo) {
      filtro.tipo = tipo;
    }
    
    // Filtrar por período de geração
    if (dataInicio || dataFim) {
      filtro.dataGeracao = {};
      if (dataInicio) {
        filtro.dataGeracao.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        filtro.dataGeracao.$lte = new Date(dataFim);
      }
    }

    // Filtrar por permissão de acesso
    if (req.usuario.role !== 'admin') {
      filtro.$or = [
        { 'acessivelPara.tipo': 'role', 'acessivelPara.valor': req.usuario.role },
        { 'acessivelPara.tipo': 'usuario', 'acessivelPara.valor': req.usuario.id },
        { criadoPor: req.usuario.id }
      ];
    }

    // Contar total de documentos com o filtro aplicado
    const total = await Relatorio.countDocuments(filtro);

    // Buscar relatórios com paginação
    const relatorios = await Relatorio.find(filtro)
      .populate('criadoPor', 'nome email role')
      .populate('entidadesRelacionadas.cursos', 'nome')
      .populate({
        path: 'entidadesRelacionadas.alunos',
        select: 'usuario matricula',
        populate: {
          path: 'usuario',
          select: 'nome'
        }
      })
      .populate({
        path: 'entidadesRelacionadas.professores',
        select: 'usuario especialidade',
        populate: {
          path: 'usuario',
          select: 'nome'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ criadoEm: -1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: relatorios.length,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      data: {
        relatorios
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
 * Obter um relatório pelo ID
 * @route GET /api/relatorios/:id
 * @access Privado (baseado nas permissões do relatório)
 */
exports.getRelatorio = async (req, res) => {
  try {
    const { id } = req.params;

    const relatorio = await Relatorio.findById(id)
      .populate('criadoPor', 'nome email role')
      .populate('entidadesRelacionadas.cursos', 'nome descricao')
      .populate({
        path: 'entidadesRelacionadas.alunos',
        select: 'usuario matricula',
        populate: {
          path: 'usuario',
          select: 'nome email'
        }
      })
      .populate({
        path: 'entidadesRelacionadas.professores',
        select: 'usuario especialidade',
        populate: {
          path: 'usuario',
          select: 'nome email'
        }
      });

    // Verificar se o relatório existe
    if (!relatorio) {
      return res.status(404).json({
        status: 'erro',
        message: 'Relatório não encontrado'
      });
    }

    // Verificar permissões de acesso
    if (req.usuario.role !== 'admin' && relatorio.criadoPor.id !== req.usuario.id) {
      const temAcesso = relatorio.acessivelPara.some(acesso => {
        return (
          (acesso.tipo === 'role' && acesso.valor === req.usuario.role) ||
          (acesso.tipo === 'usuario' && acesso.valor === req.usuario.id)
        );
      });

      if (!temAcesso) {
        return res.status(403).json({
          status: 'erro',
          message: 'Você não tem permissão para acessar este relatório'
        });
      }
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        relatorio
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
 * Criar um novo relatório
 * @route POST /api/relatorios
 * @access Privado (admin, professor)
 */
exports.criarRelatorio = async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      tipo,
      parametros,
      formato,
      periodoInicio,
      periodoFim,
      entidadesRelacionadas,
      acessivelPara
    } = req.body;

    // Verificar entidades relacionadas (se informadas)
    if (entidadesRelacionadas) {
      // Verificar cursos
      if (entidadesRelacionadas.cursos && entidadesRelacionadas.cursos.length > 0) {
        const cursosCount = await Curso.countDocuments({
          _id: { $in: entidadesRelacionadas.cursos }
        });

        if (cursosCount !== entidadesRelacionadas.cursos.length) {
          return res.status(400).json({
            status: 'erro',
            message: 'Um ou mais cursos não existem'
          });
        }
      }

      // Verificar alunos
      if (entidadesRelacionadas.alunos && entidadesRelacionadas.alunos.length > 0) {
        const alunosCount = await Aluno.countDocuments({
          _id: { $in: entidadesRelacionadas.alunos }
        });

        if (alunosCount !== entidadesRelacionadas.alunos.length) {
          return res.status(400).json({
            status: 'erro',
            message: 'Um ou mais alunos não existem'
          });
        }
      }

      // Verificar professores
      if (entidadesRelacionadas.professores && entidadesRelacionadas.professores.length > 0) {
        const professoresCount = await Professor.countDocuments({
          _id: { $in: entidadesRelacionadas.professores }
        });

        if (professoresCount !== entidadesRelacionadas.professores.length) {
          return res.status(400).json({
            status: 'erro',
            message: 'Um ou mais professores não existem'
          });
        }
      }
    }

    // Gerar dados do relatório (simplificado)
    // Na implementação real, isso seria um processo assíncrono mais complexo
    // que geraria os dados baseados nos parâmetros
    const dadosRelatorio = await gerarDadosRelatorio(tipo, parametros, entidadesRelacionadas);

    // Criar o relatório
    const novoRelatorio = await Relatorio.create({
      titulo,
      descricao,
      tipo,
      parametros,
      dados: dadosRelatorio,
      formato: formato || 'json',
      periodoInicio: periodoInicio ? new Date(periodoInicio) : undefined,
      periodoFim: periodoFim ? new Date(periodoFim) : undefined,
      entidadesRelacionadas,
      criadoPor: req.usuario.id,
      acessivelPara: acessivelPara || [{ tipo: 'role', valor: 'admin' }],
      status: 'concluido'
    });

    res.status(201).json({
      status: 'sucesso',
      data: {
        relatorio: novoRelatorio
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
 * Atualizar um relatório
 * @route PUT /api/relatorios/:id
 * @access Privado (admin, criador do relatório)
 */
exports.atualizarRelatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      acessivelPara
    } = req.body;

    // Buscar o relatório
    const relatorio = await Relatorio.findById(id);
    
    if (!relatorio) {
      return res.status(404).json({
        status: 'erro',
        message: 'Relatório não encontrado'
      });
    }

    // Verificar permissões (apenas admin ou criador pode editar)
    if (req.usuario.role !== 'admin' && relatorio.criadoPor.toString() !== req.usuario.id) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para editar este relatório'
      });
    }

    // Atualizar dados do relatório
    // Nota: Apenas propriedades meta podem ser atualizadas, não os dados do relatório
    if (titulo) relatorio.titulo = titulo;
    if (descricao !== undefined) relatorio.descricao = descricao;
    if (acessivelPara) relatorio.acessivelPara = acessivelPara;

    await relatorio.save();

    res.status(200).json({
      status: 'sucesso',
      data: {
        relatorio
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
 * Remover um relatório
 * @route DELETE /api/relatorios/:id
 * @access Privado (admin, criador do relatório)
 */
exports.removerRelatorio = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o relatório
    const relatorio = await Relatorio.findById(id);
    
    if (!relatorio) {
      return res.status(404).json({
        status: 'erro',
        message: 'Relatório não encontrado'
      });
    }

    // Verificar permissões (apenas admin ou criador pode remover)
    if (req.usuario.role !== 'admin' && relatorio.criadoPor.toString() !== req.usuario.id) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para remover este relatório'
      });
    }

    // Remover o relatório
    await Relatorio.findByIdAndDelete(id);

    res.status(200).json({
      status: 'sucesso',
      message: 'Relatório removido com sucesso'
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Função auxiliar para gerar dados do relatório
 * Na implementação real, essa seria uma função mais complexa
 * que geraria os dados baseados nos parâmetros e tipo do relatório
 */
async function gerarDadosRelatorio(tipo, parametros, entidadesRelacionadas) {
  // Implementação simplificada
  // Na versão completa, isso usaria serviços específicos para cada tipo de relatório
  
  let dados = {
    geradoEm: new Date(),
    resultados: []
  };

  switch (tipo) {
    case 'desempenho':
      // Simulação de relatório de desempenho
      if (entidadesRelacionadas.cursos && entidadesRelacionadas.cursos.length > 0) {
        for (const cursoId of entidadesRelacionadas.cursos) {
          const curso = await Curso.findById(cursoId)
            .select('nome alunosMatriculados')
            .populate({
              path: 'alunosMatriculados.aluno',
              select: 'usuario',
              populate: {
                path: 'usuario',
                select: 'nome'
              }
            });

          if (curso) {
            dados.resultados.push({
              curso: {
                id: curso._id,
                nome: curso.nome
              },
              dadosDesempenho: {
                totalAlunos: curso.alunosMatriculados.length,
                mediaGeral: (Math.random() * 10).toFixed(2),
                alunosPorFaixa: {
                  excelente: Math.floor(Math.random() * 10),
                  bom: Math.floor(Math.random() * 15),
                  regular: Math.floor(Math.random() * 10),
                  insuficiente: Math.floor(Math.random() * 5)
                }
              }
            });
          }
        }
      }
      break;
    
    case 'frequencia':
      // Simulação de relatório de frequência
      if (entidadesRelacionadas.cursos && entidadesRelacionadas.cursos.length > 0) {
        for (const cursoId of entidadesRelacionadas.cursos) {
          const curso = await Curso.findById(cursoId)
            .select('nome alunosMatriculados');

          if (curso) {
            dados.resultados.push({
              curso: {
                id: curso._id,
                nome: curso.nome
              },
              dadosFrequencia: {
                totalAulas: Math.floor(Math.random() * 30) + 10,
                mediaPresenca: (Math.random() * 100).toFixed(2) + '%',
                alunosPorFaixa: {
                  otima: Math.floor(Math.random() * 10),
                  boa: Math.floor(Math.random() * 15),
                  regular: Math.floor(Math.random() * 10),
                  baixa: Math.floor(Math.random() * 5)
                }
              }
            });
          }
        }
      }
      break;
    
    case 'financeiro':
      // Simulação de relatório financeiro
      dados.resultados = {
        periodo: {
          inicio: parametros?.periodoInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          fim: parametros?.periodoFim || new Date()
        },
        dadosFinanceiros: {
          receitaTotal: (Math.random() * 50000 + 10000).toFixed(2),
          despesasTotal: (Math.random() * 30000 + 5000).toFixed(2),
          saldo: (Math.random() * 20000 + 5000).toFixed(2),
          categoriasReceita: {
            matriculas: (Math.random() * 40000 + 5000).toFixed(2),
            mensalidades: (Math.random() * 10000 + 5000).toFixed(2)
          },
          categoriasDespesa: {
            pessoal: (Math.random() * 20000 + 3000).toFixed(2),
            operacional: (Math.random() * 10000 + 2000).toFixed(2)
          }
        }
      };
      break;
    
    case 'administrativo':
      // Simulação de relatório administrativo
      dados.resultados = {
        estatisticas: {
          totalAlunos: Math.floor(Math.random() * 500) + 100,
          totalProfessores: Math.floor(Math.random() * 50) + 10,
          totalCursos: Math.floor(Math.random() * 30) + 5,
          cursosAtivos: Math.floor(Math.random() * 20) + 3,
          alunosAtivos: Math.floor(Math.random() * 400) + 80
        },
        tendencias: {
          crescimentoAlunos: (Math.random() * 20 - 10).toFixed(2) + '%',
          retencao: (Math.random() * 30 + 70).toFixed(2) + '%',
          satisfacao: (Math.random() * 2 + 3).toFixed(2) + '/5'
        }
      };
      break;
    
    default:
      // Relatório personalizado ou tipo não reconhecido
      dados.resultados = {
        mensagem: 'Dados personalizados do relatório estariam aqui.'
      };
      break;
  }

  return dados;
}
