import Event from '../models/EventModel.js';
import Resource from '../models/ResourceModel.js';
import User from '../UserModel.js';
// import { sendNotification, sendEmail } from '../utils/notification.js';
// import { generateICS } from '../utils/icsExport.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { createEvents } from 'ics';

const createEvent = async (req, res) => {
  try {
    console.log('Richiesta creazione evento:', req.body); // LOG INIZIO
    const { title, description, start, end, location, invitedUsers, notification, repeat, resource } = req.body;
    const createdBy = req.userId;

    // Se c'è una risorsa, verifica che sia libera
    let resourceObj = null;
    if (resource) {
      resourceObj = await Resource.findById(resource);
      if (!resourceObj) return res.status(400).json({ message: 'Risorsa non trovata' });
      // Verifica che la risorsa sia libera nell'intervallo richiesto
      const overlapping = await Event.findOne({ resource, $or: [
        { start: { $lt: end, $gte: start } },
        { end: { $gt: start, $lte: end } },
        { start: { $lte: start }, end: { $gte: end } }
      ] });
      if (overlapping) return res.status(409).json({ message: 'Risorsa già occupata' });
    }

    // Prepara gli invitati (array di { user, status })
    let invited = [];
    if (Array.isArray(invitedUsers)) {
      const users = await User.find({ email: { $in: invitedUsers.map(u => u.email) } });
      invited = users.map(u => ({ user: u._id, status: 'pending' }));
    }

    // Genera occorrenze per eventi ripetuti
    let eventsToSave = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (repeat && repeat.frequency && repeat.frequency !== 'none') {
      let count = repeat.count || 10; // default: 10 occorrenze
      let until = repeat.until ? new Date(repeat.until) : null;
      let currentStart = new Date(startDate);
      let currentEnd = new Date(endDate);
      let i = 0;
      while (i < count && (!until || currentStart <= until)) {
        // Per custom: controlla giorni della settimana/giorno del mese
        if (repeat.frequency === 'custom') {
          let valid = true;
          if (repeat.daysOfWeek && repeat.daysOfWeek.length > 0) {
            valid = repeat.daysOfWeek.includes(currentStart.getDay());
          }
          if (repeat.dayOfMonth) {
            valid = valid && currentStart.getDate() === repeat.dayOfMonth;
          }
          if (!valid) {
            // Avanza di un giorno
            currentStart.setDate(currentStart.getDate() + 1);
            currentEnd.setDate(currentEnd.getDate() + 1);
            continue;
          }
        }
        eventsToSave.push(new Event({
          title, description, start: new Date(currentStart), end: new Date(currentEnd), location, createdBy, invitedUsers: invited, notification, repeat, resource
        }));
        // Avanza secondo la frequenza
        if (repeat.frequency === 'daily' || repeat.frequency === 'custom') {
          currentStart.setDate(currentStart.getDate() + 1);
          currentEnd.setDate(currentEnd.getDate() + 1);
        } else if (repeat.frequency === 'weekly') {
          currentStart.setDate(currentStart.getDate() + 7);
          currentEnd.setDate(currentEnd.getDate() + 7);
        } else if (repeat.frequency === 'monthly') {
          currentStart.setMonth(currentStart.getMonth() + 1);
          currentEnd.setMonth(currentEnd.getMonth() + 1);
        }
        i++;
      }
    } else {
      eventsToSave.push(new Event({
        title, description, start, end, location, createdBy, invitedUsers: invited, notification, repeat, resource
      }));
    }

    console.log('Eventi da salvare:', eventsToSave); // LOG PRIMA DI SALVARE
    // Salva tutte le occorrenze
    const saved = await Event.insertMany(eventsToSave);
    console.log('Eventi salvati:', saved); // LOG DOPO IL SALVATAGGIO
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore creazione evento' });
  }
};

const getEvents = async (req, res) => {
  try {
    const userId = req.userId;
    // Eventi creati o dove sono invitato
    const events = await Event.find({
      $or: [
        { createdBy: userId },
        { 'invitedUsers.user': userId }
      ]
    }).populate('resource').populate('invitedUsers.user');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Errore recupero eventi' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });
    if (!event.createdBy.equals(userId)) return res.status(403).json({ message: 'Non autorizzato' });
    await event.deleteOne();
    res.json({ message: 'Evento cancellato' });
  } catch (err) {
    res.status(500).json({ message: 'Errore cancellazione evento' });
  }
};

const respondInvite = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.body; // 'accepted' o 'declined'
    const event = await Event.findById(req.params.id).populate('createdBy').populate('invitedUsers.user');
    if (!event) return res.status(404).json({ message: 'Evento non trovato' });
    const invite = event.invitedUsers.find(i => i.user.equals(userId));
    if (!invite) return res.status(403).json({ message: 'Non invitato' });
    invite.status = status;
    await event.save();
    // Notifica al creatore via email (placeholder)
    const creator = event.createdBy;
    const invitedUser = event.invitedUsers.find(i => i.user.equals(userId));
    if (creator && creator.email) {
      // Qui puoi usare nodemailer per inviare la mail reale
      console.log(`Invia mail a ${creator.email}: ${invitedUser.user.email} ha ${status === 'accepted' ? 'accettato' : 'rifiutato'} l'invito all'evento ${event.title}`);
    }
    res.json({ message: 'Risposta invio aggiornata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore risposta invito' });
  }
};

const exportICS = async (req, res) => {
  try {
    const userId = req.userId;
    const events = await Event.find({
      $or: [
        { createdBy: userId },
        { 'invitedUsers.user': userId }
      ]
    });
    const icsEvents = events.map(ev => ({
      title: ev.title,
      start: [
        ev.start.getFullYear(),
        ev.start.getMonth() + 1,
        ev.start.getDate(),
        ev.start.getHours(),
        ev.start.getMinutes()
      ],
      end: [
        ev.end.getFullYear(),
        ev.end.getMonth() + 1,
        ev.end.getDate(),
        ev.end.getHours(),
        ev.end.getMinutes()
      ],
      description: ev.description,
      location: ev.location
    }));
    createEvents(icsEvents, (error, value) => {
      if (error) return res.status(500).json({ message: 'Errore generazione .ics' });
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename=calendario.ics');
      res.send(value);
    });
  } catch (err) {
    res.status(500).json({ message: 'Errore esportazione .ics' });
  }
};

export { createEvent, getEvents, deleteEvent, respondInvite, exportICS }; 