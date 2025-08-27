import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

// Import controllers
import studyCycleRoutes from './StudyCycleController.js';
import invitationRoutes from './InvitationController.js';
import messageRoutes from './MessageController.js';
import noteRoutes from './NoteController.js';
import CalendarRoutes from './CalendarController.js';
import router from './SessionController.js';
import timeRoute from './TimeMachineController.js';
import userRoutes from './LogSign.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/study-cycles', studyCycleRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/events', CalendarRoutes);
app.use('/api/sessions', router);
app.use('/api/timemachine', timeRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
