export const getSwaggerOptions = () => ({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Organisation API',
      version: '1.0.0',
      description:
        'Simple API that interacts with a Neo4j database. It allows users to perform CRUD operations on the database, retrieving and managing information and relationships betweent the ogranisations users cost pools, responsibility areas, and properties. It performs a scheduled input (cronjob) every 24 hours fetching, adding, updating and deleting selected users from the Microsoft Active directory, trough the Microsoft Graph API.',
    },
    servers: [
      {
        url: process.env.SERVER_URL,
        description: 'Server',
      },
    ],
    components: {
      schemas: {
        UserProperties: {
          type: 'object',
          properties: {
            createdAt: {
              type: 'object',
              properties: {
                low: { type: 'number' },
                high: { type: 'number' },
              },
            },
            businessPhones: { type: 'array', items: { type: 'string' } },
            mail: { type: 'string' },
            mobilePhone: { type: 'string' },
            surname: { type: 'string' },
            displayName: { type: 'string' },
            companyName: { type: 'string' },
            employeeId: { type: 'string' },
            id: { type: 'string' },
            userPrincipalName: { type: 'string' },
            updatedAt: {
              type: 'object',
              properties: {
                low: { type: 'number' },
                high: { type: 'number' },
              },
            },
          },
        },
        JobTitleProperties: {
          type: 'object',
          properties: {
            createdAt: {
              type: 'object',
              properties: {
                low: { type: 'number' },
                high: { type: 'number' },
              },
            },
            title: { type: 'string' },
            updatedAt: {
              type: 'object',
              properties: {
                low: { type: 'number' },
                high: { type: 'number' },
              },
            },
          },
        },
        ResponsibilityAreaProperties: {
          type: 'object',
          properties: {
            responsibilityAreaNr: { type: 'string' },
          },
        },
        CostPoolProperties: {
          type: 'object',
          properties: {
            costPoolNr: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            neo4jId: {
              type: 'number',
              description:
                'Used by Neo4j internally to identify nodes and relationships. An auto-incrementing number and is not guaranteed to remain consistent over time',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Labels',
            },
            user_properties: {
              $ref: '#/components/schemas/UserProperties',
            },
            jobtitle_properties: {
              $ref: '#/components/schemas/JobTitleProperties',
            },
            responsibilityArea_properties: {
              $ref: '#/components/schemas/ResponsibilityAreaProperties',
            },
            costPool_properties: {
              $ref: '#/components/schemas/CostPoolProperties',
            },
          },
        },
        CostPool: {
          type: 'object',
          properties: {
            neo4jId: {
              type: 'number',
              description:
                'Used by Neo4j internally to identify nodes and relationships',
            },
            label: { type: 'string', description: 'CostPool label' },
            properties: {
              type: 'object',
              properties: {
                neo4jId: {
                  type: 'number',
                  description:
                    'Used by Neo4j internally to identify nodes and relationships',
                },
              },
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            neo4jId: { type: 'number', description: 'Property id' },
            property: { type: 'string', description: 'Property code' },
            name: { type: 'string', description: 'Property name' },
            costPool: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  neo4jId: {
                    type: 'number',
                    description:
                      'Used by Neo4j internally to identify nodes and relationships',
                  },
                },
              },
              description: 'Array of cost pools',
            },
            responsibilityArea: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  neo4jId: {
                    type: 'number',
                    description:
                      'Used by Neo4j internally to identify nodes and relationships',
                  },
                },
              },
              description: 'Array of responsibility areas',
            },
          },
        },
        ResponsibilityArea: {
          type: 'object',
          properties: {
            neo4jId: {
              type: 'number',
              description:
                'Used by Neo4j internally to identify nodes and relationships',
            },
            responsibilityArea: {
              type: 'string',
              description: 'Responsibility area code',
            },
            employeeId: { type: 'string', description: 'Employee Id' },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
  },
  apis: ['./src/routes/v1/*.ts'],
});
