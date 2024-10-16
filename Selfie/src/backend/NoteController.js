import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import User from './UserModel.js';
import Note from './NoteModel.js';
import jwt from 'jsonwebtoken';


const noteRoutes = express.Router();


// Middleware
noteRoutes.use(cors());
noteRoutes.use(express.json());

// Connessione a MongoDB
const mongoUri = 'mongodb://localhost:27017/selfie';
mongoose.connect(mongoUri, {
})
  .then(() => {
    console.log('Connected to MongoDB, note');
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


// Route per creare una nuova nota
noteRoutes.post('/api/addnote', verifyToken, async (req, res) => {
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).send('Title e contenuto sono obbligatori');
  }

  try {
    const newNote = new Note({
      title,
      content,
      userId: req.userId, // Associamo la nota all'utente autenticato
    });

    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).send('Errore durante la creazione della nota');
  }
});

// Route per ottenere le note di un utente autenticato
noteRoutes.get('/api/getnotes', verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }); // Filtra le note per userId
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).send('Errore nel recupero delle note');
  }
});






export default noteRoutes;