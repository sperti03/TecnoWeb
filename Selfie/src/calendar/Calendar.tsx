import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import logo from "./images/logo.png";
import { createEvents, EventAttributes } from "ics";
import { StudyCycleService } from "../StudyCycle/StudyCycleService";
import { useNavigate } from "react-router-dom";
import StudyCycleModal from "./StudyCycleModal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Typography,
  Alert
} from "@mui/material";

const localizer = momentLocalizer(moment);

interface Event {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  userId: string;
  notificationLeadTime: number;
  repeatInterval: number;
  eventType?: string;
  studyCycleId?: string;
  participants?: string[];
}

const CalendarHome: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStudyCycleModal, setShowStudyCycleModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  
  // Stati per modal creazione evento con partecipanti
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    notificationLeadTime: 0,
    repeatInterval: 0,
    participantEmail: '',
    participants: [] as string[]
  });
  const [eventError, setEventError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/events", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        setEvents(
          data.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }))
        );
      } catch (err) {
        setError("Error fetching events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Auto-reschedule incomplete cycles on component load
    const autoReschedule = async () => {
      try {
        await StudyCycleService.rescheduleIncomplete();
      } catch (error) {
        console.log("Auto-reschedule check completed");
      }
    };
    autoReschedule();

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check for upcoming events
    const intervalId = setInterval(checkUpcomingEvents, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const checkUpcomingEvents = () => {
    const now = new Date();
    events.forEach((event) => {
      const diffInMinutes = (event.start.getTime() - now.getTime()) / 60000;
      if (diffInMinutes <= event.notificationLeadTime && diffInMinutes > 0) {
        sendNotification(event);
      }
    });
  };

  const sendNotification = (event: Event) => {
    if (Notification.permission === "granted") {
      const notifyInterval = setInterval(() => {
        new Notification(`Upcoming Event: ${event.title}`, {
          body: `Starting in ${event.notificationLeadTime} minutes`,
          icon: logo,
        });
      }, event.repeatInterval * 60000);

      setTimeout(
        () => clearInterval(notifyInterval),
        event.notificationLeadTime * 60000
      );
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const choice = window.prompt(
      "What would you like to create?\n1. Regular Event\n2. Study Cycle\nEnter 1 or 2:"
    );

    if (choice === "1") {
      setSelectedSlot({ start, end });
      setEventForm({
        title: '',
        description: '',
        notificationLeadTime: 0,
        repeatInterval: 0,
        participantEmail: '',
        participants: []
      });
      setEventError(null);
      setShowEventModal(true);
    } else if (choice === "2") {
      setSelectedSlot({ start, end });
      setShowStudyCycleModal(true);
    }
  };

  // Aggiunge partecipante alla lista
  const addParticipant = () => {
    const email = eventForm.participantEmail.trim();
    if (email && email.includes('@') && !eventForm.participants.includes(email)) {
      setEventForm({
        ...eventForm,
        participants: [...eventForm.participants, email],
        participantEmail: ''
      });
      setEventError(null);
    } else if (!email.includes('@')) {
      setEventError('Inserisci un indirizzo email valido');
    } else if (eventForm.participants.includes(email)) {
      setEventError('Questo partecipante è già stato aggiunto');
    }
  };

  // Rimuove partecipante dalla lista
  const removeParticipant = (emailToRemove: string) => {
    setEventForm({
      ...eventForm,
      participants: eventForm.participants.filter(email => email !== emailToRemove)
    });
  };

  // Crea evento con partecipanti
  const createEventWithParticipants = async () => {
    if (!selectedSlot || !eventForm.title.trim()) {
      setEventError('Il titolo dell\'evento è obbligatorio');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated");
      return;
    }

    const newEvent = {
      title: eventForm.title,
      description: eventForm.description,
      start: selectedSlot.start,
      end: selectedSlot.end,
      notificationLeadTime: eventForm.notificationLeadTime,
      repeatInterval: eventForm.repeatInterval,
      eventType: "general",
      participants: eventForm.participants, // Array di email partecipanti
    };

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const result = await response.json();
      const event = result.event || result; // Compatibilità con vecchia risposta
      
      setEvents([
        ...events,
        {
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        },
      ]);

      // Mostra informazioni sui partecipanti
      if (result.participantsInfo) {
        const { participantsInfo } = result;
        let message = `✅ Evento creato con successo!\n`;
        message += `📊 Eventi creati: ${participantsInfo.eventsCreated}\n`;
        
        if (participantsInfo.emailsSent > 0) {
          message += `📧 Email inviate a: ${participantsInfo.successfulParticipants.join(', ')}\n`;
        }
        
        if (participantsInfo.emailsNotFound.length > 0) {
          message += `⚠️ Email non trovate: ${participantsInfo.emailsNotFound.join(', ')}\nQuesti utenti non sono registrati sulla piattaforma.`;
        }
        
        alert(message);
      }

      // Chiudi modal e resetta form
      setShowEventModal(false);
      setEventForm({
        title: '',
        description: '',
        notificationLeadTime: 0,
        repeatInterval: 0,
        participantEmail: '',
        participants: []
      });
      setEventError(null);

    } catch (error) {
      setEventError("Errore durante la creazione dell'evento");
    }
  };

  const handleEventClick = (event: Event) => {
    if (event.eventType === "study-cycle" && event.studyCycleId) {
      // Redirect to Pomodoro with study cycle settings
      navigate(`/Pomodoro?studyCycleId=${event.studyCycleId}`);
    }
  };

  const exportToICalendar = () => {
    const icsEvents: EventAttributes[] = events.map((event) => ({
      title: event.title,
      start: [
        event.start.getFullYear(),
        event.start.getMonth() + 1,
        event.start.getDate(),
        event.start.getHours(),
        event.start.getMinutes(),
      ],
      end: [
        event.end.getFullYear(),
        event.end.getMonth() + 1,
        event.end.getDate(),
        event.end.getHours(),
        event.end.getMinutes(),
      ],
      uid: event.userId,
    }));

    createEvents(icsEvents, (error, value) => {
      if (error) {
        console.error("Error creating iCalendar:", error);
        return;
      }
      const blob = new Blob([value], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "events.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="App">
      <div className="title">
        <img src={logo} alt="Logo" />
      </div>
      <Button variant="contained" color="primary" onClick={exportToICalendar}>
        Export to .ics
      </Button>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleEventClick}
        defaultView="month"
        views={["month", "week", "day"]}
      />

      {/* Modal per creazione evento con partecipanti */}
      <Dialog open={showEventModal} onClose={() => setShowEventModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          📅 Crea Nuovo Evento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {eventError && (
              <Alert severity="error">{eventError}</Alert>
            )}
            
            <TextField
              fullWidth
              label="Titolo Evento"
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              required
            />
            
            <TextField
              fullWidth
              label="Descrizione"
              multiline
              rows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Minuti preavviso notifica"
                type="number"
                value={eventForm.notificationLeadTime}
                onChange={(e) => setEventForm({...eventForm, notificationLeadTime: parseInt(e.target.value) || 0})}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Intervallo ripetizione (min)"
                type="number"
                value={eventForm.repeatInterval}
                onChange={(e) => setEventForm({...eventForm, repeatInterval: parseInt(e.target.value) || 0})}
                sx={{ flex: 1 }}
              />
            </Box>
            
            <Typography variant="h6" sx={{ mt: 2 }}>
              👥 Partecipanti
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Email partecipante"
                type="email"
                value={eventForm.participantEmail}
                onChange={(e) => setEventForm({...eventForm, participantEmail: e.target.value})}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addParticipant();
                  }
                }}
              />
              <Button 
                variant="outlined" 
                onClick={addParticipant}
                sx={{ minWidth: 'auto' }}
              >
                Aggiungi
              </Button>
            </Box>
            
            {eventForm.participants.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  L'evento sarà creato nel calendario di tutti i partecipanti:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {eventForm.participants.map((email, index) => (
                    <Chip
                      key={index}
                      label={email}
                      onDelete={() => removeParticipant(email)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {selectedSlot && (
              <Alert severity="info">
                📅 Data: {selectedSlot.start.toLocaleDateString()} 
                ⏰ Orario: {selectedSlot.start.toLocaleTimeString()} - {selectedSlot.end.toLocaleTimeString()}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventModal(false)}>
            Annulla
          </Button>
          <Button 
            onClick={createEventWithParticipants}
            variant="contained"
            disabled={!eventForm.title.trim()}
          >
            Crea Evento
          </Button>
        </DialogActions>
      </Dialog>

      {showStudyCycleModal && (
        <StudyCycleModal
          isOpen={showStudyCycleModal}
          onClose={() => setShowStudyCycleModal(false)}
          selectedSlot={selectedSlot}
          onStudyCycleCreated={(newEvent) => {
            setEvents([...events, newEvent]);
            setShowStudyCycleModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CalendarHome;
