
import express from 'express';
import cors from 'cors'
import mongoose from 'mongoose';
import TimeMachineInterface from '../TimeMachine/TimeMachineInterface.js';

const timeRoute = express.Router();
// Middleware
timeRoute.use(cors());
timeRoute.use(express.json());
timeRoute.use(express.json());

const timeMachine = TimeMachineInterface; // Inizializza l'istanza della Time Machine
const mongoUri = 'mongodb+srv://selfie:selfie@cluster0.0jvaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri, {})
    .then(() => {
    console.log('Connected to MongoDB, note');
})
    .catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// Endpoint per ottenere il tempo virtuale corrente
timeRoute.get('/api/gettime', (req, res) => {
  res.json({ time: timeMachine.getCurrentTime().toISOString() });
});

// Endpoint per impostare un nuovo tempo virtuale
timeRoute.post('/api/settime', (req, res) => {
  const { time } = req.body;
  timeMachine.setTime(new Date(time));
  res.json({ success: true, time: timeMachine.getCurrentTime().toISOString() });
});

// Endpoint per reimpostare il tempo reale di sistema
timeRoute.post('/api/time/reset', (req, res) => {
  timeMachine.resetToSystemTime();
  res.json({ success: true, time: timeMachine.getCurrentTime().toISOString() });
});

// Endpoint per avanzare il tempo di un determinato numero di millisecondi
timeRoute.post('/api/time/advance', (req, res) => {
  const { milliseconds } = req.body;
  timeMachine.advanceTime(milliseconds);
  res.json({ success: true, time: timeMachine.getCurrentTime().toISOString() });
});



export default timeRoute;