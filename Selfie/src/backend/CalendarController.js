import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import CalendarEvent from './CalendarModel.js';  // Importa il modello degli eventi del calendario
import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode'; 

const calendarRoutes = express.Router();

// Middleware
calendarRoutes.use(cors());
calendarRoutes.use(express.json());

const mongoUri = 'mongodb+srv://selfie:selfie@cluster0.0jvaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri, {
})
  .then(() => {
    console.log('Connected to MongoDB, calendar');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

  calendarRoutes.post('/events', async (req, res) => {
    try {
      const event = new Event(req.body);
      await event.save();
      res.status(201).send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  });
  
  calendarRoutes.get('/events', async (req, res) => {
    try {
      const events = await Event.find({});
      res.send(events);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  calendarRoutes.patch('/events/:id', async (req, res) => {
    try {
      const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!event) {
        return res.status(404).send();
      }
      res.send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  });
  
  calendarRoutes.delete('/events/:id', async (req, res) => {
    try {
      const event = await Event.findByIdAndDelete(req.params.id);
      if (!event) {
        return res.status(404).send();
      }
      res.send(event);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  

export default calendarRoutes;
