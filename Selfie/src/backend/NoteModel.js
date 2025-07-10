import mongoose from 'mongoose';

const todoItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false },
  deadline: { type: String }, // ISO date string opzionale
}, { _id: false });

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
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
    enum: ['public', 'private', 'limited'],
    default: 'public',
  },
  accessList: {
    type: [String], // Array di username per gli accessi limitati
    default: [],
  },
  todos: {
    type: [todoItemSchema],
    default: [],
  },
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
