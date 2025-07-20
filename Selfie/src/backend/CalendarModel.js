import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notificationLeadTime: { type: Number, default: 0 },
  repeatInterval: { type: Number, default: 0 },
  description: { type: String, default: '' },
  eventType: { 
    type: String, 
    enum: ['general', 'study-cycle'],
    default: 'general'
  },
  studyCycleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudyCycle',
    required: false
  },
  // Condivisione eventi (pattern come note)
  accessType: {
    type: String,
    enum: ['private', 'shared'],
    default: 'private',
  },
  sharedWith: {
    type: [String], // Array di username
    default: [],
  },
  reminderSent: { type: Boolean, default: false },
  // Campi per integrazione progetti
  projectEventData: {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
    taskId: { type: String, required: false },
    type: { type: String, enum: ['event', 'task', 'milestone'], default: 'event' },
  },
  isProjectEvent: { type: Boolean, default: false },
  // Campi per eventi ricorrenti
  isRecurring: { type: Boolean, default: false },
  recurrenceRule: {
    frequency: { 
      type: String, 
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: { type: Number, default: 1 }, // ogni X giorni/settimane/mesi
    endDate: { type: Date }, // quando finisce la ricorrenza
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // per eventi settimanali (0=domenica)
    maxOccurrences: { type: Number }, // numero massimo di ripetizioni
  },
  parentEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // per eventi ricorrenti generati
  // Filtri e categorizzazione
  category: { 
    type: String, 
    enum: ['work', 'personal', 'study', 'meeting', 'reminder', 'project'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  color: { type: String, default: '#4caf50' }, // colore personalizzato
  location: { type: String }, // dove si svolge l'evento
  attachments: [{ 
    filename: String,
    path: String,
    mimeType: String
  }],
  // Metadati aggiuntivi
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
});

// Index per performance
eventSchema.index({ userId: 1, start: 1 });
eventSchema.index({ isRecurring: 1, parentEventId: 1 });
eventSchema.index({ category: 1, priority: 1 });

// Middleware pre-save
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
