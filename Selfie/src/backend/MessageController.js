import express from 'express';
import mongoose from 'mongoose';
import Message from "./MessageModel.js";
import jwt from 'jsonwebtoken';
import cors from 'cors';
import {jwtDecode } from "jwt-decode"; // Importa jwt-decode e JwtPayload
import User from './UserModel.js';
import dotenv from 'dotenv';
dotenv.config();

const messageRoutes = express.Router();


// Middleware
messageRoutes.use(cors());
messageRoutes.use(express.json());

// Connessione a MongoDB
const mongoUri = process.env.MONGO_URI;
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
      req.username = decoded.username;
      next();
    });
  };

  messageRoutes.post('/api/sendmessage', verifyToken, async (req, res) => {
    const { content, dest } = req.body;  // Ricevi il contenuto e lo username del destinatario
    const senderId = req.userId;  // Prendi il senderId dal token JWT
    const username= req.username;
    if (!content || !dest) {
      return res.status(400).send('Destinatario (username) e contenuto sono obbligatori');
    }
  
    try {
      const destUser = await User.findOne({ username: dest });
  
      if (!destUser) {
        return res.status(404).send('Destinatario non trovato');
      }
  
      const destId = destUser._id;  // Ottieni l'ID del destinatario
  
      // Verifica che gli ID siano validi ObjectId
      if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(destId)) {
        return res.status(400).send('ID non valido');
      }
  
      // Crea il nuovo messaggio
      const newMessage = new Message({
        content,
        senderId,
        destId,
        username,
      });
  
      // Salva il messaggio nel database
      await newMessage.save();
      res.status(201).json(newMessage);
  
    } catch (error) {
      console.error('Errore nel server:', error);
      res.status(500).send('Errore durante la creazione del messaggio');
    }
  });

messageRoutes.get('/api/getmessages', verifyToken, async (req, res) => {
    try {
      // Trova i messaggi destinati all'utente loggato e popola l'username del mittente
      const messages = await Message.find({ destId: req.userId }); 
      res.status(200).json(messages);
    } catch (error) {
      console.error('Errore nel recupero dei messaggi:', error);
      res.status(500).send('Errore nel recupero dei messaggi');
    }
  });
  

export default messageRoutes;