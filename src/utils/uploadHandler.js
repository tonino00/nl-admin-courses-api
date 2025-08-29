const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('./errors');

/**
 * Configura o armazenamento para diferentes tipos de uploads
 * @param {string} tipo - Tipo de upload ('perfil', 'materiais', 'mensagens')
 * @returns {Object} Configuração de armazenamento do Multer
 */
const configStorage = (tipo) => {
  // Validar tipo
  if (!['perfil', 'materiais', 'mensagens'].includes(tipo)) {
    throw new ValidationError(`Tipo de upload '${tipo}' inválido`);
  }
  
  // Definir pasta base para uploads
  const baseDir = path.join(__dirname, '..', 'uploads', tipo);
  
  // Garantir que o diretório existe
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Configurar storage do Multer
  return multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, baseDir);
    },
    filename: function(req, file, cb) {
      // Gerar nome único para o arquivo
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    }
  });
};

/**
 * Filtra arquivos por tipo MIME permitido
 * @param {Array} tiposPermitidos - Array de tipos MIME permitidos
 * @returns {Function} Função de filtro para o Multer
 */
const fileFilter = (tiposPermitidos) => {
  return (req, file, cb) => {
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Tipo de arquivo não permitido. Tipos permitidos: ${tiposPermitidos.join(', ')}`
        ),
        false
      );
    }
  };
};

/**
 * Configurações predefinidas para diferentes tipos de uploads
 */
const configUpload = {
  perfil: {
    storage: configStorage('perfil'),
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: fileFilter([
      'image/jpeg',
      'image/png',
      'image/webp'
    ])
  },
  
  materiais: {
    storage: configStorage('materiais'),
    limits: {
      fileSize: 20 * 1024 * 1024 // 20MB
    },
    fileFilter: fileFilter([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'video/mp4',
      'image/jpeg',
      'image/png',
      'image/webp'
    ])
  },
  
  mensagens: {
    storage: configStorage('mensagens'),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'audio/mpeg',
      'audio/wav',
      'video/mp4'
    ])
  }
};

/**
 * Cria um middleware do Multer para upload de arquivos
 * @param {string} tipo - Tipo de upload ('perfil', 'materiais', 'mensagens')
 * @param {boolean} multiple - Se deve permitir múltiplos arquivos
 * @returns {Function} Middleware do Multer para upload
 */
exports.upload = (tipo, multiple = false) => {
  // Verificar se o tipo existe nas configurações
  if (!configUpload[tipo]) {
    throw new ValidationError(`Tipo de upload '${tipo}' não configurado`);
  }
  
  // Criar instância do Multer com as configurações
  const uploader = multer(configUpload[tipo]);
  
  // Retornar middleware adequado (single ou array)
  return multiple ? uploader.array('arquivos', 10) : uploader.single('arquivo');
};

/**
 * Formata informações do arquivo após o upload
 * @param {Object|Array} arquivo - Arquivo ou array de arquivos do Multer
 * @param {string} baseUrl - URL base para acesso ao arquivo
 * @returns {Object|Array} Informações formatadas do arquivo
 */
exports.formatarArquivo = (arquivo, baseUrl) => {
  if (!arquivo) return null;
  
  // Função para formatar um único arquivo
  const formatar = (file) => {
    const url = `${baseUrl}/${file.filename}`;
    
    return {
      nome: file.originalname,
      nomeArquivo: file.filename,
      tipo: file.mimetype,
      tamanho: file.size,
      url: url
    };
  };
  
  // Verificar se é um único arquivo ou um array
  return Array.isArray(arquivo) ? arquivo.map(formatar) : formatar(arquivo);
};
