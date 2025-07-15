import express from 'express';
const router = express.Router();

// In-memory session storage (in production, use Redis or database)
const activeSessions = new Map();

// Create a new shared session
router.post('/', async (req, res) => {
  try {
    const { hostId, hostName, studyTime, pauseTime, cycles } = req.body;
    
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const session = {
      sessionId,
      hostId,
      hostName,
      studyTime,
      pauseTime,
      cycles,
      participants: [{ id: hostId, name: hostName }],
      createdAt: new Date(),
      status: 'waiting' // waiting, active, completed
    };
    
    activeSessions.set(sessionId, session);
    
    res.json({ sessionId, session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Join a session
router.post('/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId, participantName } = req.body;
    
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if participant is already in session
    const existingParticipant = session.participants.find(p => p.id === participantId);
    if (!existingParticipant) {
      session.participants.push({ id: participantId, name: participantName });
    }
    
    activeSessions.set(sessionId, session);
    
    res.json(session);
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// Update session status
router.patch('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.status = status;
    activeSessions.set(sessionId, session);
    
    res.json(session);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

// Leave session
router.post('/:sessionId/leave', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId } = req.body;
    
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.participants = session.participants.filter(p => p.id !== participantId);
    
    // If no participants left, remove session
    if (session.participants.length === 0) {
      activeSessions.delete(sessionId);
      return res.json({ message: 'Session ended' });
    }
    
    activeSessions.set(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ error: 'Failed to leave session' });
  }
});

export default router;
