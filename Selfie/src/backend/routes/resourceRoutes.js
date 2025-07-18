import express from 'express';
import { createResource, getResources, getResourceCalendar } from '../controllers/ResourceController.js';

const router = express.Router();

router.post('/', createResource);
router.get('/', getResources);
router.get('/:id/calendar', getResourceCalendar);

export default router; 