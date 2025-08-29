/**
 * Configuração do Swagger para documentação da API
 */
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Configuração básica do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Administração Acadêmica',
      version: '1.0.0',
      description: 'API para sistema de administração de cursos acadêmicos',
      contact: {
        name: 'Suporte',
        email: 'suporte@exemplo.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Usuario: {
          type: 'object',
          required: ['nome', 'email', 'senha', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do usuário'
            },
            nome: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Endereço de e-mail único do usuário'
            },
            senha: {
              type: 'string',
              format: 'password',
              description: 'Senha do usuário (criptografada no banco de dados)'
            },
            role: {
              type: 'string',
              enum: ['admin', 'professor', 'aluno'],
              description: 'Papel do usuário no sistema'
            },
            telefone: {
              type: 'string',
              description: 'Número de telefone do usuário'
            },
            fotoPerfil: {
              type: 'string',
              description: 'URL da foto de perfil do usuário'
            },
            dataCriacao: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do usuário'
            },
            ultimoAcesso: {
              type: 'string',
              format: 'date-time',
              description: 'Data do último acesso do usuário'
            },
            ativo: {
              type: 'boolean',
              description: 'Status de atividade do usuário'
            }
          }
        },
        Aluno: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do aluno'
            },
            usuario: {
              $ref: '#/components/schemas/Usuario'
            },
            matricula: {
              type: 'string',
              description: 'Número de matrícula do aluno'
            },
            dataIngresso: {
              type: 'string',
              format: 'date',
              description: 'Data de ingresso do aluno na instituição'
            },
            cursos: {
              type: 'array',
              items: {
                type: 'string',
                description: 'ID do curso'
              },
              description: 'Cursos nos quais o aluno está matriculado'
            }
          }
        },
        Professor: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do professor'
            },
            usuario: {
              $ref: '#/components/schemas/Usuario'
            },
            especialidade: {
              type: 'string',
              description: 'Área de especialidade do professor'
            },
            formacao: {
              type: 'string',
              enum: ['graduacao', 'especializacao', 'mestrado', 'doutorado', 'pos-doutorado'],
              description: 'Nível de formação acadêmica do professor'
            },
            instituicaoFormacao: {
              type: 'string',
              description: 'Instituição onde o professor obteve sua formação'
            },
            disponibilidade: {
              type: 'object',
              description: 'Horários disponíveis para cada dia da semana'
            },
            areasInteresse: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Áreas de interesse do professor'
            }
          }
        },
        Curso: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do curso'
            },
            titulo: {
              type: 'string',
              description: 'Título do curso'
            },
            descricao: {
              type: 'string',
              description: 'Descrição detalhada do curso'
            },
            professor: {
              type: 'string',
              description: 'ID do professor responsável'
            },
            cargaHoraria: {
              type: 'integer',
              description: 'Carga horária total do curso em horas'
            },
            categoria: {
              type: 'string',
              description: 'Categoria à qual o curso pertence'
            },
            nivel: {
              type: 'string',
              enum: ['basico', 'intermediario', 'avancado'],
              description: 'Nível de dificuldade do curso'
            },
            dataCriacao: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do curso'
            },
            dataInicio: {
              type: 'string',
              format: 'date',
              description: 'Data de início do curso'
            },
            dataFim: {
              type: 'string',
              format: 'date',
              description: 'Data de término do curso'
            },
            status: {
              type: 'string',
              enum: ['ativo', 'inativo', 'cancelado', 'concluido', 'planejamento'],
              description: 'Status atual do curso'
            },
            alunos: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'IDs dos alunos matriculados no curso'
            }
          }
        },
        Calendario: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do evento'
            },
            titulo: {
              type: 'string',
              description: 'Título do evento'
            },
            descricao: {
              type: 'string',
              description: 'Descrição detalhada do evento'
            },
            dataInicio: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de início do evento'
            },
            dataFim: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de término do evento'
            },
            tipo: {
              type: 'string',
              enum: ['academico', 'curso', 'avaliacao', 'reuniao', 'evento'],
              description: 'Tipo do evento'
            },
            curso: {
              type: 'string',
              description: 'ID do curso relacionado (se aplicável)'
            },
            local: {
              type: 'string',
              description: 'Local do evento'
            },
            criador: {
              type: 'string',
              description: 'ID do usuário que criou o evento'
            },
            cor: {
              type: 'string',
              description: 'Código de cor para o evento no calendário'
            }
          }
        },
        Relatorio: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do relatório'
            },
            titulo: {
              type: 'string',
              description: 'Título do relatório'
            },
            tipo: {
              type: 'string',
              enum: ['desempenho', 'frequencia', 'financeiro', 'academico'],
              description: 'Tipo do relatório'
            },
            periodo: {
              type: 'object',
              properties: {
                inicio: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data de início do período do relatório'
                },
                fim: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data de fim do período do relatório'
                }
              }
            },
            filtros: {
              type: 'object',
              description: 'Filtros aplicados ao gerar o relatório'
            },
            dados: {
              type: 'object',
              description: 'Dados gerados do relatório'
            },
            criador: {
              type: 'string',
              description: 'ID do usuário que criou o relatório'
            },
            status: {
              type: 'string',
              enum: ['pendente', 'processando', 'concluido', 'erro', 'arquivado'],
              description: 'Status atual do relatório'
            },
            formato: {
              type: 'string',
              enum: ['pdf', 'excel', 'csv', 'json'],
              description: 'Formato do relatório gerado'
            },
            dataCriacao: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do relatório'
            },
            dataAtualizacao: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização do relatório'
            }
          }
        },
        Chat: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do chat'
            },
            tipo: {
              type: 'string',
              enum: ['individual', 'grupo'],
              description: 'Tipo do chat'
            },
            nome: {
              type: 'string',
              description: 'Nome do chat (obrigatório para chats de grupo)'
            },
            participantes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'IDs dos usuários participantes do chat'
            },
            admin: {
              type: 'string',
              description: 'ID do usuário administrador do chat de grupo'
            },
            ultimaMensagem: {
              type: 'object',
              properties: {
                conteudo: {
                  type: 'string',
                  description: 'Conteúdo da última mensagem'
                },
                remetente: {
                  type: 'string',
                  description: 'ID do remetente da última mensagem'
                },
                dataEnvio: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data e hora de envio da última mensagem'
                }
              }
            },
            dataCriacao: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do chat'
            }
          }
        },
        Mensagem: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único da mensagem'
            },
            chat: {
              type: 'string',
              description: 'ID do chat ao qual a mensagem pertence'
            },
            remetente: {
              type: 'string',
              description: 'ID do usuário que enviou a mensagem'
            },
            tipo: {
              type: 'string',
              enum: ['texto', 'arquivo', 'sistema'],
              description: 'Tipo da mensagem'
            },
            conteudo: {
              type: 'string',
              description: 'Conteúdo textual da mensagem'
            },
            anexo: {
              type: 'object',
              properties: {
                originalname: {
                  type: 'string',
                  description: 'Nome original do arquivo'
                },
                filename: {
                  type: 'string',
                  description: 'Nome do arquivo no servidor'
                },
                mimetype: {
                  type: 'string',
                  description: 'Tipo MIME do arquivo'
                },
                path: {
                  type: 'string',
                  description: 'Caminho do arquivo no servidor'
                },
                size: {
                  type: 'integer',
                  description: 'Tamanho do arquivo em bytes'
                }
              }
            },
            dataEnvio: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de envio da mensagem'
            },
            lida: {
              type: 'boolean',
              description: 'Indica se a mensagem foi lida'
            },
            dataLeitura: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora em que a mensagem foi lida'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            code: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Erro na requisição'
            },
            stack: {
              type: 'string',
              example: 'Stack trace (apenas em ambiente de desenvolvimento)'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'sucesso'
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso é inválido ou expirou',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 'error',
                code: 401,
                message: 'Não autorizado. Token inválido ou expirado.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 'error',
                code: 404,
                message: 'Recurso não encontrado.'
              }
            }
          }
        },
        ValidationError: {
          description: 'Dados de entrada inválidos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 'error',
                code: 400,
                message: 'Dados de entrada inválidos.',
                detalhes: {
                  campo: ['Mensagem de erro para o campo']
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acesso negado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 'error',
                code: 403,
                message: 'Você não tem permissão para acessar este recurso.'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.resolve(__dirname, '../routes/*.js'),
    path.resolve(__dirname, '../app.js')
  ]
};

// Inicializar o swagger-jsdoc
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Exportar funções para configurar o Swagger no Express
module.exports = {
  swaggerSpec,
  
  // Função para configurar o middleware do Swagger UI
  setupSwagger: (app) => {
    // Servir a especificação Swagger como JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Configurar o Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "API de Administração Acadêmica - Documentação",
      customfavIcon: "/favicon.ico"
    }));

    console.log('Documentação Swagger disponível em /api-docs');
  }
};
