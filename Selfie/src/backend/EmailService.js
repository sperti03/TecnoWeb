import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.GMAIL_PASS,
  },
});

const defaultFrom = process.env.EMAIL_USER || process.env.GMAIL_USER || 'noreply@selfieapp.local';

export const EmailService = {
  async sendMail(options) {
    try {
      await transporter.sendMail({ from: options.from || defaultFrom, ...options });
      return { success: true };
    } catch (error) {
      console.error('EmailService sendMail error:', error);
      return { success: false, error: error.message };
    }
  },

  async sendInvitationEmail({ to, senderUsername, studySettings, message }) {
    const subject = `📩 Invito a sessione di studio da ${senderUsername}`;
    const html = `
      <h2>Sei stato invitato a una sessione di studio</h2>
      <p><strong>Da:</strong> ${senderUsername}</p>
      <p><strong>Impostazioni:</strong> ${studySettings?.studyTime || ''}min studio, ${studySettings?.pauseTime || ''}min pausa, ${studySettings?.cycles || ''} cicli</p>
      ${message ? `<p><strong>Messaggio:</strong> ${message}</p>` : ''}
      <p>Accedi a Selfie per accettare o rifiutare l'invito.</p>
    `;
    return this.sendMail({ to, subject, html });
  },

  async sendEventInvitationEmail({ to, title, description, start, end, location }) {
    const subject = `📅 Invito a evento: ${title}`;
    const html = `
      <h2>🎉 Sei stato invitato a un evento!</h2>
      <p><strong>Evento:</strong> ${title}</p>
      <p><strong>Descrizione:</strong> ${description || 'Nessuna descrizione'}</p>
      <p><strong>Data:</strong> ${new Date(start).toLocaleDateString('it-IT')}</p>
      <p><strong>Orario:</strong> ${new Date(start).toLocaleTimeString('it-IT')} - ${new Date(end).toLocaleTimeString('it-IT')}</p>
      ${location ? `<p><strong>Luogo:</strong> ${location}</p>` : ''}
      <p>L'evento è stato aggiunto automaticamente al tuo calendario Selfie.</p>
      <p>Accedi alla piattaforma per vedere tutti i dettagli.</p>
    `;
    return this.sendMail({ to, subject, html });
  },

  async sendEventReminderEmail({ to, title, start }) {
    const subject = `⏰ Promemoria evento: ${title}`;
    const text = `L'evento "${title}" inizierà alle ${new Date(start).toLocaleString('it-IT')}.`;
    return this.sendMail({ to, subject, text });
  },

  async sendProjectTaskEmail({ to, projectName, taskName, start, end, milestone }) {
    const subject = milestone ? `🎯 Milestone assegnata: ${taskName}` : `📋 Task assegnato: ${taskName}`;
    const html = `
      <h2>${milestone ? '🎯 Milestone assegnata' : '📋 Task assegnato'}</h2>
      <p><strong>Progetto:</strong> ${projectName}</p>
      <p><strong>Task:</strong> ${taskName}</p>
      ${start ? `<p><strong>Inizio:</strong> ${new Date(start).toLocaleString('it-IT')}</p>` : ''}
      ${end ? `<p><strong>Fine:</strong> ${new Date(end).toLocaleString('it-IT')}</p>` : ''}
      <p>Accedi a Selfie per i dettagli e la pianificazione.</p>
    `;
    return this.sendMail({ to, subject, html });
  },
};

export default EmailService;


