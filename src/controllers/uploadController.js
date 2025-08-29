const path = require('path');
const config = require('../config/config');
const { upload, formatarArquivo } = require('../utils/uploadHandler');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Controller para uploads de arquivos
 */

/**
 * Upload de foto de perfil
 */
exports.uploadFotoPerfil = async (req, res, next) => {
  try {
    // O middleware upload já foi aplicado na rota, arquivo está em req.file
    if (!req.file) {
      throw new ValidationError('Nenhuma imagem enviada');
    }
    
    // URL base para acesso ao arquivo
    const baseUrl = `${req.protocol}://${req.get('host')}/api/uploads/perfil`;
    
    // Formatar informações do arquivo
    const arquivo = formatarArquivo(req.file, baseUrl);
    
    // Retornar informações do arquivo
    res.status(201).json({
      status: 'sucesso',
      data: {
        arquivo
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload de materiais de curso
 */
exports.uploadMaterialCurso = async (req, res, next) => {
  try {
    // O middleware upload já foi aplicado na rota, arquivos estão em req.files
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('Nenhum arquivo enviado');
    }
    
    // URL base para acesso aos arquivos
    const baseUrl = `${req.protocol}://${req.get('host')}/api/uploads/materiais`;
    
    // Formatar informações dos arquivos
    const arquivos = formatarArquivo(req.files, baseUrl);
    
    // Retornar informações dos arquivos
    res.status(201).json({
      status: 'sucesso',
      data: {
        arquivos
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload de anexos para mensagens
 */
exports.uploadAnexoMensagem = async (req, res, next) => {
  try {
    // O middleware upload já foi aplicado na rota, arquivos estão em req.files
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('Nenhum anexo enviado');
    }
    
    // URL base para acesso aos arquivos
    const baseUrl = `${req.protocol}://${req.get('host')}/api/uploads/mensagens`;
    
    // Formatar informações dos arquivos
    const anexos = formatarArquivo(req.files, baseUrl);
    
    // Retornar informações dos arquivos
    res.status(201).json({
      status: 'sucesso',
      data: {
        anexos
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Servir arquivo estático
 */
exports.servirArquivo = async (req, res, next) => {
  try {
    const { tipo, nomeArquivo } = req.params;
    
    // Verificar se o tipo é válido
    if (!['perfil', 'materiais', 'mensagens'].includes(tipo)) {
      throw new ValidationError(`Tipo de arquivo '${tipo}' inválido`);
    }
    
    // Caminho para o arquivo
    const caminhoArquivo = path.join(__dirname, '..', 'uploads', tipo, nomeArquivo);
    
    // Enviar o arquivo
    res.sendFile(caminhoArquivo, (err) => {
      if (err) {
        next(new NotFoundError('Arquivo não encontrado'));
      }
    });
  } catch (err) {
    next(err);
  }
};
