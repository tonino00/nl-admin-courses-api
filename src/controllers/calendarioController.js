const CalendarioAcademico = require('../models/CalendarioAcademico');
const Curso = require('../models/Curso');

/**
 * Obter todos os eventos do calendário
 * @route GET /api/calendario
 * @access Privado (todos usuários autenticados)
 */
exports.getEventos = async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo, cursoId } = req.query;
    
    // Construir o filtro de busca
    const filtro = {};
    
    // Filtrar por período
    if (dataInicio || dataFim) {
      filtro.$or = [];
      
      if (dataInicio && dataFim) {
        // Eventos que começam ou terminam dentro do período
        filtro.$or.push({
          dataInicio: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
        });
        filtro.$or.push({
          dataFim: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
        });
        // Eventos que englobam todo o período
        filtro.$or.push({
          dataInicio: { $lte: new Date(dataInicio) },
          dataFim: { $gte: new Date(dataFim) }
        });
      } else if (dataInicio) {
        filtro.dataFim = { $gte: new Date(dataInicio) };
      } else if (dataFim) {
        filtro.dataInicio = { $lte: new Date(dataFim) };
      }
    }
    
    // Filtrar por tipo
    if (tipo) {
      filtro.tipo = tipo;
    }
    
    // Filtrar por curso
    if (cursoId) {
      filtro.cursosRelacionados = cursoId;
    }

    // Buscar eventos
    const eventos = await CalendarioAcademico.find(filtro)
      .populate('cursosRelacionados', 'nome')
      .populate('criadoPor', 'nome role')
      .sort({ dataInicio: 1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: eventos.length,
      data: {
        eventos
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
 * Obter um evento pelo ID
 * @route GET /api/calendario/:id
 * @access Privado (todos usuários autenticados)
 */
exports.getEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const evento = await CalendarioAcademico.findById(id)
      .populate('cursosRelacionados', 'nome descricao')
      .populate('criadoPor', 'nome email role');

    // Verificar se o evento existe
    if (!evento) {
      return res.status(404).json({
        status: 'erro',
        message: 'Evento não encontrado'
      });
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        evento
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
 * Criar um novo evento
 * @route POST /api/calendario
 * @access Privado (admin, professor)
 */
exports.criarEvento = async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      dataInicio,
      dataFim,
      tipo,
      cursosRelacionados,
      cor,
      diaInteiro,
      recorrente,
      padraoRecorrencia
    } = req.body;

    // Verificar se os cursos existem (se informados)
    if (cursosRelacionados && cursosRelacionados.length > 0) {
      const cursosCount = await Curso.countDocuments({
        _id: { $in: cursosRelacionados }
      });

      if (cursosCount !== cursosRelacionados.length) {
        return res.status(400).json({
          status: 'erro',
          message: 'Um ou mais cursos não existem'
        });
      }
    }

    // Criar o evento
    const novoEvento = await CalendarioAcademico.create({
      titulo,
      descricao,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      tipo,
      cursosRelacionados,
      cor,
      diaInteiro,
      recorrente,
      padraoRecorrencia,
      criadoPor: req.usuario.id
    });

    res.status(201).json({
      status: 'sucesso',
      data: {
        evento: novoEvento
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
 * Atualizar um evento
 * @route PUT /api/calendario/:id
 * @access Privado (admin, professor criador)
 */
exports.atualizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      dataInicio,
      dataFim,
      tipo,
      cursosRelacionados,
      cor,
      diaInteiro,
      recorrente,
      padraoRecorrencia
    } = req.body;

    // Buscar o evento
    const evento = await CalendarioAcademico.findById(id);
    
    if (!evento) {
      return res.status(404).json({
        status: 'erro',
        message: 'Evento não encontrado'
      });
    }

    // Verificar permissões (admin pode editar qualquer evento, professor só os que criou)
    if (req.usuario.role === 'professor' && 
        (!evento.criadoPor || evento.criadoPor.toString() !== req.usuario.id)) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para editar este evento'
      });
    }

    // Verificar se os cursos existem (se informados)
    if (cursosRelacionados && cursosRelacionados.length > 0) {
      const cursosCount = await Curso.countDocuments({
        _id: { $in: cursosRelacionados }
      });

      if (cursosCount !== cursosRelacionados.length) {
        return res.status(400).json({
          status: 'erro',
          message: 'Um ou mais cursos não existem'
        });
      }
    }

    // Atualizar dados do evento
    if (titulo) evento.titulo = titulo;
    if (descricao !== undefined) evento.descricao = descricao;
    if (dataInicio) evento.dataInicio = new Date(dataInicio);
    if (dataFim) evento.dataFim = new Date(dataFim);
    if (tipo) evento.tipo = tipo;
    if (cursosRelacionados) evento.cursosRelacionados = cursosRelacionados;
    if (cor) evento.cor = cor;
    if (diaInteiro !== undefined) evento.diaInteiro = diaInteiro;
    if (recorrente !== undefined) evento.recorrente = recorrente;
    if (padraoRecorrencia) evento.padraoRecorrencia = padraoRecorrencia;

    await evento.save();

    res.status(200).json({
      status: 'sucesso',
      data: {
        evento
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
 * Remover um evento
 * @route DELETE /api/calendario/:id
 * @access Privado (admin, professor criador)
 */
exports.removerEvento = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o evento
    const evento = await CalendarioAcademico.findById(id);
    
    if (!evento) {
      return res.status(404).json({
        status: 'erro',
        message: 'Evento não encontrado'
      });
    }

    // Verificar permissões (admin pode remover qualquer evento, professor só os que criou)
    if (req.usuario.role === 'professor' && 
        (!evento.criadoPor || evento.criadoPor.toString() !== req.usuario.id)) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para remover este evento'
      });
    }

    // Remover o evento
    await CalendarioAcademico.findByIdAndDelete(id);

    res.status(200).json({
      status: 'sucesso',
      message: 'Evento removido com sucesso'
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Obter eventos de um curso específico
 * @route GET /api/calendario/curso/:cursoId
 * @access Privado (todos usuários autenticados)
 */
exports.getEventosCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { dataInicio, dataFim } = req.query;

    // Verificar se o curso existe
    const cursoExiste = await Curso.exists({ _id: cursoId });
    if (!cursoExiste) {
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    // Construir o filtro de busca
    const filtro = {
      cursosRelacionados: cursoId
    };
    
    // Filtrar por período
    if (dataInicio || dataFim) {
      filtro.$or = [];
      
      if (dataInicio && dataFim) {
        // Eventos que começam ou terminam dentro do período
        filtro.$or.push({
          dataInicio: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
        });
        filtro.$or.push({
          dataFim: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
        });
        // Eventos que englobam todo o período
        filtro.$or.push({
          dataInicio: { $lte: new Date(dataInicio) },
          dataFim: { $gte: new Date(dataFim) }
        });
      } else if (dataInicio) {
        filtro.dataFim = { $gte: new Date(dataInicio) };
      } else if (dataFim) {
        filtro.dataInicio = { $lte: new Date(dataFim) };
      }
    }

    // Buscar eventos
    const eventos = await CalendarioAcademico.find(filtro)
      .populate('criadoPor', 'nome role')
      .sort({ dataInicio: 1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: eventos.length,
      data: {
        eventos
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};
