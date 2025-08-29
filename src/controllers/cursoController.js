const Curso = require('../models/Curso');
const Aluno = require('../models/Aluno');
const Professor = require('../models/Professor');
const mongoose = require('mongoose');

/**
 * Obter todos os cursos
 * @route GET /api/cursos
 * @access Privado (todos usuários autenticados)
 */
exports.getCursos = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      nome, 
      status,
      professorId 
    } = req.query;
    
    // Construir o filtro de busca
    const filtro = {};
    
    if (nome) {
      filtro.nome = { $regex: nome, $options: 'i' };
    }
    
    if (status) {
      filtro.status = status;
    }
    
    if (professorId) {
      filtro.professorResponsavel = professorId;
    }

    // Contar total de documentos com o filtro aplicado
    const total = await Curso.countDocuments(filtro);

    // Buscar cursos com paginação
    const cursos = await Curso.find(filtro)
      .populate('professorResponsavel', 'usuario')
      .populate({
        path: 'professorResponsavel',
        populate: {
          path: 'usuario',
          select: 'nome email'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ criadoEm: -1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: cursos.length,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      data: {
        cursos
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
 * Obter um curso pelo ID
 * @route GET /api/cursos/:id
 * @access Privado (todos usuários autenticados)
 */
exports.getCurso = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findById(id)
      .populate('professorResponsavel', 'usuario especialidade')
      .populate({
        path: 'professorResponsavel',
        populate: {
          path: 'usuario',
          select: 'nome email fotoPerfil'
        }
      })
      .populate({
        path: 'alunosMatriculados.aluno',
        select: 'usuario matricula',
        populate: {
          path: 'usuario',
          select: 'nome email'
        }
      });

    // Verificar se o curso existe
    if (!curso) {
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        curso
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
 * Criar um novo curso
 * @route POST /api/cursos
 * @access Privado (admin)
 */
exports.criarCurso = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      professorResponsavel,
      cargaHoraria,
      dataInicio,
      dataFim,
      horarios,
      capacidadeMaxima,
      status,
      categoria,
      nivelDificuldade,
      prerequisitos,
      objetivos,
      ementa
    } = req.body;

    // Verificar se o professor existe
    const professor = await Professor.findById(professorResponsavel);
    if (!professor) {
      return res.status(404).json({
        status: 'erro',
        message: 'Professor responsável não encontrado'
      });
    }

    // Criar o curso
    const novoCurso = await Curso.create({
      nome,
      descricao,
      professorResponsavel,
      cargaHoraria,
      dataInicio,
      dataFim,
      horarios,
      capacidadeMaxima,
      status: status || 'preparacao',
      categoria,
      nivelDificuldade,
      prerequisitos,
      objetivos,
      ementa
    });

    // Adicionar curso à lista de cursos do professor
    if (!professor.cursosMinistrando.includes(novoCurso._id)) {
      professor.cursosMinistrando.push(novoCurso._id);
      await professor.save();
    }

    res.status(201).json({
      status: 'sucesso',
      data: {
        curso: novoCurso
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
 * Atualizar um curso
 * @route PUT /api/cursos/:id
 * @access Privado (admin, professor responsável)
 */
exports.atualizarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      professorResponsavel,
      cargaHoraria,
      dataInicio,
      dataFim,
      horarios,
      status,
      categoria,
      nivelDificuldade,
      prerequisitos,
      objetivos,
      ementa
    } = req.body;

    // Buscar o curso
    const curso = await Curso.findById(id);
    
    if (!curso) {
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    // Verificar permissões (apenas admin ou professor responsável pode editar)
    if (req.usuario.role === 'professor' && 
        curso.professorResponsavel.toString() !== req.usuario.id) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para editar este curso'
      });
    }

    // Se o professor responsável estiver sendo alterado
    if (professorResponsavel && professorResponsavel !== curso.professorResponsavel.toString()) {
      // Verificar se o novo professor existe
      const novoProfessor = await Professor.findById(professorResponsavel);
      if (!novoProfessor) {
        return res.status(404).json({
          status: 'erro',
          message: 'Novo professor responsável não encontrado'
        });
      }

      // Remover curso da lista do professor anterior
      const professorAnterior = await Professor.findById(curso.professorResponsavel);
      if (professorAnterior) {
        professorAnterior.cursosMinistrando = professorAnterior.cursosMinistrando.filter(
          c => c.toString() !== id
        );
        await professorAnterior.save();
      }

      // Adicionar curso à lista do novo professor
      if (!novoProfessor.cursosMinistrando.includes(id)) {
        novoProfessor.cursosMinistrando.push(id);
        await novoProfessor.save();
      }

      curso.professorResponsavel = professorResponsavel;
    }

    // Atualizar dados do curso
    if (nome) curso.nome = nome;
    if (descricao) curso.descricao = descricao;
    if (cargaHoraria) curso.cargaHoraria = cargaHoraria;
    if (dataInicio) curso.dataInicio = dataInicio;
    if (dataFim) curso.dataFim = dataFim;
    if (horarios) curso.horarios = horarios;
    if (status) curso.status = status;
    if (categoria) curso.categoria = categoria;
    if (nivelDificuldade) curso.nivelDificuldade = nivelDificuldade;
    if (prerequisitos) curso.prerequisitos = prerequisitos;
    if (objetivos) curso.objetivos = objetivos;
    if (ementa) curso.ementa = ementa;

    await curso.save();

    // Buscar o curso atualizado
    const cursoAtualizado = await Curso.findById(id)
      .populate('professorResponsavel', 'usuario especialidade')
      .populate({
        path: 'professorResponsavel',
        populate: {
          path: 'usuario',
          select: 'nome email'
        }
      });

    res.status(200).json({
      status: 'sucesso',
      data: {
        curso: cursoAtualizado
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
 * Remover um curso
 * @route DELETE /api/cursos/:id
 * @access Privado (admin)
 */
exports.removerCurso = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Buscar o curso
    const curso = await Curso.findById(id);
    
    if (!curso) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    // Verificar se o curso tem alunos matriculados ativos
    if (curso.alunosMatriculados.length > 0 && curso.status === 'ativo') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Não é possível remover um curso ativo com alunos matriculados'
      });
    }

    // Remover o curso da lista de cursos do professor
    if (curso.professorResponsavel) {
      await Professor.updateOne(
        { _id: curso.professorResponsavel },
        { $pull: { cursosMinistrando: curso._id } },
        { session }
      );
    }

    // Remover o curso da lista de cursos dos alunos
    const alunosIds = curso.alunosMatriculados.map(matricula => matricula.aluno);
    
    await Aluno.updateMany(
      { _id: { $in: alunosIds } },
      { $pull: { cursosMatriculados: { curso: curso._id } } },
      { session }
    );

    // Remover o curso
    await Curso.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'sucesso',
      message: 'Curso removido com sucesso'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Matricular aluno em um curso
 * @route POST /api/cursos/:id/matricular
 * @access Privado (admin, aluno)
 */
exports.matricularAluno = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { alunoId } = req.body;

    // Buscar o curso
    const curso = await Curso.findById(id);
    
    if (!curso) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    // Verificar se o curso está com matrículas abertas
    if (curso.status !== 'matriculasAbertas') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Matrículas não estão abertas para este curso'
      });
    }

    // Verificar se há vagas disponíveis
    if (curso.vagasDisponiveis <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Não há vagas disponíveis'
      });
    }

    // Buscar o aluno (ou usar o próprio usuário se for aluno)
    const alunoIdFinal = alunoId || (req.usuario.role === 'aluno' ? 
      (await Aluno.findOne({ usuario: req.usuario.id }))._id : null);

    if (!alunoIdFinal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'ID do aluno não fornecido'
      });
    }

    const aluno = await Aluno.findById(alunoIdFinal);
    if (!aluno) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar se o aluno já está matriculado
    const jaMatriculado = curso.alunosMatriculados.some(
      matricula => matricula.aluno.toString() === alunoIdFinal.toString()
    );

    if (jaMatriculado) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Aluno já está matriculado neste curso'
      });
    }

    // Adicionar aluno ao curso
    curso.alunosMatriculados.push({
      aluno: alunoIdFinal,
      dataMatricula: Date.now(),
      status: 'ativo'
    });

    await curso.save({ session });

    // Adicionar curso ao aluno
    aluno.cursosMatriculados.push({
      curso: curso._id,
      dataMatricula: Date.now(),
      status: 'ativo'
    });

    await aluno.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'sucesso',
      message: 'Aluno matriculado com sucesso',
      data: {
        vagasDisponiveis: curso.vagasDisponiveis
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Cancelar matrícula de um aluno
 * @route POST /api/cursos/:id/cancelar-matricula
 * @access Privado (admin, aluno próprio)
 */
exports.cancelarMatricula = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { alunoId } = req.body;

    // Buscar o curso
    const curso = await Curso.findById(id);
    
    if (!curso) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    // Buscar o aluno (ou usar o próprio usuário se for aluno)
    const alunoIdFinal = alunoId || (req.usuario.role === 'aluno' ? 
      (await Aluno.findOne({ usuario: req.usuario.id }))._id : null);

    if (!alunoIdFinal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'ID do aluno não fornecido'
      });
    }

    // Verificar permissões (aluno só pode cancelar a própria matrícula)
    if (req.usuario.role === 'aluno') {
      const aluno = await Aluno.findOne({ usuario: req.usuario.id });
      if (aluno._id.toString() !== alunoIdFinal.toString()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          status: 'erro',
          message: 'Você não tem permissão para cancelar matrícula de outro aluno'
        });
      }
    }

    // Verificar se o aluno está matriculado
    const matriculaIndex = curso.alunosMatriculados.findIndex(
      matricula => matricula.aluno.toString() === alunoIdFinal.toString()
    );

    if (matriculaIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Aluno não está matriculado neste curso'
      });
    }

    // Remover aluno do curso
    curso.alunosMatriculados.splice(matriculaIndex, 1);
    await curso.save({ session });

    // Remover curso do aluno
    await Aluno.updateOne(
      { _id: alunoIdFinal },
      { 
        $pull: { cursosMatriculados: { curso: curso._id } }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'sucesso',
      message: 'Matrícula cancelada com sucesso',
      data: {
        vagasDisponiveis: curso.vagasDisponiveis
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Listar alunos matriculados
 * @route GET /api/cursos/:id/alunos
 * @access Privado (admin, professor responsável)
 */
exports.getAlunosMatriculados = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Buscar o curso
    const curso = await Curso.findById(id);
    
    if (!curso) {
      return res.status(404).json({
        status: 'erro',
        message: 'Curso não encontrado'
      });
    }

    // Verificar permissões
    if (req.usuario.role === 'professor' && 
        curso.professorResponsavel.toString() !== req.usuario.id) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar estes dados'
      });
    }

    // Filtrar por status, se solicitado
    let matriculas = curso.alunosMatriculados;
    if (status) {
      matriculas = matriculas.filter(
        matricula => matricula.status === status
      );
    }

    // Obter detalhes dos alunos
    const alunosIds = matriculas.map(matricula => matricula.aluno);
    
    const alunos = await Aluno.find({ _id: { $in: alunosIds } })
      .populate('usuario', 'nome email fotoPerfil');

    // Combinar dados da matrícula com dados do aluno
    const alunosMatriculados = matriculas.map(matricula => {
      const dadosAluno = alunos.find(
        aluno => aluno._id.toString() === matricula.aluno.toString()
      );

      return {
        matricula: {
          dataMatricula: matricula.dataMatricula,
          status: matricula.status
        },
        aluno: dadosAluno
      };
    });

    res.status(200).json({
      status: 'sucesso',
      resultados: alunosMatriculados.length,
      data: {
        alunosMatriculados
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};
