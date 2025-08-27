import 'dotenv/config';
import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import userRoutes from '../src/backend/LogSign.js'
import noteRoutes from '../src/backend/NoteController.js';
import CalendarRoutes from '../src/backend/CalendarController.js';
import messageRoutes from '../src/backend/MessageController.js'
import timeMachineRoutes from '../src/backend/TimeMachineController.js'
import studyCycleRoutes from '../src/backend/StudyCycleController.js'
import invitationRoutes from '../src/backend/InvitationController.js'
import sessionRoutes from '../src/backend/SessionController.js'
import projectRoutes from '../src/backend/ProjectController.js'
const app = express();
const port = 8000; // Porta per il server Express


// URI MongoDB 
// const mongoUri = 'mongodb+srv://selfie:selfie@cluster0.0jvaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const mongoUri = process.env.MONGO_URI;
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
app.use('/',CalendarRoutes);  // Rimosso '/api/events' perché già incluso in CalendarController
app.use('/', messageRoutes);
app.use('/api/timemachine', timeMachineRoutes);
app.use('/api/study-cycles', studyCycleRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/', projectRoutes);


app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});