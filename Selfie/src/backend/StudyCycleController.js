import express from 'express';
import StudyCycle from './StudyCycleModel.js';
import Event from './CalendarModel.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const studyCycleRoutes = express.Router();

// Middleware
studyCycleRoutes.use(cors());
studyCycleRoutes.use(express.json());

// Connessione MongoDB centralizzata in index.js

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).send('Token mancante');
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tuasecretkey', (err, decoded) => {
    if (err) {
      return res.status(401).send('Token non valido');
    }

    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  });
};

// POST /api/study-cycles - Create a new study cycle and calendar event
studyCycleRoutes.post('/', verifyToken, async (req, res) => {
  const { 
    title, 
    subject, 
    studyTime, 
    pauseTime, 
    cycles, 
    scheduledDate, 
    scheduledTime 
  } = req.body;

  try {
    if (!title || !subject || !studyTime || !pauseTime || !cycles || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Parse the scheduled date and time
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const startDate = new Date(scheduledDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Calculate end time based on total study + break time
    const totalMinutes = (studyTime + pauseTime) * cycles;
    const endDate = new Date(startDate.getTime() + totalMinutes * 60000);

    // Create calendar event first
    const calendarEvent = new Event({
      title: `Study Session: ${subject}`,
      start: startDate,
      end: endDate,
      userId: req.userId,
      notificationLeadTime: 15,
      repeatInterval: 0,
      description: `${cycles} cycles of ${studyTime}min study + ${pauseTime}min break`
    });

    const savedEvent = await calendarEvent.save();

    // Create study cycle
    const studyCycle = new StudyCycle({
      title,
      subject,
      studyTime,
      pauseTime,
      cycles,
      scheduledDate: startDate,
      scheduledTime,
      userId: req.userId,
      calendarEventId: savedEvent._id
    });

    const savedCycle = await studyCycle.save();
    res.status(201).json({ studyCycle: savedCycle, calendarEvent: savedEvent });

  } catch (error) {
    console.error('Error creating study cycle:', error);
    res.status(500).json({ message: 'Failed to create study cycle' });
  }
});

// GET /api/study-cycles - Get user's study cycles
studyCycleRoutes.get('/', verifyToken, async (req, res) => {
  try {
    const studyCycles = await StudyCycle.find({ userId: req.userId })
      .populate('calendarEventId')
      .sort({ scheduledDate: 1 });
    
    res.status(200).json(studyCycles);
  } catch (error) {
    console.error('Error fetching study cycles:', error);
    res.status(500).json({ message: 'Failed to fetch study cycles' });
  }
});

// PUT /api/study-cycles/:id/progress - Update cycle progress
studyCycleRoutes.put('/:id/progress', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { completedCycles, status } = req.body;

  try {
    const studyCycle = await StudyCycle.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { 
        completedCycles,
        status,
        lastModified: new Date()
      },
      { new: true }
    );

    if (!studyCycle) {
      return res.status(404).json({ message: 'Study cycle not found' });
    }

    res.status(200).json(studyCycle);
  } catch (error) {
    console.error('Error updating study cycle progress:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

// POST /api/study-cycles/reschedule-incomplete - Auto-reschedule incomplete cycles
studyCycleRoutes.post('/reschedule-incomplete', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Find incomplete cycles from yesterday
    const incompleteCycles = await StudyCycle.find({
      userId: req.userId,
      scheduledDate: {
        $gte: yesterday,
        $lt: today
      },
      $or: [
        { status: 'scheduled' },
        { 
          status: 'in-progress',
          $expr: { $lt: ['$completedCycles', '$cycles'] }
        }
      ]
    }).populate('calendarEventId');

    const rescheduledCycles = [];

    for (const cycle of incompleteCycles) {
      // Calculate remaining cycles
      const remainingCycles = cycle.cycles - cycle.completedCycles;
      
      if (remainingCycles > 0) {
        // Update original cycle status
        cycle.status = 'rescheduled';
        await cycle.save();

        // Delete original calendar event
        if (cycle.calendarEventId) {
          await Event.findByIdAndDelete(cycle.calendarEventId._id);
        }

        // Create new study cycle for today
        const newScheduledDate = new Date(today);
        const [hours, minutes] = cycle.scheduledTime.split(':').map(Number);
        newScheduledDate.setHours(hours, minutes, 0, 0);

        // Check if there's already a session at this time today
        const existingCycle = await StudyCycle.findOne({
          userId: req.userId,
          scheduledDate: newScheduledDate,
          status: { $in: ['scheduled', 'in-progress'] }
        });

        // If there's a conflict, reschedule 1 hour later
        if (existingCycle) {
          newScheduledDate.setHours(newScheduledDate.getHours() + 1);
        }

        const totalMinutes = (cycle.studyTime + cycle.pauseTime) * remainingCycles;
        const endDate = new Date(newScheduledDate.getTime() + totalMinutes * 60000);

        // Create new calendar event
        const newCalendarEvent = new Event({
          title: `Study Session: ${cycle.subject} (Rescheduled)`,
          start: newScheduledDate,
          end: endDate,
          userId: req.userId,
          notificationLeadTime: 15,
          repeatInterval: 0,
          description: `${remainingCycles} remaining cycles of ${cycle.studyTime}min study + ${cycle.pauseTime}min break`
        });

        const savedEvent = await newCalendarEvent.save();

        // Create new study cycle
        const newStudyCycle = new StudyCycle({
          title: `${cycle.title} (Rescheduled)`,
          subject: cycle.subject,
          studyTime: cycle.studyTime,
          pauseTime: cycle.pauseTime,
          cycles: remainingCycles,
          scheduledDate: newScheduledDate,
          scheduledTime: newScheduledDate.toTimeString().slice(0, 5),
          userId: req.userId,
          calendarEventId: savedEvent._id,
          originalDate: cycle.originalDate || cycle.scheduledDate,
          rescheduledCount: (cycle.rescheduledCount || 0) + 1
        });

        const savedCycle = await newStudyCycle.save();
        rescheduledCycles.push(savedCycle);
      }
    }

    res.status(200).json({ 
      message: `${rescheduledCycles.length} incomplete cycles rescheduled`,
      rescheduledCycles 
    });

  } catch (error) {
    console.error('Error rescheduling incomplete cycles:', error);
    res.status(500).json({ message: 'Failed to reschedule incomplete cycles' });
  }
});

// DELETE /api/study-cycles/:id - Delete study cycle and associated calendar event
studyCycleRoutes.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const studyCycle = await StudyCycle.findOneAndDelete({ 
      _id: id, 
      userId: req.userId 
    });

    if (!studyCycle) {
      return res.status(404).json({ message: 'Study cycle not found' });
    }

    // Delete associated calendar event
    if (studyCycle.calendarEventId) {
      await Event.findByIdAndDelete(studyCycle.calendarEventId);
    }

    res.status(200).json({ message: 'Study cycle deleted successfully' });
  } catch (error) {
    console.error('Error deleting study cycle:', error);
    res.status(500).json({ message: 'Failed to delete study cycle' });
  }
});

