import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

// MongoDB connection
const mongoUri = 'mongodb://localhost:27017/selfie';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

// Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  birthdate: Date,
});

const User = mongoose.model('User', userSchema);

// Signup route
router.post('/api/signup', async (req, res) => {
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
    res.status(201).send('User created');
  } catch (error) {
    res.status(500).send('Error creating user');
  }
});

// Login route
router.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(400).send('Credenziali non valide');
    }

    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

// Fetch data route
router.get('/api/data', async (req, res) => {
  try {
    const data = await User.find({});
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

// Esporta il router per essere usato in index.js
export default router;
