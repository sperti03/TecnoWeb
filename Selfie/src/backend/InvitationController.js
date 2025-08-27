import express from 'express';
import Invitation from './InvitationModel.js';
import User from './UserModel.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import EmailService from './EmailService.js';

const invitationRoutes = express.Router();

// Middleware
invitationRoutes.use(cors());
invitationRoutes.use(express.json());

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

// POST /api/invitations/send - Send study invitation
invitationRoutes.post('/send', verifyToken, async (req, res) => {
  const { 
    recipientUsername, 
    studySettings, 
    message 
  } = req.body;

  try {
    if (!recipientUsername || !studySettings) {
      return res.status(400).json({ message: 'Recipient username and study settings are required.' });
    }

    // Find recipient user
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (recipient._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot invite yourself.' });
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      senderId: req.userId,
      recipientId: recipient._id,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'You already have a pending invitation to this user.' });
    }

    // Create invitation
    const invitation = new Invitation({
      senderId: req.userId,
      recipientId: recipient._id,
      recipientUsername,
      senderUsername: req.username,
      studySettings,
      message,
      sessionId: new mongoose.Types.ObjectId().toString()
    });

    const savedInvitation = await invitation.save();
    // Send email to recipient if email exists
    if (recipient.email) {
      await EmailService.sendInvitationEmail({
        to: recipient.email,
        senderUsername: req.username,
        studySettings,
        message,
      });
    }
    res.status(201).json(savedInvitation);

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Failed to send invitation' });
  }
});

// GET /api/invitations/received - Get received invitations
invitationRoutes.get('/received', verifyToken, async (req, res) => {
  try {
    const invitations = await Invitation.find({ 
      recipientId: req.userId,
      status: 'pending'
    })
    .populate('senderId', 'username email')
    .sort({ createdAt: -1 });
    
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching received invitations:', error);
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
});

// GET /api/invitations/sent - Get sent invitations
invitationRoutes.get('/sent', verifyToken, async (req, res) => {
  try {
    const invitations = await Invitation.find({ 
      senderId: req.userId 
    })
    .populate('recipientId', 'username email')
    .sort({ createdAt: -1 });
    
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching sent invitations:', error);
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
});

// GET /api/invitations/pending/:userId - Get pending invitations for a user
invitationRoutes.get('/pending/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find pending invitations for the user
    const pendingInvitations = await Invitation.find({
      recipientId: userId,
      status: 'pending'
    })
    .populate('senderId', 'username email')
    .sort({ createdAt: -1 });
    
    res.status(200).json(pendingInvitations);
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ message: 'Failed to fetch pending invitations' });
  }
});

// POST /api/invitations/:id/accept - Accept invitation
invitationRoutes.post('/:id/accept', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await Invitation.findOneAndUpdate(
      { 
        _id: id, 
        recipientId: req.userId,
        status: 'pending'
      },
      { 
        status: 'accepted',
        acceptedAt: new Date(),
        sharedSessionActive: true
      },
      { new: true }
    ).populate('senderId', 'username email');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    // Notify sender via email that invitation was accepted
    try {
      const sender = await User.findById(invitation.senderId);
      if (sender?.email) {
        await EmailService.sendMail({
          to: sender.email,
          subject: `✅ Invito accettato da ${req.username}`,
          html: `
            <p>Il tuo invito a una sessione di studio è stato accettato.</p>
            <p>Apri la sessione condivisa da Pomodoro.</p>
          `,
        });
      }
    } catch (e) {
      console.error('Failed to send acceptance email to sender:', e);
    }

    res.status(200).json({ 
      message: 'Invitation accepted',
      invitation,
      redirectUrl: `/Pomodoro?sessionId=${invitation.sessionId}&invitationId=${invitation._id}`
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Failed to accept invitation' });
  }
});

// POST /api/invitations/:id/decline - Decline invitation
invitationRoutes.post('/:id/decline', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await Invitation.findOneAndUpdate(
      { 
        _id: id, 
        recipientId: req.userId,
        status: 'pending'
      },
      { status: 'declined' },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    res.status(200).json({ message: 'Invitation declined' });

  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ message: 'Failed to decline invitation' });
  }
});

// GET /api/invitations/session/:sessionId - Get session participants
invitationRoutes.get('/session/:sessionId', verifyToken, async (req, res) => {
  const { sessionId } = req.params;

  try {
    const invitation = await Invitation.findOne({ 
      sessionId,
      status: 'accepted',
      sharedSessionActive: true,
      $or: [
        { senderId: req.userId },
        { recipientId: req.userId }
      ]
    })
    .populate('senderId', 'username email')
    .populate('recipientId', 'username email');

    if (!invitation) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    res.status(200).json({
      sessionId,
      participants: [invitation.senderId, invitation.recipientId],
      studySettings: invitation.studySettings,
      isParticipant: true
    });

  } catch (error) {
    console.error('Error fetching session info:', error);
    res.status(500).json({ message: 'Failed to fetch session info' });
  }
});

// POST /api/invitations/session/:sessionId/end - End shared session
invitationRoutes.post('/session/:sessionId/end', verifyToken, async (req, res) => {
  const { sessionId } = req.params;

  try {
    const invitation = await Invitation.findOneAndUpdate(
      { 
        sessionId,
        $or: [
          { senderId: req.userId },
          { recipientId: req.userId }
        ]
      },
      { sharedSessionActive: false },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.status(200).json({ message: 'Session ended' });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
});

export default invitationRoutes;