// PUT /api/study-cycles/:id/complete - Mark study cycle as completed
studyCycleRoutes.put('/:id/complete', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { completedCycles, totalTime } = req.body;

  try {
    const studyCycle = await StudyCycle.findById(id);
    
    if (!studyCycle) {
      return res.status(404).json({ message: 'Study cycle not found.' });
    }

    if (studyCycle.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const wasFullyCompleted = completedCycles >= studyCycle.cycles;
    
    // Update study cycle
    studyCycle.completedCycles = completedCycles;
    studyCycle.totalStudyTime = totalTime;
    studyCycle.status = wasFullyCompleted ? 'completed' : 'incomplete';
    studyCycle.completedAt = new Date();
    
    await studyCycle.save();

    // If incomplete and auto-reschedule is enabled, create a new study cycle
    if (!wasFullyCompleted && studyCycle.autoReschedule !== false) {
      const remainingCycles = studyCycle.cycles - completedCycles;
      
      // Schedule for next available slot (tomorrow at same time)
      const nextDate = new Date(studyCycle.scheduledDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const newCycle = new StudyCycle({
        title: studyCycle.title + ' (Rescheduled)',
        subject: studyCycle.subject,
        studyTime: studyCycle.studyTime,
        pauseTime: studyCycle.pauseTime,
        cycles: remainingCycles,
        scheduledDate: nextDate,
        scheduledTime: studyCycle.scheduledTime,
        userId: req.userId,
        originalCycleId: studyCycle._id,
        autoReschedule: true
      });

      // Create new calendar event for rescheduled cycle
      const totalMinutes = (studyCycle.studyTime + studyCycle.pauseTime) * remainingCycles;
      const endDate = new Date(nextDate.getTime() + totalMinutes * 60000);

      const calendarEvent = new Event({
        title: `Study Session: ${studyCycle.subject} (Rescheduled)`,
        start: nextDate,
        end: endDate,
        userId: req.userId,
        notificationLeadTime: 15,
        repeatInterval: 0,
        description: `${remainingCycles} remaining cycles of ${studyCycle.studyTime}min study + ${studyCycle.pauseTime}min break`
      });

      const savedEvent = await calendarEvent.save();
      newCycle.calendarEventId = savedEvent._id;
      
      const savedNewCycle = await newCycle.save();
      
      res.json({ 
        originalCycle: studyCycle, 
        rescheduledCycle: savedNewCycle,
        message: `Incomplete cycle rescheduled for ${nextDate.toLocaleDateString()}`
      });
    } else {
      res.json({ 
        studyCycle, 
        message: wasFullyCompleted ? 'Study cycle completed!' : 'Study cycle marked as incomplete'
      });
    }

  } catch (error) {
    console.error('Error completing study cycle:', error);
    res.status(500).json({ message: 'Failed to complete study cycle' });
  }
});

// GET /api/study-cycles/:id/progress - Get study cycle progress
studyCycleRoutes.get('/:id/progress', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const studyCycle = await StudyCycle.findById(id);
    
    if (!studyCycle) {
      return res.status(404).json({ message: 'Study cycle not found.' });
    }

    if (studyCycle.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({
      completedCycles: studyCycle.completedCycles || 0,
      totalCycles: studyCycle.cycles,
      status: studyCycle.status,
      totalStudyTime: studyCycle.totalStudyTime || 0
    });

  } catch (error) {
    console.error('Error getting study cycle progress:', error);
    res.status(500).json({ message: 'Failed to get progress' });
  }
});

