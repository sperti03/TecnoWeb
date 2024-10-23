import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import User from './UserModel.js';
import Note from './NoteModel.js';
import jwt from 'jsonwebtoken';
import {jwtDecode } from "jwt-decode"; // Importa jwt-decode e JwtPayload


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

const noteRoutes = express.Router();


// Middleware
noteRoutes.use(cors());
noteRoutes.use(express.json());

// Connessione a MongoDB
const mongoUri = 'mongodb+srv://selfie:selfie@cluster0.0jvaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
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



noteRoutes.post('/api/addnote', verifyToken, async (req, res) => {
  const { title, content, accessType, limitedUsers } = req.body;

  if (!title || !content) {
    return res.status(400).send('Title e contenuto sono obbligatori');
  }

  try {
    const newNote = new Note({
      title,
      content,
      userId: req.userId, // Associamo la nota all'utente autenticato
      accessType: accessType,
      limitedUsers: accessType === 'limited' ? limitedUsers : [],
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


noteRoutes.get('/api/getnotes', verifyToken, async (req, res) => {
   // Recupera il token dall'header di autorizzazione
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
    const notes = await Note.find({ 
      $or: [
        { userId: req.userId }, // L'utente può vedere le proprie note
        { accessType: 'public' }, // Le note pubbliche possono essere viste da tutti
        { 
          accessType: 'limited', 
          limitedUsers: { $in: [username] } // L'utente può vedere le note limitate se è nella lista
        }
      ] 
    });
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