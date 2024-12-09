import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Button from '@mui/material/Button';
import logo from './images/logo.png';
import { createEvents, EventAttributes } from 'ics';

const localizer = momentLocalizer(moment);

interface Event {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  userId: string;
  notificationLeadTime: number;
  repeatInterval: number;
}

const CalendarHome: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('token'); // Recupera il token JWT
      if (!token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/events', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Invia il token nell'intestazione
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
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
        setError('Error fetching events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Richiedi permesso per le notifiche
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Controlla eventi imminenti
    const intervalId = setInterval(checkUpcomingEvents, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const checkUpcomingEvents = () => {
    const now = new Date();
    events.forEach(event => {
      const diffInMinutes = (event.start.getTime() - now.getTime()) / 60000;
      if (diffInMinutes <= event.notificationLeadTime && diffInMinutes > 0) {
        sendNotification(event);
      }
    });
  };

  const sendNotification = (event: Event) => {
    if (Notification.permission === 'granted') {
      const notifyInterval = setInterval(() => {
        new Notification(`Upcoming Event: ${event.title}`, {
          body: `Starting in ${event.notificationLeadTime} minutes`,
          icon: logo,
        });
      }, event.repeatInterval * 60000);

      setTimeout(() => clearInterval(notifyInterval), event.notificationLeadTime * 60000);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('New Event name');
    const notificationLeadTime = parseInt(window.prompt('Minutes before event to notify?') || '0', 10);
    const repeatInterval = parseInt(window.prompt('Notification repeat interval in minutes?') || '0', 10);

    if (title) {
      const newEvent = { title, start, end, notificationLeadTime, repeatInterval };

      const token = localStorage.getItem('token'); // Recupera il token JWT
      if (!token) {
        setError('User not authenticated');
        return;
      }

      fetch('http://localhost:8000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to create event');
          }
          return response.json();
        })
        .then(event => {
          setEvents([...events, { ...event, start: new Date(event.start), end: new Date(event.end) }]);
        })
        .catch(error => setError('Error creating event'));
    }
  };

  const exportToICalendar = () => {
    const icsEvents: EventAttributes[] = events.map(event => ({
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
        console.error('Error creating iCalendar:', error);
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'events.ics';
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
      <Button variant="contained" color="primary" onClick={exportToICalendar}>Export to .ics</Button>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView="month"
        views={['month', 'week', 'day']}
      />
    </div>
  );
};

export default CalendarHome;
