import mongoose from 'mongoose';

const invitedUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, { _id: false });

const repeatSchema = new mongoose.Schema({
  frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'custom'], default: 'none' },
  daysOfWeek: [Number], // es: [1,3,5] per lun, mer, ven
  dayOfMonth: Number, // es: 4 per il 4 del mese
  count: Number, // quante volte ripetere
  until: Date // data fine ripetizione
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  system: { type: Boolean, default: false },
  email: { type: Boolean, default: false }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  location: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedUsers: [invitedUserSchema],
  notification: notificationSchema,
  repeat: repeatSchema,
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }
});

export default mongoose.model('Event', eventSchema); 