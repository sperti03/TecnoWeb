import mongoose from "mongoose";

// Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  birthdate: Date,
  profileImage: {
    data: Buffer,
    contentType: String
  }
});

// Creiamo il modello Utente basato sullo schema
const User = mongoose.model('User', userSchema);

export default User;
