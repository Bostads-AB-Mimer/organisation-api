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
import { errorHandler } from './middleware/error-handler';
//import { updateUsers } from './services/userService';

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);

// Use the auth middleware
app.use(auth);

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/costpools', costPoolRoutes);
app.use('/api/v1/responsibilityareas', responsibilityAreasRoutes);
app.use('/api/v1/properties', propertiesRoutes);

// use the error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  // <-- Note the async
  console.log(`Server started on port ${PORT}`);
  // await updateUsers(); // Runs immediately when the server starts.
  scheduleJobs(); // Schedules the job to run at midnight every day.
});
