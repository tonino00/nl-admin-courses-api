const Professor = require('../models/Professor');
const Usuario = require('../models/Usuario');
const Curso = require('../models/Curso');
const mongoose = require('mongoose');

/**
 * Obter todos os professores
 * @route GET /api/professores
 * @access Privado (admin)
 */
exports.getProfessores = async (req, res) => {
  try {
    const { page = 1, limit = 10, nome, especialidade } = req.query;
    
    // Construir o filtro de busca
    const filtro = {};
    
    if (especialidade) {
      filtro.especialidade = { $regex: especialidade, $options: 'i' };
    }
    
    // Filtro por nome (busca no modelo Usuario)
    let professoresIds = [];
    if (nome) {
      const usuarios = await Usuario.find({
        nome: { $regex: nome, $options: 'i' },
        role: 'professor'
      });
      
      professoresIds = usuarios.map(u => u._id);
      filtro.usuario = { $in: professoresIds };
    }

    // Contar total de documentos com o filtro aplicado
    const total = await Professor.countDocuments(filtro);

    // Buscar professores com paginação
    const professores = await Professor.find(filtro)
      .populate('usuario', 'nome email fotoPerfil')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ criadoEm: -1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: professores.length,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      data: {
        professores
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
 * Obter um professor pelo ID
 * @route GET /api/professores/:id
 * @access Privado (admin, professor próprio)
 */
exports.getProfessor = async (req, res) => {
  try {
    const { id } = req.params;

    const professor = await Professor.findById(id)
      .populate('usuario', 'nome email fotoPerfil')
      .populate({
        path: 'cursosMinistrando',
        select: 'nome descricao dataInicio dataFim status cargaHoraria'
      });

    // Verificar se o professor existe
    if (!professor) {
      return res.status(404).json({
        status: 'erro',
        message: 'Professor não encontrado'
      });
    }

    // Verificar permissões (professor só pode ver o próprio perfil)
    if (req.usuario.role === 'professor' && req.usuario.id !== professor.usuario.id) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar este perfil'
      });
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        professor
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
 * Criar um novo professor
 * @route POST /api/professores
 * @access Privado (admin)
 */
exports.criarProfessor = async (req, res) => {
  // Usar uma sessão para garantir atomicidade da operação
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      nome, email, senha, especialidade, formacaoAcademica,
      disponibilidade, documentos, endereco, telefone
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

    // 2. Criar o usuário
    const novoUsuario = await Usuario.create([{
      nome,
      email,
      senha,
      role: 'professor'
    }], { session });

    // 3. Criar o professor
    const novoProfessor = await Professor.create([{
      usuario: novoUsuario[0]._id,
      especialidade,
      formacaoAcademica,
      disponibilidade,
      documentos,
      endereco,
      telefone
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Remover senha do objeto de resposta
    novoUsuario[0].senha = undefined;

    res.status(201).json({
      status: 'sucesso',
      data: {
        professor: {
          ...novoProfessor[0]._doc,
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
 * Atualizar um professor
 * @route PUT /api/professores/:id
 * @access Privado (admin, professor próprio)
 */
exports.atualizarProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, email, especialidade, formacaoAcademica,
      disponibilidade, documentos, endereco, telefone
    } = req.body;

    // Buscar o professor
    const professor = await Professor.findById(id);
    
    if (!professor) {
      return res.status(404).json({
        status: 'erro',
        message: 'Professor não encontrado'
      });
    }

    // Verificar permissões (professor só pode editar o próprio perfil)
    if (req.usuario.role === 'professor' && req.usuario.id !== professor.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para editar este perfil'
      });
    }

    // Atualizar dados do professor
    if (especialidade) professor.especialidade = especialidade;
    if (formacaoAcademica) professor.formacaoAcademica = formacaoAcademica;
    if (disponibilidade) professor.disponibilidade = disponibilidade;
    if (documentos) professor.documentos = documentos;
    if (endereco) professor.endereco = endereco;
    if (telefone) professor.telefone = telefone;

    await professor.save();

    // Atualizar dados do usuário se necessário
    if (nome || email) {
      const usuario = await Usuario.findById(professor.usuario);
      
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

    // Buscar o professor atualizado com os dados do usuário
    const professorAtualizado = await Professor.findById(id).populate('usuario', 'nome email fotoPerfil');

    res.status(200).json({
      status: 'sucesso',
      data: {
        professor: professorAtualizado
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
 * Remover um professor
 * @route DELETE /api/professores/:id
 * @access Privado (admin)
 */
exports.removerProfessor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Buscar o professor
    const professor = await Professor.findById(id);
    
    if (!professor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: 'erro',
        message: 'Professor não encontrado'
      });
    }

    // Verificar se o professor está ministrando cursos ativos
    const cursosAtivos = await Curso.countDocuments({
      professorResponsavel: professor._id,
      status: { $in: ['ativo', 'matriculasAbertas'] }
    });

    if (cursosAtivos > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'erro',
        message: 'Não é possível remover um professor que está ministrando cursos ativos'
      });
    }

    // Remover o professor como responsável dos cursos (histórico)
    await Curso.updateMany(
      { professorResponsavel: professor._id },
      { $unset: { professorResponsavel: 1 } },
      { session }
    );

    // Remover o professor
    await Professor.findByIdAndDelete(id, { session });

    // Remover o usuário associado
    await Usuario.findByIdAndDelete(professor.usuario, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'sucesso',
      message: 'Professor removido com sucesso'
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
 * Obter cursos do professor
 * @route GET /api/professores/:id/cursos
 * @access Privado (admin, professor próprio)
 */
exports.getCursosProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Buscar o professor
    const professor = await Professor.findById(id);
    
    if (!professor) {
      return res.status(404).json({
        status: 'erro',
        message: 'Professor não encontrado'
      });
    }

    // Verificar permissões (professor só pode ver os próprios cursos)
    if (req.usuario.role === 'professor' && req.usuario.id !== professor.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar estes dados'
      });
    }

    // Construir a query para buscar cursos
    let query = {
      professorResponsavel: professor._id
    };

    // Filtrar por status, se solicitado
    if (status) {
      query.status = status;
    }

    // Buscar cursos ministrados pelo professor
    const cursos = await Curso.find(query)
      .select('nome descricao dataInicio dataFim status cargaHoraria vagasDisponiveis alunosMatriculados')
      .sort({ criadoEm: -1 });

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
 * Obter disponibilidade do professor
 * @route GET /api/professores/:id/disponibilidade
 * @access Privado (admin, professor próprio)
 */
exports.getDisponibilidade = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o professor
    const professor = await Professor.findById(id)
      .select('disponibilidade');
    
    if (!professor) {
      return res.status(404).json({
        status: 'erro',
        message: 'Professor não encontrado'
      });
    }

    // Verificar permissões (professor só pode ver a própria disponibilidade)
    if (req.usuario.role === 'professor' && req.usuario.id !== professor.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar estes dados'
      });
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        disponibilidade: professor.disponibilidade || []
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
 * Atualizar disponibilidade do professor
 * @route PUT /api/professores/:id/disponibilidade
 * @access Privado (admin, professor próprio)
 */
exports.atualizarDisponibilidade = async (req, res) => {
  try {
    const { id } = req.params;
    const { disponibilidade } = req.body;

    // Buscar o professor
    const professor = await Professor.findById(id);
    
    if (!professor) {
      return res.status(404).json({
        status: 'erro',
        message: 'Professor não encontrado'
      });
    }

    // Verificar permissões (professor só pode editar a própria disponibilidade)
    if (req.usuario.role === 'professor' && req.usuario.id !== professor.usuario.toString()) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para editar estes dados'
      });
    }

    // Validar formato da disponibilidade
    if (!disponibilidade || !Array.isArray(disponibilidade)) {
      return res.status(400).json({
        status: 'erro',
        message: 'Formato de disponibilidade inválido'
      });
    }

    professor.disponibilidade = disponibilidade;
    await professor.save();

    res.status(200).json({
      status: 'sucesso',
      data: {
        disponibilidade: professor.disponibilidade
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};
