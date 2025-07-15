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
  }
});

export default mongoose.model('Event', eventSchema);
