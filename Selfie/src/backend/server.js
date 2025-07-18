import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import eventRoutes from './routes/eventRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import verifyToken from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connesso'))
  .catch(err => console.error('Errore connessione MongoDB', err));

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server avviato sulla porta ${PORT}`)); 