/**
 * API Documentation Generator
 *
 * Generates OpenAPI 3.0 specification for the application's REST API.
 * This can be used with Swagger UI or other API documentation tools.
 */

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
  security?: Array<Record<string, string[]>>;
}

/**
 * Generate OpenAPI specification for the API
 */
export function generateOpenAPISpec(): OpenAPISpec {
  return {
    openapi: '3.0.0',
    info: {
      title: 'DocHub API',
      version: '1.0.0',
      description: 'RESTful API for document management, collaboration, and GitHub integration',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
        url: 'https://github.com/your-repo',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://your-domain.com/api',
        description: 'Production server',
      },
    ],
    paths: {
      '/documents': {
        get: {
          summary: 'List documents',
          description: 'Get all documents in user workspaces',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'workspaceId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by workspace ID',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search documents by title or content',
            },
          ],
          responses: {
            '200': {
              description: 'List of documents',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      documents: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Document' },
                      },
                    },
                  },
                },
              },
            },
            '401': { description: 'Unauthorized' },
          },
        },
        post: {
          summary: 'Create document',
          description: 'Create a new document in a workspace',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'workspaceId'],
                  properties: {
                    title: { type: 'string', minLength: 1 },
                    content: { type: 'string' },
                    workspaceId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Document created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Document' },
                },
              },
            },
            '400': { description: 'Invalid request' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/documents/{id}': {
        get: {
          summary: 'Get document',
          description: 'Get a specific document by ID',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Document details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Document' },
                },
              },
            },
            '404': { description: 'Document not found' },
          },
        },
        put: {
          summary: 'Update document',
          description: 'Update document content or metadata',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Document updated' },
            '404': { description: 'Document not found' },
            '409': { description: 'Document locked by another user' },
          },
        },
        delete: {
          summary: 'Delete document',
          description: 'Permanently delete a document',
          tags: ['Documents'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Document deleted' },
            '404': { description: 'Document not found' },
          },
        },
      },
      '/documents/{id}/versions': {
        get: {
          summary: 'List versions',
          description: 'Get all versions of a document',
          tags: ['Versions'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'List of versions',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Version' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create version',
          description: 'Save current document state as a new version',
          tags: ['Versions'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Version created' },
          },
        },
      },
      '/workspaces': {
        get: {
          summary: 'List workspaces',
          description: 'Get all workspaces user has access to',
          tags: ['Workspaces'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of workspaces',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Workspace' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create workspace',
          description: 'Create a new workspace',
          tags: ['Workspaces'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Workspace created' },
          },
        },
      },
      '/github/sync': {
        post: {
          summary: 'Sync with GitHub',
          description: 'Sync document with GitHub repository',
          tags: ['GitHub'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['documentId', 'repository', 'path'],
                  properties: {
                    documentId: { type: 'string' },
                    repository: { type: 'string' },
                    path: { type: 'string' },
                    branch: { type: 'string', default: 'main' },
                    commitMessage: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Sync successful' },
            '401': { description: 'GitHub not connected' },
          },
        },
      },
    },
    components: {
      schemas: {
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            workspaceId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            authorId: { type: 'string' },
            isLocked: { type: 'boolean' },
            lockedBy: { type: 'string', nullable: true },
          },
        },
        Version: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            documentId: { type: 'string' },
            content: { type: 'string' },
            label: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            authorId: { type: 'string' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            ownerId: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'NextAuth session token',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  };
}

/**
 * Convert OpenAPI spec to JSON string
 */
export function getOpenAPIJSON(): string {
  return JSON.stringify(generateOpenAPISpec(), null, 2);
}

/**
 * Convert OpenAPI spec to YAML string
 */
export function getOpenAPIYAML(): string {
  const spec = generateOpenAPISpec();

  // Simple YAML converter (for production, use a library like js-yaml)
  const yaml = (obj: Record<string, unknown>, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    let result = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        result += `${spaces}${key}:\n${yaml(value as Record<string, unknown>, indent + 1)}`;
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            result += `${spaces}- \n${yaml(item as Record<string, unknown>, indent + 2)}`;
          } else {
            result += `${spaces}- ${item}\n`;
          }
        });
      } else {
        result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return result;
  };

  return yaml(spec as unknown as Record<string, unknown>);
}
