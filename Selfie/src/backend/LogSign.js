import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './UserModel.js'; // Assicurati che il percorso sia corretto
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import multer from 'multer';
import fs from 'fs';
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
  user: process.env.GMAIL_USER,
  pass: process.env.GMAIL_PASS,
},
});

const upload = multer({ dest: 'uploads/' }); // cartella temporanea per salvare i file

const userRoutes = express.Router();

// Middleware
userRoutes.use(cors());
userRoutes.use(express.json());

// Connessione MongoDB centralizzata in index.js (rimuoviamo connect locale)
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected (LogSign)'))
    .catch(err => console.error('MongoDB connection error (LogSign):', err));
}

// --- **DEVI AGGIUNGERE QUESTO MIDDLEWARE DI AUTENTICAZIONE QUI** ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Estrae il token dalla stringa "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: 'Accesso negato. Token non fornito.' });
  }

  // Verifica il token usando la stessa chiave segreta usata per firmare
  // IMPORTANTE: Utilizza process.env.JWT_SECRET o una stringa segreta SICURA E LUNGA
  jwt.verify(token, process.env.JWT_SECRET || 'tuasecretkey', (err, user) => {
    if (err) {
      console.error("Errore verifica token:", err);
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token scaduto. Effettua nuovamente il login.' });
      }
      return res.status(403).json({ message: 'Token non valido.' });
    }
    // Aggiunge i dati decodificati (userId, username, email, birthdate) a req.user
    req.user = user;
    next(); // Passa al prossimo middleware o alla rotta
  });
};
// --- FINE MIDDLEWARE DI AUTENTICAZIONE ---


// Signup route
userRoutes.post('/api/signup', upload.single('profileImage'), async (req, res) => {
  const { username, email, password, birthdate } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Utente o email già in uso' });
    }

    let profileImage = null;
    if (req.file) {
      profileImage = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype
      };
      // Elimina il file temporaneo dopo averlo letto
      fs.unlinkSync(req.file.path);
    }

    const newUser = new User({
      username,
      email,
      password,
      birthdate,
      profileImage
    });

    await newUser.save();

    const token = jwt.sign(
      {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        birthdate: newUser.birthdate
      },
      process.env.JWT_SECRET || 'tuasecretkey',
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, message: 'Registrazione avvenuta con successo!' });

    // Invia mail async, senza await così non blocca
    transporter.sendMail({
      from: '"Selfie" <noreply.selfieapp@gmail.com>',
      to: email,
      subject: "Benvenuto in Selfie!",
      text: `Ciao ${username}, grazie per esserti registrato su Selfie!`,
    }).catch(error => {
      console.error("Errore invio mail:", error);
    });

  } catch (error) {
    console.error("Errore creazione utente:", error);
    res.status(500).json({ message: 'Errore durante la creazione dell\'utente' });
  }
});



// Login route
userRoutes.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    // Per questo esempio, confronto diretto della password (NON SICURO PER LA PRODUZIONE)
    if (!user || user.password !== password) {
      // Modificato per inviare JSON come in altre rotte
      return res.status(400).json({ message: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        birthdate: user.birthdate
      },
      process.env.JWT_SECRET || 'tuasecretkey',
      { expiresIn: '1h' }
    );

    // Modificato per inviare JSON come in altre rotte
    res.status(200).json({ token, message: 'Login avvenuto con successo!' });
  } catch (error) {
    console.error("Errore login:", error); // Log dell'errore per il debug
    // Modificato per inviare JSON come in altre rotte
    res.status(500).json({ message: 'Errore durante il login' });
  }
});


userRoutes.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); 
    res.status(200).json({
      username: user.username,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Errore fetching dati:", error);
    res.status(500).json({ message: 'Errore durante il recupero dei dati' });
  }
});





userRoutes.put('/api/profile', authenticateToken, upload.single('profileImage'), async (req, res) => {
  const userId = req.user.userId;
  const { username, email } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    // Controlla se username o email sono già usati da altri
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username già in uso da un altro utente.' });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email già in uso da un altro utente.' });
      }
    }

    // Aggiorna username e email se presenti
    if (username) user.username = username;
    if (email) user.email = email;

    // Gestisci aggiornamento foto profilo
    if (req.file) {
      user.profileImage = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
      };
      // Rimuovi il file temporaneo dopo averlo letto
      fs.unlinkSync(req.file.path);
    }

    await user.save();

    // Rigenera token con i dati aggiornati
    const newToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        birthdate: user.birthdate
      },
      process.env.JWT_SECRET || 'tuasecretkey',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Profilo aggiornato con successo!',
      updatedUser: {
        username: user.username,
        email: user.email,
      },
      token: newToken
    });

  } catch (error) {
    console.error('Errore durante l\'aggiornamento del profilo:', error);
    res.status(500).json({ message: 'Errore interno del server durante l\'aggiornamento del profilo.' });
  }
});

userRoutes.get('/api/user/:id/image', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profileImage || !user.profileImage.data) {
      return res.status(404).send('Immagine non trovata');
    }
    res.contentType(user.profileImage.contentType);
    res.send(user.profileImage.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore nel recupero immagine');
  }
});


export default userRoutes;