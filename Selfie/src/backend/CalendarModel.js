import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },  // Campo facoltativo per le note
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Collegamento all'utente
});

const calendar = mongoose.model('Event', eventSchema);
export default calendar;
