import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import User from './UserModel.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();

const userRoutes = express.Router();


// Middleware
userRoutes.use(cors());
userRoutes.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {

})
  .then(() => {
    console.log('Connected to MongoDB, logsign');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });



// Signup route
userRoutes.post('/api/signup', async (req, res) => {
  const { username, email, password, birthdate } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).send('Utente o email già in uso');
    }

    const newUser = new User({
      username,
      email,
      password,
      birthdate,
    });

    await newUser.save();

    // Genera un token JWT con l'ID dell'utente
    const token = jwt.sign({ userId: newUser._id, username: newUser.username }, 'tuasecretkey', { expiresIn: '1h' });

    // Restituisce il token al client
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).send('Error creating user');
  }
});


// Login route
userRoutes.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(400).send('Credenziali non valide');
    }

    // Genera un token JWT con l'ID dell'utente
    const token = jwt.sign({ userId: user._id, username: user.username }, 'tuasecretkey', { expiresIn: '1h' });

    // Restituisce il token al client
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).send('Error logging in :(');
  }
});

// Fetch data route
userRoutes.get('/api/data', async (req, res) => {
  try {
    const data = await User.find({});
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});


export default userRoutes;
