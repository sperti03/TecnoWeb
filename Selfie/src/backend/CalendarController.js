import express from 'express';
import Event from './CalendarModel.js';
import { jwtDecode } from 'jwt-decode';
import userRoutes from './LogSign.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from './UserModel.js';
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
        { userId: req.userId },
        { users: { $in: [username] } }, // Mostra eventi dove l'utente è invitato
        { accessType: 'public' },
        { 
          accessType: 'limited', 
          limitedUsers: { $in: [username] }
        }
      ] 
    });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});
CalendarRoutes.get('/me', verifyToken, async (req, res) => {
    try {
        // Recupera l'utente dal database usando req.userId
        // Oppure, se nel token hai già la mail, puoi decodificarla direttamente
        const token = req.headers['authorization']?.split(' ')[1];
        const decoded = jwtDecode(token);
        // Se la mail è nel token:
        if (decoded.email) {
            return res.json({ email: decoded.email });
        }
        // Altrimenti, recupera l'utente dal database (esempio con username)
        // const user = await User.findOne({ username: decoded.username });
        // if (user) return res.json({ email: user.email });
        return res.status(404).json({ error: 'Email non trovata' });
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dati utente' });
    }
});


CalendarRoutes.post('/send-event-mail', async (req, res) => {
  const { to, event } = req.body;
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply.selfieapp@gmail.com',
        pass: 'selfieappbygiucaefabio',
      },
    });

    const mailText = `
      Hai un nuovo evento in calendario!
      Titolo: ${event.title}
      Inizio: ${event.start}
      Fine: ${event.end}
      Note: ${event.description || 'Nessuna'}
    `;

    await transporter.sendMail({
      from: '"Calendario" <tuamail@gmail.com>',
      to,
      subject: `Promemoria evento: ${event.title}`,
      text: mailText,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore invio email' });
  }
});


// POST /api/events - Crea un evento per l'utente autenticato
CalendarRoutes.post('/', verifyToken, async (req, res) => {
  const { title, start, end, notificationLeadTime, repeatInterval, users } = req.body;

  try {
    if (!title || !start || !end) {
      return res.status(400).json({ message: 'Title, start, and end are required.' });
    }

    // Costruisci la lista di tutti gli utenti: creatore + invitati (evita duplicati)
    let allUsers = Array.isArray(users) ? users.map(u => u.trim()).filter(u => u) : [];

    // Ottieni l'ObjectId del creatore
    const creatorId = req.userId;

    // Trova gli ObjectId degli invitati tramite email
    const invitedUserDocs = await User.find({ email: { $in: allUsers } });
    const invitedUserIds = invitedUserDocs.map(u => u._id.toString());

    // Unisci il creatore e gli invitati (evita duplicati)
    let allUserIds = [creatorId, ...invitedUserIds.filter(id => id !== String(creatorId))];

    // Crea un evento per ogni utente
    const eventsToSave = allUserIds.map(userId => new Event({
      title,
      start,
      end,
      userId,
      notificationLeadTime,
      repeatInterval,
    }));

    // Salva tutti gli eventi
    const savedEvents = await Event.insertMany(eventsToSave);
    res.status(201).json(savedEvents);
  } catch (error) {
    console.error('Error creating events:', error);
    res.status(500).json({ message: 'Failed to create events' });
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
