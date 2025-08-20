import mongoose from 'mongoose';

const recurrenceRuleSchema = new mongoose.Schema({
  frequency: { 
    type: String, 
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  interval: { type: Number, default: 1 },
  endDate: { type: Date },
  daysOfWeek: [{ type: Number }], // 0-6 (Domenica=0)
  maxOccurrences: { type: Number }
}, { _id: false });

const projectEventDataSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  taskId: { type: String },
  type: { 
    type: String, 
    enum: ['task', 'milestone', 'deadline'],
    default: 'task'
  }
}, { _id: false });

const studyCycleDataSchema = new mongoose.Schema({
  studyTime: { type: Number }, // minuti
  pauseTime: { type: Number }, // minuti
  cycles: { type: Number },
  subject: { type: String }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  description: { type: String, default: '' },
  
  // Metadati utente
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: String }, // username del creatore
  
  // Tipologia e categorizzazione
  eventType: { 
    type: String, 
    enum: ['general', 'study-cycle', 'project', 'note-todo', 'recurring', 'milestone'],
    default: 'general'
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'study', 'meeting', 'reminder', 'project', 'milestone'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Aspetto visivo
  color: { type: String, default: '#4caf50' },
  
  // Posizione e contatti
  location: { type: String, default: '' },
  
  // Partecipanti e condivisione
  participants: [{
    email: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  sharedWith: [{ type: String }], // usernames
  
  // Eventi ricorrenti
  isRecurring: { type: Boolean, default: false },
  parentEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  recurrenceRule: recurrenceRuleSchema,
  
  // Integrazione progetti
  isProjectEvent: { type: Boolean, default: false },
  projectEventData: projectEventDataSchema,
  
  // Integrazione study cycles
  studyCycleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudyCycle',
    required: false
  },
  studyCycleData: studyCycleDataSchema,
  
  // Integrazione note
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  todoText: { type: String }, // testo del to-do dalla nota
  
  // Notifiche e reminder
  notificationLeadTime: { type: Number, default: 0 }, // minuti prima
  reminderSent: { type: Boolean, default: false },
  
  // Legacy fields (per compatibilità)
  repeatInterval: { type: Number, default: 0 },
  
  // Metadati temporali
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'events'
});

// Middleware pre-save per aggiornare updatedAt
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-imposta eventType basato su altri campi
  if (this.studyCycleId && !this.eventType) {
    this.eventType = 'study-cycle';
  }
  if (this.isProjectEvent && !this.eventType) {
    this.eventType = 'project';
  }
  if (this.noteId && !this.eventType) {
    this.eventType = 'note-todo';
  }
  if (this.isRecurring && this.eventType === 'general') {
    this.eventType = 'recurring';
  }
  
  next();
});

// Indici per performance
eventSchema.index({ userId: 1, start: 1 });
eventSchema.index({ userId: 1, eventType: 1 });
eventSchema.index({ userId: 1, category: 1 });
eventSchema.index({ userId: 1, priority: 1 });
eventSchema.index({ parentEventId: 1 });
eventSchema.index({ studyCycleId: 1 });
eventSchema.index({ noteId: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
