import express from 'express';
import Event from './CalendarModel.js';
import { jwtDecode } from 'jwt-decode';
import userRoutes from './LogSign.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
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

const CalendarRoutes = express.Router();


// Middleware
CalendarRoutes.use(cors());
CalendarRoutes.use(express.json());


// Connessione a MongoDB
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {
})
  .then(() => {
    console.log('Connected to MongoDB, calendar');
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
    next();
  });
};


// GET /api/events - Recupera eventi per l'utente autenticato
CalendarRoutes.get('/api/events', verifyToken, async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).send("Token non trovato");
  }

  // Decodifica il token per ottenere lo username
  let username;
  try {
    const decodedToken = jwtDecode(token);
    username = decodedToken.username; 
  } catch (error) {
    return res.status(400).send("Errore nella decodifica del token");
  }

  try {
    // Con la logica semplificata, ogni utente vede solo i propri eventi
    // (che includono quelli condivisi con lui, perché sono stati creati per lui)
    let query = { userId: req.userId };
    
    // Filtra per eventi dalle note se richiesto
    const fromNotes = req.query.fromNotes === 'true';
    if (fromNotes) {
      query.eventType = 'note-todo';
    }
    
    // Filtra per studyCycleId se richiesto
    const studyCycleId = req.query.studyCycleId;
    if (studyCycleId) {
      query.studyCycleId = studyCycleId;
    }
    
    const events = await Event.find(query);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/events - Crea un evento per l'utente autenticato
CalendarRoutes.post('/api/events', verifyToken, async (req, res) => {
  const { 
    title, start, end, description, notificationLeadTime, repeatInterval, 
    eventType, studyCycleId, participants = [], createdByEmail = '', 
    projectEventData, category, priority, color, location, studyCycleData 
  } = req.body;

  try {
    if (!title || !start || !end) {
      console.log('Missing required fields:', { title: !!title, start: !!start, end: !!end });
      return res.status(400).json({ message: 'Title, start, and end are required.' });
    }

    // Validate and convert dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('Invalid date format:', { start, end });
      return res.status(400).json({ message: 'Invalid date format for start or end.' });
    }

    console.log('=== CREATING EVENT ===');
    console.log('Event title:', title);
    console.log('Event start:', start, typeof start);
    console.log('Event end:', end, typeof end);
    console.log('Event type:', eventType);
    console.log('Study cycle ID:', studyCycleId);
    console.log('Study cycle data:', studyCycleData);
    console.log('Participants emails:', participants);
    console.log('Creator userId:', req.userId);
    console.log('Full request body:', req.body);

    // Associa email a userId se esiste
    const participantsWithIds = await Promise.all(
      participants.map(async (email) => {
        const user = await User.findOne({ email });
        console.log(`Participant ${email}: ${user ? 'found' : 'not found'} in database`);
        return { email, userId: user ? user._id : undefined };
      })
    );

    // Filtra solo gli utenti esistenti + il creatore
    const validParticipantIds = participantsWithIds
      .filter(p => p.userId)
      .map(p => p.userId);
    
    const allUserIds = [req.userId, ...validParticipantIds];
    const uniqueUserIds = [...new Set(allUserIds.map(id => id.toString()))]; // Rimuovi duplicati
    
    console.log('Valid participant user IDs:', validParticipantIds);
    console.log('All unique user IDs for event creation:', uniqueUserIds);

    const createdEvents = [];
    for (const userId of uniqueUserIds) {
      const newEvent = new Event({
        title,
        description: description || '',
        start: startDate,
        end: endDate,
        userId,
        notificationLeadTime: notificationLeadTime || 0,
        repeatInterval: repeatInterval || 0,
        eventType: eventType || 'general',
        studyCycleId: studyCycleId || undefined,
        studyCycleData: studyCycleData || undefined,
        participants: participantsWithIds,
        createdByEmail,
        projectEventData: projectEventData || undefined,
        isProjectEvent: !!projectEventData,
        category: category || 'personal',
        priority: priority || 'medium',
        color: color || '#4caf50',
        location: location || '',
      });
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      console.log(`Event created for user ${userId}:`, savedEvent._id);
    }

    // Invio email ai partecipanti esistenti
    const emailsSent = [];
    const emailsNotFound = [];
    
    if (participantsWithIds && participantsWithIds.length > 0) {
      try {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        for (const p of participantsWithIds) {
          if (p.userId) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: p.email,
              subject: `📅 Invito a evento: ${title}`,
              html: `
                <h2>🎉 Sei stato invitato a un evento!</h2>
                <p><strong>Evento:</strong> ${title}</p>
                <p><strong>Descrizione:</strong> ${description || 'Nessuna descrizione'}</p>
                <p><strong>Data:</strong> ${new Date(start).toLocaleDateString('it-IT')}</p>
                <p><strong>Orario:</strong> ${new Date(start).toLocaleTimeString('it-IT')} - ${new Date(end).toLocaleTimeString('it-IT')}</p>
                ${location ? `<p><strong>Luogo:</strong> ${location}</p>` : ''}
                <p>L'evento è stato aggiunto automaticamente al tuo calendario Selfie.</p>
                <p>Accedi alla piattaforma per vedere tutti i dettagli.</p>
              `,
            });
            emailsSent.push(p.email);
            console.log(`Email sent to: ${p.email}`);
          } else {
            emailsNotFound.push(p.email);
            console.log(`User not found for email: ${p.email}`);
          }
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
      }
    }

    // Prepara risposta con informazioni dettagliate
    const response = {
      event: createdEvents[0], // Evento del creatore
      participantsInfo: {
        totalRequested: participants.length,
        eventsCreated: createdEvents.length,
        emailsSent: emailsSent.length,
        emailsNotFound: emailsNotFound,
        successfulParticipants: emailsSent
      },
      message: `Evento creato per ${createdEvents.length} utenti`
    };

    if (emailsNotFound.length > 0) {
      response.message += `. Attenzione: ${emailsNotFound.length} email non corrispondono a utenti registrati: ${emailsNotFound.join(', ')}`;
    }

    console.log('Event creation completed:', response.participantsInfo);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// GET /api/events/statistics - Recupera statistiche eventi per l'utente autenticato
CalendarRoutes.get('/api/events/statistics', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calcola statistiche base
    const totalEvents = await Event.countDocuments({ userId });
    const recurringEvents = await Event.countDocuments({ userId, isRecurring: true });
    const projectEvents = await Event.countDocuments({ userId, eventType: 'project' });
    const studyCycleEvents = await Event.countDocuments({ userId, eventType: 'study-cycle' });
    const noteEvents = await Event.countDocuments({ userId, eventType: 'note-todo' });
    
    // Eventi questo mese
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    
    const eventsThisMonth = await Event.countDocuments({
      userId,
      start: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    // Eventi questa settimana
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    const eventsThisWeek = await Event.countDocuments({
      userId,
      start: { $gte: startOfWeek, $lt: endOfWeek }
    });
    
    // Aggregazione per categoria
    const eventsByCategory = await Event.aggregate([
      { $match: { userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Aggregazione per priorità
    const eventsByPriority = await Event.aggregate([
      { $match: { userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Aggregazione per tipo evento
    const eventsByType = await Event.aggregate([
      { $match: { userId } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const statistics = {
      totalEvents,
      recurringEvents,
      projectEvents,
      studyCycleEvents,
      noteEvents,
      eventsThisMonth,
      eventsThisWeek,
      eventsByCategory,
      eventsByPriority,
      eventsByType
    };
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Rotta per aggiungere un evento dal to-do di una nota
CalendarRoutes.post('/api/addcalendar', verifyToken, async (req, res) => {
  const { title, description, date, noteId, todoText, isFromNote } = req.body;
  if (!title || !date) {
    return res.status(400).json({ message: 'Title e date sono obbligatori.' });
  }
  try {
    const newEvent = new Event({
      title,
      start: new Date(date),
      end: new Date(date),
      userId: req.userId,
      notificationLeadTime: 15, // 15 minuti di notifica per to-do
      repeatInterval: 0,
      description: description || '',
      // Metadata for note integration
      noteId: noteId || null,
      todoText: todoText || null,
      isFromNote: isFromNote || false,
      eventType: isFromNote ? 'note-todo' : 'manual'
    });
    const savedEvent = await newEvent.save();
    console.log(`📅 Evento creato da nota: ${title} (Note ID: ${noteId})`);
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event from note todo:', error);
    res.status(500).json({ message: 'Failed to create event from note todo' });
  }
});

// DELETE /api/events/from-note/:noteId - Remove all events created from a specific note
CalendarRoutes.delete('/api/events/from-note/:noteId', verifyToken, async (req, res) => {
  const { noteId } = req.params;
  
  try {
    const result = await Event.deleteMany({ 
      userId: req.userId, 
      noteId: noteId,
      isFromNote: true
    });
    
    console.log(`🗑️ Rimossi ${result.deletedCount} eventi per nota ${noteId}`);
    res.status(200).json({ 
      message: `Removed ${result.deletedCount} events for note ${noteId}`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error removing events for note:', error);
    res.status(500).json({ message: 'Failed to remove events for note' });
  }
});

// GET /api/events/from-notes - Get all events created from notes
CalendarRoutes.get('/api/events/from-notes', verifyToken, async (req, res) => {
  try {
    const events = await Event.find({ 
      userId: req.userId, 
      isFromNote: true 
    });
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events from notes:', error);
    res.status(500).json({ message: 'Failed to fetch events from notes' });
  }
});

// PUT /api/events/sync-note/:noteId - Sync a specific note's todos to calendar
CalendarRoutes.put('/api/events/sync-note/:noteId', verifyToken, async (req, res) => {
  const { noteId } = req.params;
  const { todos, noteTitle } = req.body;
  
  try {
    // Remove existing events for this note
    const deleteResult = await Event.deleteMany({ 
      userId: req.userId, 
      noteId: noteId,
      isFromNote: true
    });
    
    let created = 0;
    let errors = 0;
    const createdEvents = [];
    
    // Create new events for todos with deadlines
    if (todos && Array.isArray(todos)) {
      for (const todo of todos) {
        if (todo.deadline && !todo.checked) {
          try {
            const newEvent = new Event({
              title: `📝 To-Do: ${todo.text}`,
              start: new Date(todo.deadline),
              end: new Date(todo.deadline),
              userId: req.userId,
              notificationLeadTime: 15,
              repeatInterval: 0,
              description: `Dalla nota: "${noteTitle}" (ID: ${noteId})`,
              noteId: noteId,
              todoText: todo.text,
              isFromNote: true,
              eventType: 'note-todo'
            });
            
            const savedEvent = await newEvent.save();
            createdEvents.push(savedEvent);
            created++;
          } catch (error) {
            console.error('Error creating event for todo:', error);
            errors++;
          }
        }
      }
    }
    
    console.log(`🔄 Sync nota ${noteId}: rimossi ${deleteResult.deletedCount}, creati ${created}`);
    res.status(200).json({
      message: `Synced note ${noteId}: removed ${deleteResult.deletedCount}, created ${created}`,
      deletedCount: deleteResult.deletedCount,
      createdCount: created,
      errors: errors,
      createdEvents: createdEvents
    });
  } catch (error) {
    console.error('Error syncing note to calendar:', error);
    res.status(500).json({ message: 'Failed to sync note to calendar' });
  }
});

// GET /api/events/unified - Recupera eventi unificati (calendario + progetti) per l'utente autenticato
CalendarRoutes.get('/unified', verifyToken, async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).send("Token non trovato");
  }

  try {
    const events = await Event.find({ userId: req.userId });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching unified events:', error);
    res.status(500).json({ message: 'Failed to fetch unified events' });
  }
});

// DELETE /api/events/clear-project-events - Rimuove tutti gli eventi generati da progetti
CalendarRoutes.delete('/clear-project-events', verifyToken, async (req, res) => {
  try {
    const result = await Event.deleteMany({ 
      userId: req.userId, 
      isProjectEvent: true 
    });
    res.status(200).json({ 
      message: 'Project events cleared successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing project events:', error);
    res.status(500).json({ message: 'Failed to clear project events' });
  }
});

// DELETE /api/events/:id - Elimina un evento dell'utente autenticato
CalendarRoutes.delete('/:id', userRoutes, async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findOneAndDelete({ _id: id, userId: req.userId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// POST /api/events/sync-projects - Sincronizza progetti con calendario
CalendarRoutes.post('/sync-projects', verifyToken, async (req, res) => {
  const { projects, options = {} } = req.body;

  try {
    // Prima rimuove eventi di progetti esistenti
    await Event.deleteMany({ 
      userId: req.userId, 
      isProjectEvent: true 
    });

    const createdEvents = [];
    const currentUserId = req.userId;

    for (const project of projects) {
      // Verifica che l'utente sia owner o coinvolto nel progetto
      const isUserInvolved = project.owner === currentUserId || 
        project.phases.some(phase => 
          phase.tasks.some(task => task.actors.includes(currentUserId))
        );

      if (!isUserInvolved) continue;

      for (const phase of project.phases) {
        for (const task of phase.tasks) {
          const events = [];

          // Crea evento per task normale se richiesto
          if (options.includeAllTasks && task.start && task.end) {
            const isTaskUser = task.actors.includes(currentUserId) || project.owner === currentUserId;
            if (isTaskUser) {
              events.push({
                title: `📋 ${task.name}`,
                description: `Progetto: ${project.name}\nFase: ${phase.name}\n${task.description || ''}`,
                start: new Date(task.start),
                end: new Date(task.end),
                userId: currentUserId,
                notificationLeadTime: 30,
                repeatInterval: 0,
                participants: task.actors.map(actorId => ({ email: '', userId: actorId })),
                projectEventData: {
                  projectId: project._id,
                  taskId: task._id,
                  type: 'task'
                },
                isProjectEvent: true
              });
            }
          }

          // Crea evento per milestone se richiesto
          if (options.includeMilestones && task.milestone && task.milestoneDate) {
            const isTaskUser = task.actors.includes(currentUserId) || project.owner === currentUserId;
            if (isTaskUser) {
              const milestoneDate = new Date(task.milestoneDate);
              const endDate = new Date(milestoneDate.getTime() + 60 * 60 * 1000); // 1 ora

              events.push({
                title: `🎯 ${task.name} - Milestone`,
                description: `Progetto: ${project.name}\nFase: ${phase.name}\nMilestone: ${task.description || ''}`,
                start: milestoneDate,
                end: endDate,
                userId: currentUserId,
                notificationLeadTime: 120,
                repeatInterval: 0,
                participants: task.actors.map(actorId => ({ email: '', userId: actorId })),
                projectEventData: {
                  projectId: project._id,
                  taskId: task._id,
                  type: 'milestone'
                },
                isProjectEvent: true
              });
            }
          }

          // Salva eventi nel database
          for (const eventData of events) {
            const newEvent = new Event(eventData);
            const savedEvent = await newEvent.save();
            createdEvents.push(savedEvent);
          }
        }
      }
    }

    res.status(201).json({ 
      message: 'Projects synced successfully', 
      eventsCreated: createdEvents.length,
      events: createdEvents 
    });
  } catch (error) {
    console.error('Error syncing projects:', error);
    res.status(500).json({ message: 'Failed to sync projects' });
  }
});

// Funzioni helper per eventi ricorrenti
const generateRecurringEvents = (parentEvent, maxGenerations = 100) => {
  const events = [];
  const { recurrenceRule } = parentEvent;
  
  if (!recurrenceRule || recurrenceRule.frequency === 'none') {
    return events;
  }

  const startDate = new Date(parentEvent.start);
  const endDate = new Date(parentEvent.end);
  const duration = endDate.getTime() - startDate.getTime();
  
  let currentDate = new Date(startDate);
  let count = 0;
  
  while (count < maxGenerations) {
    // Calcola la prossima data basata sulla frequenza
    switch (recurrenceRule.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurrenceRule.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * recurrenceRule.interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurrenceRule.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + recurrenceRule.interval);
        break;
    }
    
    // Controlla se abbiamo superato la data di fine
    if (recurrenceRule.endDate && currentDate > new Date(recurrenceRule.endDate)) {
      break;
    }
    
    // Controlla il numero massimo di occorrenze
    if (recurrenceRule.maxOccurrences && count >= recurrenceRule.maxOccurrences) {
      break;
    }
    
    // Per eventi settimanali, controlla i giorni della settimana
    if (recurrenceRule.frequency === 'weekly' && recurrenceRule.daysOfWeek && recurrenceRule.daysOfWeek.length > 0) {
      if (!recurrenceRule.daysOfWeek.includes(currentDate.getDay())) {
        continue;
      }
    }
    
    // Crea l'evento ricorrente
    const recurringEvent = {
      title: parentEvent.title,
      description: parentEvent.description,
      userId: parentEvent.userId,
      start: new Date(currentDate),
      end: new Date(currentDate.getTime() + duration),
      category: parentEvent.category,
      priority: parentEvent.priority,
      color: parentEvent.color,
      location: parentEvent.location,
      notificationLeadTime: parentEvent.notificationLeadTime,
      participants: parentEvent.participants,
      parentEventId: parentEvent._id,
      isRecurring: false, // Le istanze non sono ricorrenti
      recurrenceRule: { frequency: 'none', interval: 1 }
    };
    
    events.push(recurringEvent);
    count++;
  }
  
  return events;
};

// POST /api/events/shared - Crea un evento per ogni partecipante (logica semplice)
CalendarRoutes.post('/shared', verifyToken, async (req, res) => {
  const { 
    title, start, end, description, notificationLeadTime, 
    sharedWith = [], category, priority, color, location 
  } = req.body;

  try {
    if (!title || !start || !end) {
      console.log('Missing required fields:', { title: !!title, start: !!start, end: !!end });
      return res.status(400).json({ message: 'Title, start, and end are required.' });
    }

    // Validate and convert dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('Invalid date format:', { start, end });
      return res.status(400).json({ message: 'Invalid date format for start or end.' });
    }

    console.log('=== CREATING EVENT FOR MULTIPLE USERS ===');
    console.log('Event title:', title);
    console.log('Shared with usernames:', sharedWith);
    console.log('Creator userId:', req.userId);

    // Trova gli userId degli username condivisi
    const sharedUsers = await User.find({ username: { $in: sharedWith } });
    const sharedUserIds = sharedUsers.map(user => user._id);
    
    console.log('Found shared users:', sharedUsers.map(u => ({ id: u._id, username: u.username })));

    // Lista di tutti gli utenti per cui creare l'evento: creatore + condivisi
    const allUserIds = [req.userId, ...sharedUserIds];
    const uniqueUserIds = [...new Set(allUserIds.map(id => id.toString()))];
    
    console.log('Creating events for user IDs:', uniqueUserIds);

    const createdEvents = [];
    
    // Crea un evento separato per ogni utente
    for (const userId of uniqueUserIds) {
      const newEvent = new Event({
        title,
        description: description || '',
        start: startDate,
        end: endDate,
        userId,
        notificationLeadTime: notificationLeadTime || 0,
        category: category || 'personal',
        priority: priority || 'medium',
        color: color || '#4caf50',
        location: location || '',
        isRecurring: false,
        recurrenceRule: { frequency: 'none', interval: 1 },
        // Campi per indicare che è condiviso
        accessType: sharedWith.length > 0 ? 'shared' : 'private',
        sharedWith: sharedWith // Per riferimento
      });
      
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      console.log(`✅ Event created for user ${userId}:`, savedEvent._id);
    }

    // Trova l'evento del creatore per la risposta
    const creatorEvent = createdEvents.find(event => event.userId.toString() === req.userId.toString());

    res.status(201).json({
      event: creatorEvent,
      eventsCreated: createdEvents.length,
      sharedWithCount: sharedWith.length,
      message: `Event created for ${createdEvents.length} users ${sharedWith.length > 0 ? `(shared with: ${sharedWith.join(', ')})` : '(private)'}`
    });
  } catch (error) {
    console.error('Error creating shared event:', error);
    res.status(500).json({ message: 'Failed to create shared event' });
  }
});

// POST /api/events/recurring - Crea evento ricorrente
CalendarRoutes.post('/recurring', verifyToken, async (req, res) => {
  const { 
    title, start, end, description, recurrenceRule, category, priority, 
    color, location, notificationLeadTime, repeatInterval, participants = [] 
  } = req.body;

  try {
    if (!title || !start || !end || !recurrenceRule) {
      return res.status(400).json({ message: 'Title, start, end, and recurrenceRule are required.' });
    }

    console.log('=== CREATING RECURRING EVENT WITH PARTICIPANTS ===');
    console.log('Event title:', title);
    console.log('Participants emails:', participants);

    // Associa email a userId se esiste
    const participantsWithIds = await Promise.all(
      participants.map(async (email) => {
        const user = await User.findOne({ email });
        console.log(`Participant ${email}: ${user ? 'found' : 'not found'} in database`);
        return { email, userId: user ? user._id : undefined };
      })
    );

    // Filtra solo gli utenti esistenti + il creatore
    const validParticipantIds = participantsWithIds
      .filter(p => p.userId)
      .map(p => p.userId);
    
    const allUserIds = [req.userId, ...validParticipantIds];
    const uniqueUserIds = [...new Set(allUserIds.map(id => id.toString()))];

    console.log('Creating recurring events for users:', uniqueUserIds);

    const allCreatedEvents = [];
    const emailsSent = [];
    const emailsNotFound = [];

    // Crea eventi ricorrenti per ogni utente
    for (const userId of uniqueUserIds) {
      // Crea l'evento principale ricorrente
      const parentEvent = new Event({
        title,
        description: description || '',
        start: new Date(start),
        end: new Date(end),
        userId,
        notificationLeadTime: notificationLeadTime || 0,
        repeatInterval: repeatInterval || 0,
        isRecurring: true,
        recurrenceRule,
        category: category || 'personal',
        priority: priority || 'medium',
        color: color || '#4caf50',
        location: location || '',
        participants: participantsWithIds,
      });

      const savedParent = await parentEvent.save();
      
      // Genera le istanze ricorrenti per questo utente
      const recurringEvents = generateRecurringEvents(savedParent);
      const savedRecurringEvents = await Event.insertMany(recurringEvents);
      
      allCreatedEvents.push({
        userId,
        parentEvent: savedParent,
        recurringEvents: savedRecurringEvents
      });
    }

    // Invio email ai partecipanti esistenti
    if (participantsWithIds && participantsWithIds.length > 0) {
      try {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        for (const p of participantsWithIds) {
          if (p.userId) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: p.email,
              subject: `📅 Invito a evento ricorrente: ${title}`,
              html: `
                <h2>🔄 Sei stato invitato a un evento ricorrente!</h2>
                <p><strong>Evento:</strong> ${title}</p>
                <p><strong>Descrizione:</strong> ${description || 'Nessuna descrizione'}</p>
                <p><strong>Ricorrenza:</strong> ${recurrenceRule.frequency}</p>
                <p><strong>Prima data:</strong> ${new Date(start).toLocaleDateString('it-IT')}</p>
                <p><strong>Orario:</strong> ${new Date(start).toLocaleTimeString('it-IT')} - ${new Date(end).toLocaleTimeString('it-IT')}</p>
                ${location ? `<p><strong>Luogo:</strong> ${location}</p>` : ''}
                <p>Gli eventi sono stati aggiunti automaticamente al tuo calendario Selfie.</p>
              `,
            });
            emailsSent.push(p.email);
          } else {
            emailsNotFound.push(p.email);
          }
        }
      } catch (emailError) {
        console.error('Error sending emails for recurring event:', emailError);
      }
    }

    // Risposta con informazioni per il creatore
    const creatorEvents = allCreatedEvents.find(e => e.userId.toString() === req.userId.toString());
    
    res.status(201).json({
      parentEvent: creatorEvents?.parentEvent,
      recurringEvents: creatorEvents?.recurringEvents,
      participantsInfo: {
        totalRequested: participants.length,
        usersCreated: allCreatedEvents.length,
        totalEventsCreated: allCreatedEvents.reduce((total, user) => total + user.recurringEvents.length + 1, 0),
        emailsSent: emailsSent.length,
        emailsNotFound: emailsNotFound,
        successfulParticipants: emailsSent
      },
      message: `Created recurring events for ${allCreatedEvents.length} users`
    });
  } catch (error) {
    console.error('Error creating recurring event:', error);
    res.status(500).json({ message: 'Failed to create recurring event' });
  }
});

// GET /api/events/filtered - Eventi con filtri avanzati
CalendarRoutes.get('/filtered', verifyToken, async (req, res) => {
  try {
    const { 
      category, 
      priority, 
      startDate, 
      endDate, 
      isRecurring,
      location 
    } = req.query;

    // Costruisci il filtro dinamicamente
    const filter = { 
      userId: req.userId,
      isDeleted: false 
    };

    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (isRecurring !== undefined) {
      filter.isRecurring = isRecurring === 'true';
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (startDate || endDate) {
      filter.start = {};
      if (startDate) {
        filter.start.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.start.$lte = new Date(endDate);
      }
    }

    const events = await Event.find(filter).sort({ start: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching filtered events:', error);
    res.status(500).json({ message: 'Failed to fetch filtered events' });
  }
});

// GET /api/events/statistics - Statistiche eventi
CalendarRoutes.get('/statistics', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Statistiche base
    const totalEvents = await Event.countDocuments({ userId, isDeleted: false });
    const recurringEvents = await Event.countDocuments({ userId, isRecurring: true, isDeleted: false });
    const projectEvents = await Event.countDocuments({ userId, isProjectEvent: true, isDeleted: false });
    
    // Eventi per categoria
    const eventsByCategory = await Event.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Eventi per priorità
    const eventsByPriority = await Event.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Eventi questo mese
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const eventsThisMonth = await Event.countDocuments({
      userId,
      isDeleted: false,
      start: { $gte: startOfMonth, $lte: endOfMonth }
    });

    res.status(200).json({
      totalEvents,
      recurringEvents,
      projectEvents,
      eventsThisMonth,
      eventsByCategory,
      eventsByPriority
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// PUT /api/events/:id/category - Aggiorna categoria evento
CalendarRoutes.put('/:id/category', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { category, priority, color } = req.body;

  try {
    const event = await Event.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { 
        category: category || undefined,
        priority: priority || undefined, 
        color: color || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error updating event category:', error);
    res.status(500).json({ message: 'Failed to update event category' });
  }
});

// DELETE /api/events/recurring/:id - Elimina serie ricorrente
CalendarRoutes.delete('/recurring/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { deleteAll } = req.query;

  try {
    if (deleteAll === 'true') {
      // Elimina l'evento principale e tutte le istanze
      await Event.updateMany(
        { 
          $or: [
            { _id: id, userId: req.userId },
            { parentEventId: id, userId: req.userId }
          ]
        },
        { 
          isDeleted: true, 
          deletedAt: new Date() 
        }
      );
      res.status(200).json({ message: 'Recurring series deleted successfully' });
    } else {
      // Elimina solo questa istanza
      const event = await Event.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { 
          isDeleted: true, 
          deletedAt: new Date() 
        },
        { new: true }
      );
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found or unauthorized' });
      }
      
      res.status(200).json({ message: 'Event instance deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting recurring event:', error);
    res.status(500).json({ message: 'Failed to delete recurring event' });
  }
});

// Funzione per inviare reminder via mail agli invitati
const sendReminders = async () => {
  const now = new Date();
  const events = await Event.find({ start: { $gte: now } });
  for (const event of events) {
    if (!event.participants || event.participants.length === 0) continue;
    const diffInMinutes = (new Date(event.start).getTime() - now.getTime()) / 60000;
    if (diffInMinutes <= event.notificationLeadTime && diffInMinutes > 0 && !event.reminderSent) {
      // Invia mail a tutti i partecipanti
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      for (const p of event.participants) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: p.email,
          subject: `Reminder evento: ${event.title}`,
          text: `L'evento "${event.title}" inizierà alle ${event.start}.`,
        });
      }
      event.reminderSent = true;
      await event.save();
    }
  }
};

// Esegui ogni minuto
cron.schedule('* * * * *', sendReminders);

export default CalendarRoutes;
