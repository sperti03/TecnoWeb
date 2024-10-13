import express from 'express';
import { MongoClient } from 'mongodb';
import router from './src/backend/server.js'; // Assicurati che il percorso sia corretto

const app = express();
const port = 8000; // Porta per il server Express

// Connessione a MongoDB tramite MongoClient
const mongouri = 'mongodb://localhost:27017/selfie';

const mongo = new MongoClient(mongouri);

mongo.connect()
  .then(() => {
    console.log('Connected to MongoDB with MongoClient');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB with MongoClient', err);
  });

app.use(express.json());

// Usa il router importato da server.js
app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});