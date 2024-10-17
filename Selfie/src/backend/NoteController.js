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

noteRoutes.put('/api/updatenote/:noteId', verifyToken, async (req, res) => {
  const { title, content } = req.body;
  const { noteId } = req.params;

  if (!title || !content) {
    return res.status(400).send('Title e contenuto sono obbligatori');
  }

  try {

    const note = await Note.findById(noteId);
    if (!note) {
      console.error(`Nota con ID ${noteId} non trovata`);
      return res.status(404).send('Nota non trovata');
    }

    // Verifico che la nota appartenga all'utente autenticato
    if (note.userId.toString() !== req.userId) {
      console.error(`Utente non autorizzato. Nota userId: ${note.userId}, req.userId: ${req.userId}`);
      return res.status(403).send('Utente non autorizzato');
    }

    note.title = title;
    note.content = content;
    await note.save();

    res.status(200).json(note);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della nota:', error);
    res.status(500).send('Errore durante l\'aggiornamento, sucabene');
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



noteRoutes.delete('/api/deletenote/:noteId', verifyToken, async (req, res) => {
  const { noteId } = req.params;

  try {
    await Note.findByIdAndDelete(noteId)
    res.status(200).send('Eliminata con successo');
  } catch (error) {
    console.error('Errore durante l\'eliminazione della nota:', error);
    res.status(500).send('Errore durante l\'eliminazione');
  }
});






export default noteRoutes;