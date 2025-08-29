const Aluno = require('../models/Aluno');
const Usuario = require('../models/Usuario');
const Curso = require('../models/Curso');
const mongoose = require('mongoose');

/**
 * Obter todos os alunos
 * @route GET /api/alunos
 * @access Privado (admin, professor)
 */
exports.getAlunos = async (req, res) => {
  try {
    const { page = 1, limit = 10, nome, matricula } = req.query;
    
    // Construir o filtro de busca
    const filtro = {};
    
    if (matricula) {
      filtro.matricula = { $regex: matricula, $options: 'i' };
    }
    
    // Filtro por nome (busca no modelo Usuario)
    let alunosIds = [];
    if (nome) {
      const usuarios = await Usuario.find({
        nome: { $regex: nome, $options: 'i' },
        role: 'aluno'
      });
      
      alunosIds = usuarios.map(u => u._id);
      filtro.usuario = { $in: alunosIds };
    }

    // Contar total de documentos com o filtro aplicado
    const total = await Aluno.countDocuments(filtro);

    // Buscar alunos com paginação
    const alunos = await Aluno.find(filtro)
      .populate('usuario', 'nome email fotoPerfil')
      .populate({
        path: 'cursosMatriculados.curso',
        select: 'nome dataInicio dataFim status'
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ criadoEm: -1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: alunos.length,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      data: {
        alunos
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
 * Obter um aluno pelo ID
 * @route GET /api/alunos/:id
 * @access Privado (admin, professor, aluno próprio)
 */
exports.getAluno = async (req, res) => {
  try {
    const { id } = req.params;

    const aluno = await Aluno.findById(id)
      .populate('usuario', 'nome email fotoPerfil')
      .populate({
        path: 'cursosMatriculados.curso',
        select: 'nome dataInicio dataFim status professorResponsavel',
        populate: {
          path: 'professorResponsavel',
          select: 'usuario',
          populate: {
            path: 'usuario',
            select: 'nome'
          }
        }
      })
      .populate({
        path: 'historicoAcademico.curso',
        select: 'nome cargaHoraria'
      });

    // Verificar se o aluno existe
    if (!aluno) {
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar permissões (aluno só pode ver o próprio perfil)
    if (req.usuario.role === 'aluno' && req.usuario.id !== aluno.usuario.id) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar este perfil'
      });
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        aluno
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
 * Criar um novo aluno
 * @route POST /api/alunos
 * @access Privado (admin)
 */
exports.criarAluno = async (req, res) => {
  // Usar uma sessão para garantir atomicidade da operação
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      nome, email, senha, matricula,
      documentos, endereco, telefone, dataNascimento
    } = req.body;

    // 1. Verificar se já existe um usuário com este email
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Email já está sendo utilizado'
      });
    }

    // 2. Verificar se já existe um aluno com esta matrícula
    const matriculaExistente = await Aluno.findOne({ matricula });
    if (matriculaExistente) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Matrícula já está sendo utilizada'
      });
    }

    // 3. Criar o usuário
    const novoUsuario = await Usuario.create([{
      nome,
      email,
      senha,
      role: 'aluno'
    }], { session });

    // 4. Criar o aluno
    const novoAluno = await Aluno.create([{
      usuario: novoUsuario[0]._id,
      matricula,
      documentos,
      endereco,
      telefone,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Remover senha do objeto de resposta
    novoUsuario[0].senha = undefined;

    res.status(201).json({
      status: 'sucesso',
      data: {
        aluno: {
          ...novoAluno[0]._doc,
          usuario: novoUsuario[0]
        }
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
 * Atualizar um aluno
 * @route PUT /api/alunos/:id
 * @access Privado (admin)
 */
exports.atualizarAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, email, documentos, endereco, 
      telefone, dataNascimento, matricula
    } = req.body;

    // Buscar o aluno
    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar se a matrícula já existe (se estiver sendo alterada)
    if (matricula && matricula !== aluno.matricula) {
      const matriculaExistente = await Aluno.findOne({ matricula });
      if (matriculaExistente) {
        return res.status(400).json({
          status: 'erro',
          message: 'Matrícula já está sendo utilizada'
        });
      }
      aluno.matricula = matricula;
    }

    // Atualizar dados do aluno
    if (documentos) aluno.documentos = documentos;
    if (endereco) aluno.endereco = endereco;
    if (telefone) aluno.telefone = telefone;
    if (dataNascimento) aluno.dataNascimento = new Date(dataNascimento);

    await aluno.save();

    // Atualizar dados do usuário se necessário
    if (nome || email) {
      const usuario = await Usuario.findById(aluno.usuario);
      
      if (nome) usuario.nome = nome;
      if (email && email !== usuario.email) {
        // Verificar se o email já está sendo usado
        const emailExistente = await Usuario.findOne({ email });
        if (emailExistente) {
          return res.status(400).json({
            status: 'erro',
            message: 'Email já está sendo utilizado'
          });
        }
        usuario.email = email;
      }
      
      await usuario.save();
    }

    // Buscar o aluno atualizado com os dados do usuário
    const alunoAtualizado = await Aluno.findById(id).populate('usuario', 'nome email fotoPerfil');

    res.status(200).json({
      status: 'sucesso',
      data: {
        aluno: alunoAtualizado
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
 * Remover um aluno
 * @route DELETE /api/alunos/:id
 * @access Privado (admin)
 */
exports.removerAluno = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Buscar o aluno
    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar se o aluno está matriculado em cursos ativos
    const cursosAtivos = aluno.cursosMatriculados.filter(
      matricula => matricula.status === 'ativo'
    );

    if (cursosAtivos.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Não é possível remover um aluno com matrículas ativas'
      });
    }

    // Remover o aluno de todos os cursos em que está matriculado
    const cursosIds = aluno.cursosMatriculados.map(matricula => matricula.curso);
    
    await Curso.updateMany(
      { _id: { $in: cursosIds } },
      { $pull: { alunosMatriculados: { aluno: aluno._id } } },
      { session }
    );

    // Remover o aluno
    await Aluno.findByIdAndDelete(id, { session });

    // Remover o usuário associado
    await Usuario.findByIdAndDelete(aluno.usuario, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'sucesso',
      message: 'Aluno removido com sucesso'
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
 * Obter cursos do aluno
 * @route GET /api/alunos/:id/cursos
 * @access Privado (admin, professor, aluno próprio)
 */
exports.getCursosAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Buscar o aluno
    const aluno = await Aluno.findById(id)
      .populate({
        path: 'cursosMatriculados.curso',
        select: 'nome descricao dataInicio dataFim status professorResponsavel cargaHoraria',
        populate: {
          path: 'professorResponsavel',
          select: 'usuario',
          populate: {
            path: 'usuario',
            select: 'nome'
          }
        }
      });
    
    if (!aluno) {
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar permissões (aluno só pode ver o próprio perfil)
    if (req.usuario.role === 'aluno' && req.usuario.id !== aluno.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar estes dados'
      });
    }

    // Filtrar por status, se solicitado
    let cursos = aluno.cursosMatriculados;
    if (status) {
      cursos = cursos.filter(matricula => matricula.status === status);
    }

    res.status(200).json({
      status: 'sucesso',
      resultados: cursos.length,
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
 * Obter notas do aluno
 * @route GET /api/alunos/:id/notas
 * @access Privado (admin, professor, aluno próprio)
 */
exports.getNotasAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const { cursoId } = req.query;

    // Buscar o aluno
    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar permissões (aluno só pode ver as próprias notas)
    if (req.usuario.role === 'aluno' && req.usuario.id !== aluno.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar estas notas'
      });
    }

    // Construir a query para buscar notas
    let query = {
      'notas.aluno': mongoose.Types.ObjectId(id)
    };

    // Filtrar por curso específico, se solicitado
    if (cursoId) {
      query.curso = mongoose.Types.ObjectId(cursoId);
    } else {
      // Caso contrário, filtrar pelos cursos em que o aluno está matriculado
      const cursosIds = aluno.cursosMatriculados.map(
        matricula => matricula.curso
      );
      query.curso = { $in: cursosIds };
    }

    // Buscar avaliações com notas do aluno
    const avaliacoes = await mongoose.model('Avaliacao').find(query)
      .populate('curso', 'nome')
      .select('titulo tipo peso dataAplicacao notas curso');

    // Extrair apenas as notas do aluno de cada avaliação
    const notas = avaliacoes.map(avaliacao => {
      const notaAluno = avaliacao.notas.find(
        n => n.aluno.toString() === id
      );
      
      return {
        avaliacao: {
          id: avaliacao._id,
          titulo: avaliacao.titulo,
          tipo: avaliacao.tipo,
          peso: avaliacao.peso,
          dataAplicacao: avaliacao.dataAplicacao
        },
        curso: {
          id: avaliacao.curso._id,
          nome: avaliacao.curso.nome
        },
        valor: notaAluno ? notaAluno.valor : null,
        observacoes: notaAluno ? notaAluno.observacoes : null,
        dataLancamento: notaAluno ? notaAluno.dataLancamento : null
      };
    });

    res.status(200).json({
      status: 'sucesso',
      resultados: notas.length,
      data: {
        notas
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
 * Obter frequência do aluno
 * @route GET /api/alunos/:id/frequencia
 * @access Privado (admin, professor, aluno próprio)
 */
exports.getFrequenciaAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const { cursoId } = req.query;

    // Buscar o aluno
    const aluno = await Aluno.findById(id);
    
    if (!aluno) {
      return res.status(404).json({
        status: 'erro',
        message: 'Aluno não encontrado'
      });
    }

    // Verificar permissões (aluno só pode ver a própria frequência)
    if (req.usuario.role === 'aluno' && req.usuario.id !== aluno.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar estes dados'
      });
    }

    // Construir a query para buscar frequência
    let query = {
      'presenca.aluno': mongoose.Types.ObjectId(id)
    };

    // Filtrar por curso específico, se solicitado
    if (cursoId) {
      query.curso = mongoose.Types.ObjectId(cursoId);
    } else {
      // Caso contrário, filtrar pelos cursos em que o aluno está matriculado
      const cursosIds = aluno.cursosMatriculados.map(
        matricula => matricula.curso
      );
      query.curso = { $in: cursosIds };
    }

    // Buscar aulas com registros de presença do aluno
    const aulas = await mongoose.model('Aula').find(query)
      .populate('curso', 'nome')
      .select('titulo dataHora duracao presenca curso');

    // Extrair apenas os registros de presença do aluno de cada aula
    const frequencia = aulas.map(aula => {
      const presencaAluno = aula.presenca.find(
        p => p.aluno.toString() === id
      );
      
      return {
        aula: {
          id: aula._id,
          titulo: aula.titulo,
          dataHora: aula.dataHora,
          duracao: aula.duracao
        },
        curso: {
          id: aula.curso._id,
          nome: aula.curso.nome
        },
        status: presencaAluno ? presencaAluno.status : 'ausente',
        justificativa: presencaAluno ? presencaAluno.justificativa : null
      };
    });

    res.status(200).json({
      status: 'sucesso',
      resultados: frequencia.length,
      data: {
        frequencia
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};
