import React, { useEffect, useState } from 'react';
import { fetchEvents, exportICS, createEvent, respondInvite } from './api';
import { Event } from './types';
import EventForm from './EventForm';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  AppBar, Toolbar, Typography, Button, Grid, Card, CardContent, CardActions, Dialog, Snackbar, Alert, Box, Badge
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';

const localizer = momentLocalizer(moment);

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({open: false, message: '', severity: 'success'});
  const token = localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ev = await fetchEvents(token);
        setEvents(ev);
      } catch (e) {
        setError('Errore caricamento dati');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleExport = async () => {
    try {
      const blob = await exportICS(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'calendario.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnackbar({open: true, message: 'Esportazione completata!', severity: 'success'});
    } catch {
      setSnackbar({open: true, message: 'Errore esportazione .ics', severity: 'error'});
    }
  };

  const handleCreated = async (event: Event) => {
    try {
      await createEvent(event, token);
      const updated = await fetchEvents(token);
      setEvents(updated);
      setSnackbar({open: true, message: 'Evento creato!', severity: 'success'});
    } catch {
      setSnackbar({open: true, message: 'Errore creazione evento', severity: 'error'});
    }
  };

  const handleRespond = async (eventId: string, status: 'accepted'|'declined') => {
    try {
      await respondInvite(eventId, status, token);
      const updated = await fetchEvents(token);
      setEvents(updated);
      setSnackbar({open: true, message: 'Risposta invio aggiornata', severity: 'success'});
    } catch {
      setSnackbar({open: true, message: 'Errore risposta invito', severity: 'error'});
    }
  };

  // Adatta gli eventi per react-big-calendar
  const calendarEvents = events.map(ev => ({
    id: ev._id,
    title: ev.title,
    start: new Date(ev.start),
    end: new Date(ev.end),
    allDay: false
  }));

  if (loading) return <Box sx={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><Typography variant="h5">Caricamento...</Typography></Box>;
  if (error) return <Box sx={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <EventIcon sx={{mr:1}}/>
          <Typography variant="h6" sx={{flexGrow:1}}>Calendario</Typography>
          <Button color="inherit" startIcon={<AddIcon />} onClick={()=>setShowForm(true)}>Nuovo Evento</Button>
          <Button color="inherit" startIcon={<DownloadIcon />} onClick={handleExport}>Esporta .ics</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{p:2}}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{mb:2,boxShadow:3}}>
              <CardContent>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  defaultView={Views.MONTH}
                  views={[Views.MONTH, Views.WEEK, Views.DAY]}
                />
              </CardContent>
            </Card>
            <Typography variant="h5" sx={{mb:1}}>Eventi</Typography>
            <Grid container spacing={2}>
              {events.map(ev => {
                const myInvite = ev.invitedUsers?.find(i => i.user === userId);
                return (
                  <Grid item xs={12} md={6} key={ev._id}>
                    <Card sx={{mb:2,boxShadow:2}}>
                      <CardContent>
                        <Typography variant="h6">{ev.title}</Typography>
                        {ev.description && <Typography variant="body2" color="text.secondary">{ev.description}</Typography>}
                        <Typography variant="body2">{new Date(ev.start).toLocaleString()} - {new Date(ev.end).toLocaleString()}</Typography>
                        {ev.location && <Typography variant="body2">Luogo: {ev.location}</Typography>}
                        {ev.invitedUsers && ev.invitedUsers.length > 0 && (
                          <Box sx={{mt:1}}>
                            <GroupIcon fontSize="small" sx={{mr:0.5}}/>
                            {ev.invitedUsers.map(i => (
                              <Badge key={i.user} color={i.status==='accepted'?'success':i.status==='declined'?'error':'warning'} badgeContent={i.status} sx={{mr:1}}>
                                <Typography variant="caption">{i.user}</Typography>
                              </Badge>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                      <CardActions>
                        {myInvite && myInvite.status === 'pending' && (
                          <>
                            <Button size="small" color="success" onClick={() => handleRespond(ev._id!, 'accepted')}>Accetta</Button>
                            <Button size="small" color="error" onClick={() => handleRespond(ev._id!, 'declined')}>Rifiuta</Button>
                          </>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Dialog open={showForm} onClose={()=>setShowForm(false)} maxWidth="sm" fullWidth>
        <EventForm open={showForm} onClose={()=>setShowForm(false)} onCreated={handleCreated} resources={[]} />
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={()=>setSnackbar(s=>({...s,open:false}))}>
        <Alert onClose={()=>setSnackbar(s=>({...s,open:false}))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalendarPage; 