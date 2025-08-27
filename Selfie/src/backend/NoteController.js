import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Note from './NoteModel.js';
import jwt from 'jsonwebtoken';
import {jwtDecode } from "jwt-decode"; 
import TimeMachineInterface from '../TimeMachine/TimeMachineInterface.js';
import dotenv from 'dotenv';
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

const noteRoutes = express.Router();


// Middleware
noteRoutes.use(cors());
noteRoutes.use(express.json());

// Connessione MongoDB centralizzata in index.js


// Middleware per verificare il token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).send('Token mancante');
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tuasecretkey', (err, decoded) => {
    if (err) {
      return res.status(401).send('Token non valido');
    }

    // Salva il userId decodificato nella richiesta per uso successivo
    req.userId = decoded.userId;
    next();
  });
};



noteRoutes.post('/api/addnote', verifyToken, async (req, res) => {
  const { title, content, accessType, accessList, todos } = req.body;
  if (!title || !content) {
    return res.status(400).send('Title e contenuto sono obbligatori');
  }
  let safeAccessList = accessList;
  let username = null;
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
      const decodedToken = jwtDecode(token);
      username = decodedToken.username;
    }
  } catch {}
  if (accessType === 'limited' && username && !safeAccessList.includes(username)) {
    safeAccessList = [...safeAccessList, username];
  }
  try {
    const newNote = new Note({
      title,
      content,
      userId: req.userId,
      createdAt: TimeMachineInterface.getCurrentTime(),
      accessType: accessType,
      accessList: accessType === 'limited' ? safeAccessList : [],
      todos: todos || [],
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).send('Errore durante la creazione della nota');
  }
});


noteRoutes.put('/api/updatenote/:noteId', verifyToken, async (req, res) => {
  const { title, content, accessType, accessList, todos } = req.body;
  const { noteId } = req.params;

  if (!title || !content) {
    return res.status(400).send('Title e contenuto sono obbligatori');
  }
  let safeAccessList = accessList;
  let username = null;
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
      const decodedToken = jwtDecode(token);
      username = decodedToken.username;
    }
  } catch {}
  if (accessType === 'limited' && username && !safeAccessList.includes(username)) {
    safeAccessList = [...safeAccessList, username];
  }
  try {
    const note = await Note.findById(noteId);
    if (!note) {
      console.error(`Nota con ID ${noteId} non trovata`);
      return res.status(404).send('Nota non trovata');
    }

    if (note.userId.toString() !== req.userId) {
      console.error(`Utente non autorizzato. Nota userId: ${note.userId}, req.userId: ${req.userId}`);
      return res.status(403).send('Utente non autorizzato');
    }

    note.title = title;
    note.content = content;
    note.accessType = accessType;
    note.accessList = accessType === 'limited' ? safeAccessList : [];
    note.todos = todos || [];
    await note.save();

    res.status(200).json(note);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della nota:', error);
    res.status(500).send('Errore durante l\'aggiornamento, sucabene');
  }
});


noteRoutes.get('/api/getnotes', verifyToken, async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).send("Token non trovato");
  }
  let username;
  try {
    const decodedToken = jwtDecode(token);
    username = decodedToken.username;
  } catch (error) {
    return res.status(400).send("Errore nella decodifica del token");
  }
  try {
    let authorCondition = null;
    if (req.userId) {
      let id = req.userId;
      // Se è una stringa lunga 24 caratteri, prova a convertirla in ObjectId
      if (typeof id === 'string' && id.length === 24) {
        try {
          id = mongoose.Types.ObjectId(id);
        } catch {}
      }
      authorCondition = { userId: id };
    }
    const orConditions = [
      { accessType: 'public' },
      {
        accessType: 'limited',
        accessList: { $in: [username] }
      }
    ];
    if (authorCondition) {
      orConditions.unshift(authorCondition);
    }
    // Rimuovo i log di debug
    const notes = await Note.find({ $or: orConditions });
    res.status(200).json(notes);
  } catch (error) {
    console.error('Errore nel recupero delle note:', error);
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



noteRoutes.get('/api/users', verifyToken, async (req, res) => {
  try {
    // Recupera tutti gli utenti dal DB (scegli solo i campi _id e username)
    const users = await User.find({}, '_id username').exec();

    res.status(200).json(users);
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    res.status(500).send('Errore nel recupero degli utenti');
  }
});




export default noteRoutes;