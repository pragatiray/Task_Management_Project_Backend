// src/swagger.js
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management API",
      version: "1.0.0",
      description: "API documentation for Task Management Project",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Task: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64fbcf1234abcd5678ef9012" },
            title: { type: "string", example: "Prepare campaign brief" },
            description: { type: "string", example: "Create full campaign plan" },
            status: { type: "string", example: "pending" },
            priority: { type: "string", example: "high" },
            dueDate: { type: "string", example: "2026-04-05" },
            createdBy: { type: "string", example: "69d0c42604d362a5a581148d" },
            assignedTo: { type: "string", example: "69d0c42604d362a5a581148d" }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/routes/*.js"]
};

const specs = swaggerJsDoc(options);

export const swaggerDocs = (app, port) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
};