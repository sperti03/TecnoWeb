import express from 'express';
import { createEvent, getEvents, deleteEvent, respondInvite, exportICS } from '../controllers/EventController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // Middleware di autenticazione abilitato

router.post('/', createEvent);
router.get('/', getEvents);
router.delete('/:id', deleteEvent);
router.post('/:id/respond', respondInvite);
router.get('/export', exportICS);

export default router; 