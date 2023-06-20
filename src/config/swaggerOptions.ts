export const getSwaggerOptions = () => ({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API Information',
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
            createdAt: { type: 'string' },
            businessPhones: { type: 'array', items: { type: 'string' } },
            mail: { type: 'string' },
            mobilePhone: { type: 'string' },
            surname: { type: 'string' },
            displayName: { type: 'string' },
            companyName: { type: 'string' },
            employeeId: { type: 'string' },
            id: { type: 'string' },
            userPrincipalName: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        JobTitleProperties: {
          type: 'object',
          properties: {
            createdAt: { type: 'string' },
            title: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        ResponsibilityAreaProperties: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        CostPoolProperties: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'User id',
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
            id: { type: 'string', description: 'CostPool id' },
            label: { type: 'string', description: 'CostPool label' },
            properties: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Properties id' },
              },
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Property id' },
            property: { type: 'string', description: 'Property code' },
            name: { type: 'string', description: 'Property name' },
            costPool: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'CostPool id' },
                },
              },
              description: 'Array of cost pools',
            },
            responsibilityArea: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Responsibility Area id' },
                },
              },
              description: 'Array of responsibility areas',
            },
          },
        },
        ResponsibilityArea: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Responsibility area id' },
            responsibilityArea: {
              type: 'string',
              description: 'Responsibility area code',
            },
            employeeId: { type: 'string', description: 'Employee Id' },
            jobTitle: { type: 'string', description: 'Job Title' },
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
