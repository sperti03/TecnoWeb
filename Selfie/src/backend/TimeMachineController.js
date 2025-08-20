
import express from 'express';
import cors from 'cors'
import mongoose from 'mongoose';
import TimeMachineInterface from '../TimeMachine/TimeMachineInterface.js';
import dotenv from 'dotenv';
dotenv.config();

const timeMachineRoutes = express.Router();

// Middleware per debugging
timeMachineRoutes.use((req, res, next) => {
  console.log(`🕰️ TimeMachine ${req.method} ${req.path}`, req.body);
  next();
});

// GET /api/timemachine/gettime - Ottiene il tempo corrente (virtuale o reale)
timeMachineRoutes.get('/gettime', (req, res) => {
  try {
    const currentTime = TimeMachineInterface.getCurrentTime();
    console.log('Current time retrieved:', currentTime);
    
    res.json({
      time: currentTime.toISOString(),
      isVirtual: TimeMachineInterface.virtualTime !== null,
      systemTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting time:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero del tempo', 
      error: error.message 
    });
  }
});

// POST /api/timemachine/settime - Imposta un nuovo tempo virtuale
timeMachineRoutes.post('/settime', (req, res) => {
  try {
    const { time } = req.body;
    
    if (!time) {
      return res.status(400).json({ 
        message: 'Il parametro time è obbligatorio' 
      });
    }
    
    const newTime = new Date(time);
    if (isNaN(newTime.getTime())) {
      return res.status(400).json({ 
        message: 'Formato data non valido' 
      });
    }
    
    TimeMachineInterface.setTime(newTime);
    console.log('Virtual time set to:', newTime);
    
    res.json({
      time: newTime.toISOString(),
      message: 'Tempo virtuale impostato con successo',
      previousSystemTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting time:', error);
    res.status(500).json({ 
      message: 'Errore nell\'impostazione del tempo', 
      error: error.message 
    });
  }
});

// POST /api/timemachine/reset - Resetta al tempo reale di sistema
timeMachineRoutes.post('/reset', (req, res) => {
  try {
    const previousVirtualTime = TimeMachineInterface.virtualTime;
    TimeMachineInterface.resetToSystemTime();
    const currentTime = TimeMachineInterface.getCurrentTime();
    
    console.log('Time reset to system time:', currentTime);
    
    res.json({
      time: currentTime.toISOString(),
      message: 'Tempo resettato al tempo di sistema',
      previousVirtualTime: previousVirtualTime ? previousVirtualTime.toISOString() : null
    });
  } catch (error) {
    console.error('Error resetting time:', error);
    res.status(500).json({ 
      message: 'Errore nel reset del tempo', 
      error: error.message 
    });
  }
});

// POST /api/timemachine/advance - Avanza il tempo virtuale di X millisecondi
timeMachineRoutes.post('/advance', (req, res) => {
  try {
    const { milliseconds } = req.body;
    
    if (typeof milliseconds !== 'number') {
      return res.status(400).json({ 
        message: 'Il parametro milliseconds deve essere un numero' 
      });
    }
    
    const previousTime = TimeMachineInterface.getCurrentTime();
    TimeMachineInterface.advanceTime(milliseconds);
    const newTime = TimeMachineInterface.getCurrentTime();
    
    console.log(`Time advanced by ${milliseconds}ms from ${previousTime} to ${newTime}`);
    
    res.json({
      time: newTime.toISOString(),
      advancedBy: milliseconds,
      previousTime: previousTime.toISOString(),
      message: `Tempo avanzato di ${milliseconds} millisecondi`
    });
  } catch (error) {
    console.error('Error advancing time:', error);
    res.status(500).json({ 
      message: 'Errore nell\'avanzamento del tempo', 
      error: error.message 
    });
  }
});

// GET /api/timemachine/status - Ottiene informazioni dettagliate sullo stato
timeMachineRoutes.get('/status', (req, res) => {
  try {
    const currentTime = TimeMachineInterface.getCurrentTime();
    const systemTime = new Date();
    const isVirtual = TimeMachineInterface.virtualTime !== null;
    
    res.json({
      currentTime: currentTime.toISOString(),
      systemTime: systemTime.toISOString(),
      isVirtual,
      virtualTime: TimeMachineInterface.virtualTime ? TimeMachineInterface.virtualTime.toISOString() : null,
      timeDifference: isVirtual ? currentTime.getTime() - systemTime.getTime() : 0,
      status: isVirtual ? 'Virtual time active' : 'Using system time'
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dello status', 
      error: error.message 
    });
  }
});

// POST /api/timemachine/jump - Salta a una data specifica (alias per settime con validazioni extra)
timeMachineRoutes.post('/jump', (req, res) => {
  try {
    const { date, time } = req.body;
    
    let targetDateTime;
    if (date && time) {
      targetDateTime = new Date(`${date}T${time}`);
    } else if (date) {
      targetDateTime = new Date(date);
    } else {
      return res.status(400).json({ 
        message: 'Specificare almeno la data di destinazione' 
      });
    }
    
    if (isNaN(targetDateTime.getTime())) {
      return res.status(400).json({ 
        message: 'Data o ora non valida' 
      });
    }
    
    const previousTime = TimeMachineInterface.getCurrentTime();
    TimeMachineInterface.setTime(targetDateTime);
    
    console.log(`Time jumped from ${previousTime} to ${targetDateTime}`);
    
    res.json({
      time: targetDateTime.toISOString(),
      previousTime: previousTime.toISOString(),
      message: `Salto temporale completato`
    });
  } catch (error) {
    console.error('Error jumping time:', error);
    res.status(500).json({ 
      message: 'Errore nel salto temporale', 
      error: error.message 
    });
  }
});

export default timeMachineRoutes;