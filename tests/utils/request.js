/**
 * Utilitários para testar requisições HTTP
 */

const request = require('supertest');
const app = require('../../src/app');

/**
 * Cliente de requisições HTTP para testes com Supertest
 */
const apiClient = {
  /**
   * Realiza uma requisição GET
   * @param {String} url - URL da requisição
   * @param {Object} options - Opções adicionais
   * @param {String} options.token - Token JWT para autenticação
   * @returns {Promise} Resposta da requisição
   */
  get: (url, options = {}) => {
    const req = request(app).get(url);
    
    if (options.token) {
      req.set('Authorization', `Bearer ${options.token}`);
    }
    
    return req;
  },
  
  /**
   * Realiza uma requisição POST
   * @param {String} url - URL da requisição
   * @param {Object} body - Corpo da requisição
   * @param {Object} options - Opções adicionais
   * @param {String} options.token - Token JWT para autenticação
   * @returns {Promise} Resposta da requisição
   */
  post: (url, body = {}, options = {}) => {
    const req = request(app).post(url).send(body);
    
    if (options.token) {
      req.set('Authorization', `Bearer ${options.token}`);
    }
    
    return req;
  },
  
  /**
   * Realiza uma requisição PUT
   * @param {String} url - URL da requisição
   * @param {Object} body - Corpo da requisição
   * @param {Object} options - Opções adicionais
   * @param {String} options.token - Token JWT para autenticação
   * @returns {Promise} Resposta da requisição
   */
  put: (url, body = {}, options = {}) => {
    const req = request(app).put(url).send(body);
    
    if (options.token) {
      req.set('Authorization', `Bearer ${options.token}`);
    }
    
    return req;
  },
  
  /**
   * Realiza uma requisição DELETE
   * @param {String} url - URL da requisição
   * @param {Object} options - Opções adicionais
   * @param {String} options.token - Token JWT para autenticação
   * @returns {Promise} Resposta da requisição
   */
  delete: (url, options = {}) => {
    const req = request(app).delete(url);
    
    if (options.token) {
      req.set('Authorization', `Bearer ${options.token}`);
    }
    
    return req;
  },
  
  /**
   * Realiza uma requisição POST com upload de arquivo
   * @param {String} url - URL da requisição
   * @param {String} campo - Nome do campo do formulário
   * @param {String} caminhoArquivo - Caminho para o arquivo
   * @param {Object} options - Opções adicionais
   * @param {String} options.token - Token JWT para autenticação
   * @returns {Promise} Resposta da requisição
   */
  upload: (url, campo, caminhoArquivo, options = {}) => {
    const req = request(app).post(url).attach(campo, caminhoArquivo);
    
    if (options.token) {
      req.set('Authorization', `Bearer ${options.token}`);
    }
    
    return req;
  }
};

module.exports = apiClient;
