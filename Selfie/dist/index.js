import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import userRoutes from './backend/LogSign.js';
import noteRoutes from './backend/NoteController.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8000; // Porta per il server Express

// URI MongoDB con credenziali
const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}?writeConcern=majority`;

const mongo = new MongoClient(mongoUri);

mongo.connect()
  .then(async () => {
    console.log('Connected to MongoDB with MongoClient');

    const db = mongo.db('selfie'); // Usa il database 'selfie'

    // Verifica se la collezione esiste, se no la crea
    const collections = await db.listCollections().toArray();
    if (!collections.some(col => col.name === 'dummyCollection')) {
      await db.createCollection('dummyCollection')
        .then(() => console.log('Collection created'))
        .catch(err => console.error('Error creating collection', err));
    } else {
      console.log('Collection already exists');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB with MongoClient', err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
//app.use('/api/notes', noteRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});