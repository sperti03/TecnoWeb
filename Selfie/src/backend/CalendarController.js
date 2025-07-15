import express from 'express';
import Event from './CalendarModel.js';
import { jwtDecode } from 'jwt-decode';
import userRoutes from './LogSign.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
/**
 * @typedef {Object} JwtPayload
 * @property {string} [iss] - Issuer
 * @property {string} [sub] - Subject
 * @property {string} [aud] - Audience
 * @property {number} [exp] - Expiration time
 * @property {number} [nbf] - Not before
 * @property {number} [iat] - Issued at
 * @property {string} [jti] - JWT ID
 */

/**
 * @typedef {JwtPayload} DecodedToken
 * @property {string} [username] - Aggiungi il campo username
 */

const CalendarRoutes = express.Router();


// Middleware
CalendarRoutes.use(cors());
CalendarRoutes.use(express.json());


// Connessione a MongoDB
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {
})
  .then(() => {
    console.log('Connected to MongoDB, calendar');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });


// Middleware per verificare il token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).send('Token mancante');
  }

  jwt.verify(token, 'tuasecretkey', (err, decoded) => {
    if (err) {
      return res.status(401).send('Token non valido');
    }

    // Salva il userId decodificato nella richiesta per uso successivo
    req.userId = decoded.userId;
    next();
  });
};


// GET /api/events - Recupera eventi per l'utente autenticato
CalendarRoutes.get('/', verifyToken, async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).send("Token non trovato");
  }

  // Decodifica il token per ottenere lo username
  let username;
  try {
    const decodedToken = jwtDecode(token);
    username = decodedToken.username; 
  } catch (error) {
    return res.status(400).send("Errore nella decodifica del token");
  }

  try {
    const events = await Event.find({
      $or: [
        { userId: req.userId }, // L'utente può vedere le proprie note
        { accessType: 'public' }, // Le note pubbliche possono essere viste da tutti
        { 
          accessType: 'limited', 
          limitedUsers: { $in: [username] } // L'utente può vedere le note limitate se è nella lista
        }
      ] 
    });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/events - Crea un evento per l'utente autenticato
CalendarRoutes.post('/', verifyToken, async (req, res) => {
  const { title, start, end, notificationLeadTime, repeatInterval, eventType, studyCycleId } = req.body;

  try {
    if (!title || !start || !end) {
      return res.status(400).json({ message: 'Title, start, and end are required.' });
    }

    const newEvent = new Event({
      title,
      start,
      end,
      userId: req.userId,
      notificationLeadTime,
      repeatInterval,
      eventType: eventType || 'general',
      studyCycleId: studyCycleId || undefined
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Rotta per aggiungere un evento dal to-do di una nota
CalendarRoutes.post('/api/addcalendar', verifyToken, async (req, res) => {
  const { title, description, date } = req.body;
  if (!title || !date) {
    return res.status(400).json({ message: 'Title e date sono obbligatori.' });
  }
  try {
    const newEvent = new Event({
      title,
      start: new Date(date),
      end: new Date(date),
      userId: req.userId,
      notificationLeadTime: 0,
      repeatInterval: 0,
      description: description || '',
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event from note todo:', error);
    res.status(500).json({ message: 'Failed to create event from note todo' });
  }
});

// DELETE /api/events/:id - Elimina un evento dell'utente autenticato
CalendarRoutes.delete('/:id', userRoutes, async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findOneAndDelete({ _id: id, userId: req.userId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

export default CalendarRoutes;
