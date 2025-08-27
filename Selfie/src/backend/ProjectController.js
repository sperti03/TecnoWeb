import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Project from './ProjectModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import EmailService from './EmailService.js';

const projectRoutes = express.Router();

if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected (ProjectController)'))
    .catch(err => console.error('MongoDB connection error (ProjectController):', err));
}

projectRoutes.use(cors());
projectRoutes.use(express.json());

// Connessione MongoDB centralizzata in index.js

// Middleware verifica token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).send('Token mancante');
  jwt.verify(token, process.env.JWT_SECRET || 'tuasecretkey', (err, decoded) => {
    if (err) return res.status(401).send('Token non valido');
    req.userId = decoded.userId;
    next();
  });
};

// GET tutti i progetti dove l'utente è owner o attore
projectRoutes.get('/api/getprojects', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'phases.tasks.actors': userId },
      ],
    });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Errore nel recupero progetti' });
  }
});

// POST aggiungi progetto
projectRoutes.post('/api/addproject', verifyToken, async (req, res) => {
  const { name, description, phases, notes } = req.body;
  try {
    console.log('=== CREATE PROJECT REQUEST ===');
    console.log('Request data:', { name, description, phases, notes, owner: req.userId });
    console.log('Phases received:', JSON.stringify(phases, null, 2));
    
    // Pulisce gli _id temporanei dalle fasi e task per permettere a Mongoose di generarne di nuovi
    const cleanPhases = (phases || []).map((phase, phaseIndex) => {
      console.log(`Processing phase ${phaseIndex}:`, phase);
      
      const cleanPhase = {
        name: phase.name,
        tasks: (phase.tasks || []).map((task, taskIndex) => {
          console.log(`Processing task ${taskIndex} in phase ${phaseIndex}:`, task);
          const cleanTask = { ...task };
          
          // Rimuovi _id temporaneo (creato con Date.now()) ma mantieni ObjectId validi di MongoDB
          if (cleanTask._id) {
            console.log(`Task ${taskIndex} has _id: ${cleanTask._id} (type: ${typeof cleanTask._id})`);
            if (typeof cleanTask._id === 'string' && 
                !cleanTask._id.match(/^[0-9a-fA-F]{24}$/) && // Non è un ObjectId valido
                cleanTask._id.match(/^\d+$/)) { // È un numero (timestamp di Date.now())
              console.log(`Removing temporary _id: ${cleanTask._id}`);
              delete cleanTask._id;
            }
          }
          return cleanTask;
        })
      };
      
      // Rimuovi _id temporaneo (creato con Date.now()) ma mantieni ObjectId validi di MongoDB
      if (cleanPhase._id) {
        console.log(`Phase ${phaseIndex} has _id: ${cleanPhase._id} (type: ${typeof cleanPhase._id})`);
        if (typeof cleanPhase._id === 'string' && 
            !cleanPhase._id.match(/^[0-9a-fA-F]{24}$/) && // Non è un ObjectId valido
            cleanPhase._id.match(/^\d+$/)) { // È un numero (timestamp di Date.now())
          console.log(`Removing temporary phase _id: ${cleanPhase._id}`);
          delete cleanPhase._id;
        }
      }
      return cleanPhase;
    });
    
    console.log('Cleaned phases for database:', JSON.stringify(cleanPhases, null, 2));
    
    const projectData = {
      name,
      description,
      owner: req.userId,
      phases: cleanPhases,
      notes: notes || '',
    };
    
    console.log('Creating project with:', JSON.stringify(projectData, null, 2));
    
    const newProject = new Project(projectData);
    
    console.log('Project instance created, validating...');
    await newProject.validate();
    console.log('Validation passed, saving to database...');
    
    await newProject.save();
    console.log('Project saved successfully with ID:', newProject._id);
    
    res.status(201).json(newProject);
    
    // Fire-and-forget: notify actors by email if their email is known in DB
    try {
      const allActorIds = [];
      for (const phase of newProject.phases) {
        for (const task of phase.tasks || []) {
          for (const actorId of task.actors || []) {
            if (typeof actorId === 'string') {
              allActorIds.push(actorId);
            }
          }
        }
      }
      const uniqueActorIds = [...new Set(allActorIds)].filter(id => String(id) !== String(req.userId));
      if (uniqueActorIds.length > 0) {
        const users = await mongoose.model('User').find({ _id: { $in: uniqueActorIds } });
        const userIdToEmail = new Map(users.map(u => [String(u._id), u.email]));
        for (const phase of newProject.phases) {
          for (const task of phase.tasks || []) {
            for (const actorId of task.actors || []) {
              const email = userIdToEmail.get(String(actorId));
              if (email) {
                EmailService.sendProjectTaskEmail({
                  to: email,
                  projectName: newProject.name,
                  taskName: task.name,
                  start: task.start,
                  end: task.end,
                  milestone: !!task.milestone,
                }).catch(() => {});
              }
            }
          }
        }
      }
    } catch (notifyErr) {
      console.error('Failed to send project task emails:', notifyErr);
    }
  } catch (err) {
    console.error('=== ERROR CREATING PROJECT ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      Object.keys(err.errors).forEach(key => {
        console.error(`Validation error on field ${key}:`, err.errors[key].message);
      });
    }
    
    res.status(500).json({ 
      message: 'Errore durante la creazione del progetto',
      error: err.message,
      errorName: err.name,
      details: err.name === 'ValidationError' ? err.errors : undefined
    });
  }
});

