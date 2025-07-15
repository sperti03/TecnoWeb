import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipientUsername: { 
    type: String, 
    required: true 
  },
  senderUsername: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['study-session'],
    default: 'study-session'
  },
  studySettings: {
    studyTime: { type: Number, required: true },
    pauseTime: { type: Number, required: true },
    cycles: { type: Number, required: true },
    subject: { type: String },
    title: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  message: { type: String },
  sessionId: { type: String }, // For tracking shared sessions
  createdAt: { type: Date, default: Date.now },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  acceptedAt: { type: Date },
  sharedSessionActive: { type: Boolean, default: false }
});

// Auto-expire invitations
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Invitation', invitationSchema);
