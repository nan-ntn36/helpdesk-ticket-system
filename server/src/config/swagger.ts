import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from './env';

const swaggerDefinition: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Helpdesk Ticket System API',
      version: '1.0.0',
      description: 'REST API documentation for the Helpdesk Ticket Management System',
    },
    servers: [
      {
        url: `/api`,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token (JWT) — pass in Authorization header',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token stored in HttpOnly cookie',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/modules/**/routes.ts',
    './src/modules/**/schema.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerDefinition);

export function setupSwagger(app: Express): void {
  if (env.NODE_ENV === 'development') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Helpdesk API Docs',
    }));

    // Endpoint to get raw JSON spec
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }
}