// PUT aggiorna progetto
projectRoutes.put('/api/updateproject/:projectId', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  const { name, description, phases, notes } = req.body;
  try {
    console.log('=== UPDATE PROJECT REQUEST ===');
    console.log('Project ID:', projectId);
    console.log('Request data:', { name, description, phases, notes });
    console.log('Phases received:', JSON.stringify(phases, null, 2));
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).send('Progetto non trovato');
    if (String(project.owner) !== String(req.userId)) return res.status(403).send('Non autorizzato');
    
    console.log('Current project phases before update:', JSON.stringify(project.phases, null, 2));
    
    // Pulisce gli _id temporanei dalle fasi e task per aggiornamenti
    const cleanPhases = (phases || []).map((phase, phaseIndex) => {
      console.log(`Processing phase ${phaseIndex} for update:`, phase);
      
      const cleanPhase = {
        ...phase,
        tasks: (phase.tasks || []).map((task, taskIndex) => {
          console.log(`Processing task ${taskIndex} in phase ${phaseIndex} for update:`, task);
          const cleanTask = { ...task };
          
          // Mantieni _id esistenti (ObjectId) ma rimuovi quelli temporanei (creati con Date.now())
          if (cleanTask._id) {
            console.log(`Task ${taskIndex} has _id: ${cleanTask._id} (type: ${typeof cleanTask._id})`);
            if (typeof cleanTask._id === 'string' && 
                !cleanTask._id.match(/^[0-9a-fA-F]{24}$/) && // Non è un ObjectId valido
                cleanTask._id.match(/^\d+$/)) { // È un numero (timestamp di Date.now())
              console.log(`Removing temporary task _id: ${cleanTask._id}`);
              delete cleanTask._id;
            }
          }
          return cleanTask;
        })
      };
      
      // Mantieni _id esistenti (ObjectId) ma rimuovi quelli temporanei (creati con Date.now())
      if (cleanPhase._id) {
        console.log(`Phase ${phaseIndex} has _id: ${cleanPhase._id} (type: ${typeof cleanPhase._id})`);
        if (typeof cleanPhase._id === 'string' && 
            !cleanPhase._id.match(/^[0-9a-fA-F]{24}$/) && // Non è un ObjectId valido
            cleanPhase._id.match(/^\d+$/)) { // È un numero (timestamp di Date.now())
          console.log(`Removing temporary phase _id: ${cleanPhase._id}`);
          delete cleanPhase._id;
        }
      }
      return cleanPhase;
    });
    
    console.log('Cleaned phases for update:', JSON.stringify(cleanPhases, null, 2));
    
    project.name = name;
    project.description = description;
    project.phases = cleanPhases;
    project.notes = notes;
    project.updatedAt = new Date();
    
    console.log('Project ready for save, validating...');
    await project.validate();
    console.log('Validation passed, saving updated project...');
    
    await project.save();
    console.log('Project updated successfully with ID:', project._id);
    
    res.status(200).json(project);
  } catch (err) {
    console.error('=== ERROR UPDATING PROJECT ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      Object.keys(err.errors).forEach(key => {
        console.error(`Validation error on field ${key}:`, err.errors[key].message);
      });
    }
    
    res.status(500).json({ 
      message: 'Errore durante l\'aggiornamento del progetto',
      error: err.message,
      errorName: err.name,
      details: err.name === 'ValidationError' ? err.errors : undefined
    });
  }
});

// DELETE elimina progetto
projectRoutes.delete('/api/deleteproject/:projectId', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).send('Progetto non trovato');
    if (String(project.owner) !== String(req.userId)) return res.status(403).send('Non autorizzato');
    await project.deleteOne();
    res.status(200).send('Progetto eliminato');
  } catch (err) {
    res.status(500).json({ message: 'Errore durante l\'eliminazione del progetto' });
  }
});

export default projectRoutes; 