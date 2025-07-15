import mongoose from 'mongoose';

const studyCycleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  studyTime: { type: Number, required: true }, // in minutes
  pauseTime: { type: Number, required: true }, // in minutes
  cycles: { type: Number, required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true }, // "HH:MM" format
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  calendarEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'rescheduled'],
    default: 'scheduled'
  },
  completedCycles: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  originalDate: { type: Date }, // Track the original date for rescheduled cycles
  rescheduledCount: { type: Number, default: 0 }
});

// Update lastModified on save
studyCycleSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

export default mongoose.model('StudyCycle', studyCycleSchema);