// GET /api/study-cycles/incomplete/:userId/:date - Get incomplete cycles for a specific date
studyCycleRoutes.get('/incomplete/:userId/:date', verifyToken, async (req, res) => {
  const { userId, date } = req.params;
  
  try {
    // Parse the date
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find incomplete cycles for the specified date
    const incompleteCycles = await StudyCycle.find({
      userId: userId,
      scheduledDate: {
        $gte: targetDate,
        $lt: nextDay
      },
      $or: [
        { status: 'scheduled' },
        { 
          status: 'in-progress',
          $expr: { $lt: ['$completedCycles', '$cycles'] }
        }
      ]
    }).populate('calendarEventId');

    res.status(200).json(incompleteCycles);
  } catch (error) {
    console.error('Error fetching incomplete cycles:', error);
    res.status(500).json({ message: 'Failed to fetch incomplete cycles' });
  }
});

// POST /api/study-cycles/move-incomplete - Move incomplete cycles to next day
studyCycleRoutes.post('/move-incomplete', verifyToken, async (req, res) => {
  const { userId, fromDate, toDate } = req.body;
  
  try {
    // Parse dates
    const fromDay = new Date(fromDate);
    const fromDayEnd = new Date(fromDay);
    fromDayEnd.setDate(fromDayEnd.getDate() + 1);
    
    const toDay = new Date(toDate);

    // Find incomplete cycles from the source date
    const incompleteCycles = await StudyCycle.find({
      userId: userId,
      scheduledDate: {
        $gte: fromDay,
        $lt: fromDayEnd
      },
      $or: [
        { status: 'scheduled' },
        { 
          status: 'in-progress',
          $expr: { $lt: ['$completedCycles', '$cycles'] }
        }
      ]
    }).populate('calendarEventId');

    const movedCycles = [];

    for (const cycle of incompleteCycles) {
      // Calculate remaining cycles
      const remainingCycles = cycle.cycles - cycle.completedCycles;
      
      if (remainingCycles > 0) {
        // Mark original cycle as moved
        cycle.status = 'moved';
        await cycle.save();

        // Delete original calendar event if exists
        if (cycle.calendarEventId) {
          await Event.findByIdAndDelete(cycle.calendarEventId._id);
        }

        // Create new cycle for target date
        const newScheduledDate = new Date(toDay);
        const [hours, minutes] = cycle.scheduledTime.split(':').map(Number);
        newScheduledDate.setHours(hours, minutes, 0, 0);

        // Check for conflicts and adjust time if needed
        let adjustedHours = hours;
        let conflictFound = true;
        let attempts = 0;
        
        while (conflictFound && attempts < 24) {
          const checkDate = new Date(toDay);
          checkDate.setHours(adjustedHours, minutes, 0, 0);
          
          const existingCycle = await StudyCycle.findOne({
            userId: userId,
            scheduledDate: checkDate,
            status: { $in: ['scheduled', 'in-progress'] }
          });

          if (!existingCycle) {
            conflictFound = false;
            newScheduledDate.setHours(adjustedHours, minutes, 0, 0);
          } else {
            adjustedHours = (adjustedHours + 1) % 24;
            attempts++;
          }
        }

        // Calculate end time for calendar event
        const totalMinutes = (cycle.studyTime + cycle.pauseTime) * remainingCycles;
        const endDate = new Date(newScheduledDate.getTime() + totalMinutes * 60000);

        // Create new calendar event
        const calendarEvent = new Event({
          title: `Study Session: ${cycle.subject} (Moved)`,
          start: newScheduledDate,
          end: endDate,
          userId: userId,
          notificationLeadTime: 15,
          repeatInterval: 0,
          description: `${remainingCycles} remaining cycles of ${cycle.studyTime}min study + ${cycle.pauseTime}min break`
        });

        const savedEvent = await calendarEvent.save();

        // Create new study cycle
        const newCycle = new StudyCycle({
          title: cycle.title + ' (Moved)',
          subject: cycle.subject,
          studyTime: cycle.studyTime,
          pauseTime: cycle.pauseTime,
          cycles: remainingCycles,
          scheduledDate: newScheduledDate,
          scheduledTime: `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          userId: userId,
          calendarEventId: savedEvent._id,
          originalCycleId: cycle._id
        });

        const savedCycle = await newCycle.save();
        movedCycles.push(savedCycle);
      }
    }

    res.status(200).json({ 
      message: `Moved ${movedCycles.length} incomplete cycles`,
      movedCycles 
    });

  } catch (error) {
    console.error('Error moving incomplete cycles:', error);
    res.status(500).json({ message: 'Failed to move incomplete cycles' });
  }
});

export default studyCycleRoutes;
