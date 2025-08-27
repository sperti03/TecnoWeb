import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI is not defined in the root .env');
}

let connectPromise = null;
if (mongoose.connection.readyState === 0) {
  connectPromise = mongoose
    .connect(mongoUri, {})
    .then(() => {
      console.log('MongoDB connected (singleton)');
    })
    .catch((err) => {
      console.error('MongoDB connection error (singleton):', err);
      throw err;
    });
}

export { connectPromise };
export default mongoose;


