import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true, // Rendi il contenuto obbligatorio
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  destId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username:{
    type: String,
    required:true,
  },
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;
