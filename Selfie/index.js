import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import userRoutes from './src/backend/LogSign.js'
import noteRoutes from './src/backend/NoteController.js';
import calendarRoutes from './src/backend/CalendarController.js';
const app = express();
const port = 5000; // Porta per il server Express


// URI MongoDB 
const mongoUri = 'mongodb+srv://selfie:selfie@cluster0.0jvaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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
app.use('/',calendarRoutes);


app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});