import mongoose from 'mongoose';


const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Rendi il titolo obbligatorio
  },
  content: {
    type: String,
    required: true, // Rendi il contenuto obbligatorio
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accessType: {
    type: String,
    enum: ['public', 'private', 'limited'], // Definisci i tipi di accesso consentiti
    default: 'public', // Imposta 'public' come predefinito
  },
  limitedUsers: {
    type: [String], // Array di username per gli accessi limitati
    default: [], // Imposta come array vuoto di default
  },
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
