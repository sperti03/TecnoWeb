import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // es: 'room', 'bike', ecc.
});

export default mongoose.model('Resource', resourceSchema); 