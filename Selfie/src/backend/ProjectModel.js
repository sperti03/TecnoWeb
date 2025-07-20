import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  actors: [String], // userId o email
  phase: String,
  subphase: String,
  start: String, // ISO
  end: String, // ISO
  input: String,
  output: String,
  status: String,
  milestone: Boolean,
  milestoneDate: String,
  dependencies: [String],
});

const PhaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tasks: [TaskSchema],
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phases: [PhaseSchema],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'projects' // Specifica esplicitamente il nome della collezione
});

// Middleware pre-save per debug e aggiornamento timestamp
ProjectSchema.pre('save', function(next) {
  console.log('Saving project:', this.name);
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

const Project = mongoose.model('Project', ProjectSchema);

export default Project; 