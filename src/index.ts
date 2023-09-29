import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import userRoutes from './routes/v1/userRoutes';
import costPoolRoutes from './routes/v1/costPoolRoutes';
import responsibilityAreasRoutes from './routes/v1/responsibilityAreasRoutes';
import propertiesRoutes from './routes/v1/propertiesRoutes';
import auth from './middleware/auth';
import cors from 'cors';
import { scheduleJobs } from './scheduler/cronJob';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { getSwaggerOptions } from './config/swaggerOptions';
import { errorHandler } from './middleware/error-handler';
import { updateUsers } from './services/userService';

const app = express();

// Swagger setup
const swaggerOptions = getSwaggerOptions();
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// endpoint for serving Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

// Middleware
app.use(express.json());
app.use(cors());

// Use the auth middleware
app.use(auth);

// Use the error handler middleware
app.use(errorHandler);

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/costpools', costPoolRoutes);
app.use('/api/v1/responsibilityareas', responsibilityAreasRoutes);
app.use('/api/v1/properties', propertiesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);

  try {
    await updateUsers();
    console.log('Users updated successfully on start.');
  } catch (error) {
    console.error('Failed to update users on start:', error);
  }

  scheduleJobs(); // Schedules the job to run at midnight every day.
});
