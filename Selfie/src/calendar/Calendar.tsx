import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Button from '@mui/material/Button';  // Importa un pulsante da Material-UI
import logo from './images/logo.png'; // Assicurati che il percorso sia corretto

const localizer = momentLocalizer(moment);

interface Event {
  title: string;
  start: Date;
  end: Date;
}

const Calendario = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/events')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const transformedEvents = data.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }));
          setEvents(transformedEvents);
        } else {
          console.error('Data is not an array:', data);
        }
      })
      .catch(error => console.error('Error fetching events:', error));
  }, []);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('New Event name');
    if (title) {
      const newEvent = { title, start, end };
      fetch('http://localhost:5000/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(event => {
          setEvents([...events, { ...event, start: new Date(event.start), end: new Date(event.end) }]);
        })
        .catch(error => console.error('Error creating event:', error));
    }
  };

  return (
    <div className="App">
      <div className="title">
        <img src={logo} alt="Logo" />
      </div>
      <Button variant="contained" color="primary">+</Button> {/* Pulsante stilizzato */}
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
}

export default Calendario;