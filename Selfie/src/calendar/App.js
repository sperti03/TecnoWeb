import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Button from '@mui/material/Button';  // Importa un pulsante da Material-UI
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';  // Importa il CSS personalizzato
import logo from './images/logo.png';
const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);

  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt('Inserisci il titolo dell\'evento');
    if (title) {
      setEvents(prevEvents => [
        ...prevEvents,
        {
          start,
          end,
          title
        }
      ]);
    }
  };

  return (
    <div className="App">
      <div className="title"> 
      <img src={logo} alt="Logo" />      </div>
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

export default Calendar;
