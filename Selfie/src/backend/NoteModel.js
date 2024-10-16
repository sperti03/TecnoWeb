import mongoose from 'mongoose';
const { Schema } = mongoose;

const NoteSchema = new Schema({
  id:{type: String, required: true},
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true } 
});

const Note = mongoose.model('Note', NoteSchema);


export default Note;