import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import User from './UserModel.js';
import Note from './NoteModel.js';


const noteRoutes = express.Router();


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




// Rotta per aggiungere una nuova nota per un utente
noteRoutes.post('/api/addnote', async (req, res) => {
  const { userId, title, content } = req.body;  

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const newNote = new Note({
      title,
      content,
      user: user._id,  // Associa la nota all'utente
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione della nota', error });
  }
});


noteRoutes.get('/api/getnotes', async (req, res) => {
  const { userId } = req.query;  

  try {
    const notes = await Note.find({ user: userId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle note', error });
  }
});

// Rotta per aggiornare una nota esistente
noteRoutes.put('/api/updatenote', async (req, res) => {
  const { noteId, userId } = req.body; 
  const { title, content } = req.body;

  try {
    const note = await Note.findOneAndUpdate(
      { _id: noteId, user: userId },  // Verifica che la nota appartenga all'utente
      { title, content, updatedAt: new Date() },
      { new: true }  // Ritorna la nota aggiornata
    );

    if (!note) {
      return res.status(404).json({ message: 'Nota non trovata o non autorizzato' });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella modifica della nota', error });
  }
});

// Rotta per cancellare una nota
noteRoutes.delete('/api/deletenote', async (req, res) => {
  const { noteId, userId } = req.body;

  try {
    const note = await Note.findOneAndDelete({ _id: noteId, user: userId });
    if (!note) {
      return res.status(404).json({ message: 'Nota non trovata o non autorizzato' });
    }
    res.status(200).json({ message: 'Nota eliminata' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella cancellazione della nota', error });
  }
});




export default noteRoutes;