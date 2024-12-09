import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Relazione con l'utente
  notificationLeadTime: { type: Number, default: 0 },
  repeatInterval: { type: Number, default: 0 },
});

export default mongoose.model('Event', eventSchema);
