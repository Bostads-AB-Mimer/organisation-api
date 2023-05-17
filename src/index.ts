import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import userRoutes from './routes/userRoutes';
import costPoolRoutes from './routes/costPoolRoutes';
import responsibilityAreasRoutes from './routes/responsibilityAreasRoutes';
import propertiesRoutes from './routes/propertiesRoutes';
import auth from './middleware/auth';
const app = express();

// Middleware
app.use(express.json());

// Use the auth middleware
app.use(auth);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/costpools', costPoolRoutes);
app.use('/api/responsibilityareas', responsibilityAreasRoutes);
app.use('/api/properties', propertiesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
