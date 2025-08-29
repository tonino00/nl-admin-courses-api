const Conversa = require('../models/Conversa');
const Mensagem = require('../models/Mensagem');
const Usuario = require('../models/Usuario');
const Curso = require('../models/Curso');
const mongoose = require('mongoose');

/**
 * Obter todas as conversas do usuário
 * @route GET /api/chat/conversas
 * @access Privado
 */
exports.getConversas = async (req, res) => {
  try {
    const { arquivadas } = req.query;
    
    // Filtrar conversas ativas do usuário
    const filtro = {
      'participantes.usuario': req.usuario.id,
      'participantes.ativo': true
    };
    
    // Filtrar por arquivadas/não arquivadas
    if (arquivadas !== undefined) {
      filtro['configuracoes.arquivada'] = arquivadas === 'true';
    }

    // Buscar conversas
    const conversas = await Conversa.find(filtro)
      .populate('participantes.usuario', 'nome email fotoPerfil')
      .populate('ultimaMensagem.remetente', 'nome email fotoPerfil')
      .populate('cursoRelacionado', 'nome')
      .sort({ 'ultimaMensagem.dataEnvio': -1 });

    res.status(200).json({
      status: 'sucesso',
      resultados: conversas.length,
      data: {
        conversas
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
 * Obter uma conversa específica
 * @route GET /api/chat/conversas/:id
 * @access Privado (participantes da conversa)
 */
exports.getConversa = async (req, res) => {
  try {
    const { id } = req.params;

    const conversa = await Conversa.findById(id)
      .populate('participantes.usuario', 'nome email fotoPerfil role')
      .populate('participantes.adicionadoPor', 'nome email')
      .populate('cursoRelacionado', 'nome descricao')
      .populate('criadoPor', 'nome email')
      .populate('ultimaMensagem.remetente', 'nome email fotoPerfil');

    // Verificar se a conversa existe
    if (!conversa) {
      return res.status(404).json({
        status: 'erro',
        message: 'Conversa não encontrada'
      });
    }

    // Verificar se o usuário é participante da conversa
    const isParticipante = conversa.participantes.some(
      p => p.usuario._id.toString() === req.usuario.id && p.ativo
    );

    if (!isParticipante && req.usuario.role !== 'admin') {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar esta conversa'
      });
    }

    res.status(200).json({
      status: 'sucesso',
      data: {
        conversa
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
 * Criar uma nova conversa
 * @route POST /api/chat/conversas
 * @access Privado
 */
exports.criarConversa = async (req, res) => {
  try {
    const {
      titulo,
      tipo,
      participantes,
      cursoRelacionado,
      mensagemInicial
    } = req.body;

    // Verificar se o tipo é válido
    if (!['individual', 'grupo', 'curso'].includes(tipo)) {
      return res.status(400).json({
        status: 'erro',
        message: 'Tipo de conversa inválido'
      });
    }

    // Para conversas individuais, verificar se já existe uma conversa entre os usuários
    if (tipo === 'individual' && participantes && participantes.length === 1) {
      const outroUsuarioId = participantes[0];
      
      // Verificar se o usuário existe
      const usuarioExiste = await Usuario.exists({ _id: outroUsuarioId });
      if (!usuarioExiste) {
        return res.status(404).json({
          status: 'erro',
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se já existe uma conversa individual
      const conversaExistente = await Conversa.findOne({
        tipo: 'individual',
        'participantes.usuario': { $all: [req.usuario.id, outroUsuarioId] },
        'participantes.ativo': true
      });

      if (conversaExistente) {
        return res.status(200).json({
          status: 'sucesso',
          message: 'Conversa já existe',
          data: {
            conversa: conversaExistente
          }
        });
      }
    }

    // Para conversas de curso, verificar se o curso existe
    if (tipo === 'curso' && cursoRelacionado) {
      const cursoExiste = await Curso.exists({ _id: cursoRelacionado });
      if (!cursoExiste) {
        return res.status(404).json({
          status: 'erro',
          message: 'Curso não encontrado'
        });
      }
    }

    // Preparar participantes
    let participantesConversa = [{
      usuario: req.usuario.id,
      adicionadoPor: req.usuario.id,
      adicionadoEm: new Date(),
      papel: 'admin'
    }];

    // Adicionar outros participantes
    if (participantes && participantes.length > 0) {
      // Verificar se todos os participantes existem
      const usuariosExistentes = await Usuario.countDocuments({
        _id: { $in: participantes }
      });

      if (usuariosExistentes !== participantes.length) {
        return res.status(400).json({
          status: 'erro',
          message: 'Um ou mais participantes não existem'
        });
      }

      participantes.forEach(participante => {
        if (participante !== req.usuario.id) {
          participantesConversa.push({
            usuario: participante,
            adicionadoPor: req.usuario.id,
            adicionadoEm: new Date(),
            papel: 'membro'
          });
        }
      });
    }

    // Criar a conversa
    const novaConversa = await Conversa.create({
      titulo: titulo || null,
      tipo,
      participantes: participantesConversa,
      cursoRelacionado: tipo === 'curso' ? cursoRelacionado : null,
      criadoPor: req.usuario.id
    });

    // Se tiver uma mensagem inicial, criar
    if (mensagemInicial) {
      const novaMensagem = await Mensagem.create({
        conteudo: mensagemInicial,
        tipo: 'texto',
        remetente: req.usuario.id,
        destinatario: {
          tipo: 'grupo',
          id: novaConversa._id
        },
        dataEnvio: new Date(),
        status: 'enviado'
      });

      // Atualizar última mensagem da conversa
      await Conversa.findByIdAndUpdate(novaConversa._id, {
        ultimaMensagem: {
          conteudo: mensagemInicial,
          remetente: req.usuario.id,
          dataEnvio: new Date(),
          tipo: 'texto'
        }
      });
    }

    // Buscar a conversa criada com populações
    const conversaCriada = await Conversa.findById(novaConversa._id)
      .populate('participantes.usuario', 'nome email fotoPerfil')
      .populate('cursoRelacionado', 'nome');

    res.status(201).json({
      status: 'sucesso',
      data: {
        conversa: conversaCriada
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
 * Adicionar participantes a uma conversa
 * @route POST /api/chat/conversas/:id/participantes
 * @access Privado (admin da conversa)
 */
exports.adicionarParticipantes = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantes } = req.body;

    // Verificar se a conversa existe
    const conversa = await Conversa.findById(id);
    
    if (!conversa) {
      return res.status(404).json({
        status: 'erro',
        message: 'Conversa não encontrada'
      });
    }

    // Verificar se o usuário é admin da conversa
    const isAdmin = conversa.participantes.some(
      p => p.usuario.toString() === req.usuario.id && p.papel === 'admin' && p.ativo
    );

    if (!isAdmin && req.usuario.role !== 'admin') {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para adicionar participantes'
      });
    }

    // Verificar se é conversa individual (não pode adicionar participantes)
    if (conversa.tipo === 'individual') {
      return res.status(400).json({
        status: 'erro',
        message: 'Não é possível adicionar participantes a uma conversa individual'
      });
    }

    // Verificar se os participantes existem
    if (!participantes || !participantes.length) {
      return res.status(400).json({
        status: 'erro',
        message: 'Nenhum participante informado'
      });
    }

    const usuariosExistentes = await Usuario.countDocuments({
      _id: { $in: participantes }
    });

    if (usuariosExistentes !== participantes.length) {
      return res.status(400).json({
        status: 'erro',
        message: 'Um ou mais participantes não existem'
      });
    }

    // Verificar participantes já existentes
    const participantesAtuais = conversa.participantes.map(p => p.usuario.toString());
    
    // Adicionar novos participantes
    for (const participante of participantes) {
      if (!participantesAtuais.includes(participante)) {
        // Adicionar novo participante
        conversa.participantes.push({
          usuario: participante,
          adicionadoPor: req.usuario.id,
          adicionadoEm: new Date(),
          papel: 'membro',
          ativo: true
        });
      } else {
        // Reativar participante existente
        const index = conversa.participantes.findIndex(
          p => p.usuario.toString() === participante
        );
        
        if (index !== -1 && !conversa.participantes[index].ativo) {
          conversa.participantes[index].ativo = true;
          conversa.participantes[index].adicionadoPor = req.usuario.id;
          conversa.participantes[index].adicionadoEm = new Date();
        }
      }
    }

    await conversa.save();

    // Buscar a conversa atualizada
    const conversaAtualizada = await Conversa.findById(id)
      .populate('participantes.usuario', 'nome email fotoPerfil')
      .populate('participantes.adicionadoPor', 'nome email');

    res.status(200).json({
      status: 'sucesso',
      data: {
        conversa: conversaAtualizada
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
 * Remover participante de uma conversa
 * @route DELETE /api/chat/conversas/:id/participantes/:usuarioId
 * @access Privado (admin da conversa ou próprio usuário)
 */
exports.removerParticipante = async (req, res) => {
  try {
    const { id, usuarioId } = req.params;

    // Verificar se a conversa existe
    const conversa = await Conversa.findById(id);
    
    if (!conversa) {
      return res.status(404).json({
        status: 'erro',
        message: 'Conversa não encontrada'
      });
    }

    // Verificar se o usuário a ser removido existe na conversa
    const participanteIndex = conversa.participantes.findIndex(
      p => p.usuario.toString() === usuarioId && p.ativo
    );

    if (participanteIndex === -1) {
      return res.status(404).json({
        status: 'erro',
        message: 'Participante não encontrado na conversa'
      });
    }

    // Verificar permissões (admin da conversa pode remover qualquer um, usuário pode se remover)
    const isAdmin = conversa.participantes.some(
      p => p.usuario.toString() === req.usuario.id && p.papel === 'admin' && p.ativo
    );

    if (req.usuario.id !== usuarioId && !isAdmin && req.usuario.role !== 'admin') {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para remover este participante'
      });
    }

    // Verificar se é conversa individual (não pode remover participantes)
    if (conversa.tipo === 'individual') {
      return res.status(400).json({
        status: 'erro',
        message: 'Não é possível remover participantes de uma conversa individual'
      });
    }

    // Desativar participante (não remove, apenas marca como inativo)
    conversa.participantes[participanteIndex].ativo = false;
    await conversa.save();

    res.status(200).json({
      status: 'sucesso',
      message: 'Participante removido da conversa'
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

/**
 * Obter mensagens de uma conversa
 * @route GET /api/chat/conversas/:id/mensagens
 * @access Privado (participantes da conversa)
 */
exports.getMensagens = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, antes } = req.query;

    // Verificar se a conversa existe
    const conversa = await Conversa.findById(id);
    
    if (!conversa) {
      return res.status(404).json({
        status: 'erro',
        message: 'Conversa não encontrada'
      });
    }

    // Verificar se o usuário é participante da conversa
    const isParticipante = conversa.participantes.some(
      p => p.usuario.toString() === req.usuario.id && p.ativo
    );

    if (!isParticipante && req.usuario.role !== 'admin') {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para acessar esta conversa'
      });
    }

    // Construir filtro para buscar mensagens
    const filtro = {
      'destinatario.tipo': 'grupo',
      'destinatario.id': conversa._id,
      'excluido': false
    };

    // Se tiver um timestamp, buscar mensagens antes dele
    if (antes) {
      filtro.dataEnvio = { $lt: new Date(antes) };
    }

    // Buscar mensagens com paginação
    const mensagens = await Mensagem.find(filtro)
      .populate('remetente', 'nome email fotoPerfil')
      .populate('respondendo', 'conteudo remetente')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dataEnvio: -1 }); // Mais recentes primeiro

    // Marcar mensagens como lidas
    const mensagensIds = mensagens.map(m => m._id);
    
    if (mensagensIds.length > 0) {
      await Mensagem.updateMany(
        {
          _id: { $in: mensagensIds },
          'leituras.usuario': { $ne: req.usuario.id }
        },
        {
          $push: {
            leituras: {
              usuario: req.usuario.id,
              dataLeitura: new Date()
            }
          }
        }
      );
    }

    res.status(200).json({
      status: 'sucesso',
      resultados: mensagens.length,
      data: {
        mensagens: mensagens.reverse() // Invertendo para ordem cronológica
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
 * Enviar mensagem em uma conversa
 * @route POST /api/chat/conversas/:id/mensagens
 * @access Privado (participantes da conversa)
 */
exports.enviarMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, tipo, anexos, respondendo } = req.body;

    // Verificar se a conversa existe
    const conversa = await Conversa.findById(id);
    
    if (!conversa) {
      return res.status(404).json({
        status: 'erro',
        message: 'Conversa não encontrada'
      });
    }

    // Verificar se o usuário é participante da conversa
    const isParticipante = conversa.participantes.some(
      p => p.usuario.toString() === req.usuario.id && p.ativo
    );

    if (!isParticipante) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para enviar mensagens nesta conversa'
      });
    }

    // Verificar se a conversa está configurada para somente leitura
    if (conversa.configuracoes.soLeituraParticipantes) {
      // Verificar se o usuário é admin da conversa
      const isAdmin = conversa.participantes.some(
        p => p.usuario.toString() === req.usuario.id && p.papel === 'admin' && p.ativo
      );

      if (!isAdmin && req.usuario.role !== 'admin') {
        return res.status(403).json({
          status: 'erro',
          message: 'Esta conversa está configurada apenas para leitura'
        });
      }
    }

    // Criar a mensagem
    const novaMensagem = await Mensagem.create({
      conteudo,
      tipo: tipo || 'texto',
      remetente: req.usuario.id,
      destinatario: {
        tipo: 'grupo',
        id: conversa._id
      },
      dataEnvio: new Date(),
      anexos,
      respondendo,
      leituras: [{
        usuario: req.usuario.id,
        dataLeitura: new Date()
      }]
    });

    // Atualizar última mensagem da conversa
    conversa.ultimaMensagem = {
      conteudo,
      remetente: req.usuario.id,
      dataEnvio: new Date(),
      tipo: tipo || 'texto'
    };
    
    conversa.atualizadoEm = new Date();
    await conversa.save();

    // Buscar a mensagem criada com populações
    const mensagemCriada = await Mensagem.findById(novaMensagem._id)
      .populate('remetente', 'nome email fotoPerfil')
      .populate('respondendo', 'conteudo remetente')
      .populate({
        path: 'respondendo',
        populate: {
          path: 'remetente',
          select: 'nome email'
        }
      });

    // Aqui seria o local para emitir um evento de websocket
    // para notificar os outros participantes sobre a nova mensagem

    res.status(201).json({
      status: 'sucesso',
      data: {
        mensagem: mensagemCriada
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
 * Marcar conversa como arquivada/desarquivada
 * @route PATCH /api/chat/conversas/:id/arquivar
 * @access Privado (participantes da conversa)
 */
exports.arquivarConversa = async (req, res) => {
  try {
    const { id } = req.params;
    const { arquivada } = req.body;

    // Verificar se a conversa existe
    const conversa = await Conversa.findById(id);
    
    if (!conversa) {
      return res.status(404).json({
        status: 'erro',
        message: 'Conversa não encontrada'
      });
    }

    // Verificar se o usuário é participante da conversa
    const isParticipante = conversa.participantes.some(
      p => p.usuario.toString() === req.usuario.id && p.ativo
    );

    if (!isParticipante) {
      return res.status(403).json({
        status: 'erro',
        message: 'Você não tem permissão para arquivar esta conversa'
      });
    }

    // Atualizar configuração de arquivada
    conversa.configuracoes.arquivada = arquivada !== undefined ? arquivada : true;
    await conversa.save();

    res.status(200).json({
      status: 'sucesso',
      message: arquivada !== false ? 'Conversa arquivada' : 'Conversa desarquivada',
      data: {
        arquivada: conversa.configuracoes.arquivada
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};
