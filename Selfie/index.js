import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import userRoutes from './src/backend/LogSign.js'
import noteRoutes from './src/backend/NoteController.js';

const app = express();
const port = 8000; // Porta per il server Express

// URI MongoDB 
const mongoUri = 'mongodb://localhost:27017/selfie';

const mongo = new MongoClient(mongoUri);

mongo.connect()
  .then(async () => {
    console.log('Connected to MongoDB with MongoClient');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB with MongoClient', err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', userRoutes);
app.use('/',noteRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});