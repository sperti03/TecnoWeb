import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Chip,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress
} from "@mui/material";
import {
  EventNote as EventIcon,
  FilterList as FilterIcon,
  Assessment as StatsIcon,
  Repeat as RepeatIcon
} from "@mui/icons-material";
import "./AdvancedCalendar.css";

const localizer = momentLocalizer(moment);

interface Event {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  category: string;
  priority: string;
  color: string;
  location?: string;
  isRecurring: boolean;
  parentEventId?: string;
}

interface RecurrenceRule {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
  maxOccurrences?: number;
}

interface Statistics {
  totalEvents: number;
  recurringEvents: number;
  projectEvents: number;
  eventsThisMonth: number;
  eventsByCategory: Array<{ _id: string; count: number }>;
  eventsByPriority: Array<{ _id: string; count: number }>;
}

const AdvancedCalendar: React.FC = () => {
  console.log('🚀 AdvancedCalendar component loaded - DEBUG VERSION 2.0');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  // Filtri
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  
  // Modal per eventi ricorrenti
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{start: Date; end: Date} | null>(null);
  
  // Form per evento ricorrente
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    color: '#4caf50',
    location: '',
    notificationLeadTime: 0,
    participantUsername: '',
    sharedWith: [] as string[]
  });
  
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'none',
    interval: 1,
    endDate: undefined,
    daysOfWeek: [],
    maxOccurrences: undefined
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchEvents();
    fetchStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, categoryFilter, priorityFilter, showRecurringOnly, locationFilter]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events", {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error("Failed to fetch events");
      
      const data = await response.json();
      const eventsWithDates = data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      
      setEvents(eventsWithDates);
    } catch (err) {
      setError("Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/events/statistics", {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const stats = await response.json();
        setStatistics(stats);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(event => event.priority === priorityFilter);
    }
    
    if (showRecurringOnly) {
      filtered = filtered.filter(event => event.isRecurring || event.parentEventId);
    }
    
    if (locationFilter) {
      filtered = filtered.filter(event => 
        event.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    setFilteredEvents(filtered);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setShowRecurrenceModal(true);
  };

  // Aggiunge partecipante alla lista
  const addParticipant = () => {
    console.log('=== ADD PARTICIPANT DEBUG ===');
    const username = eventForm.participantUsername.trim();
    console.log('Username input:', `"${username}"`);
    console.log('Username length:', username.length);
    console.log('Current shared users:', eventForm.sharedWith);
    console.log('Username already in list:', eventForm.sharedWith.includes(username));
    
    if (username && !eventForm.sharedWith.includes(username)) {
      console.log('✅ Adding participant:', username);
      const newSharedWith = [...eventForm.sharedWith, username];
      console.log('New shared users array:', newSharedWith);
      setEventForm({
        ...eventForm,
        sharedWith: newSharedWith,
        participantUsername: ''
      });
      setError(null);
      console.log('✅ Participant added successfully');
    } else if (eventForm.sharedWith.includes(username)) {
      console.log('❌ Username already exists');
      setError('Questo utente è già stato aggiunto');
    } else if (!username) {
      console.log('❌ Empty username');
      setError('Inserisci un username');
    }
  };

  // Rimuove partecipante dalla lista
  const removeParticipant = (usernameToRemove: string) => {
    setEventForm({
      ...eventForm,
      sharedWith: eventForm.sharedWith.filter(username => username !== usernameToRemove)
    });
  };

  const createRecurringEvent = async () => {
    if (!selectedSlot) return;
    
    try {
      console.log('=== FRONTEND: Creating event ===');
      console.log('Event form sharedWith:', eventForm.sharedWith);
      console.log('Shared users length:', eventForm.sharedWith.length);
      
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.category,
        priority: eventForm.priority,
        color: eventForm.color,
        location: eventForm.location,
        notificationLeadTime: eventForm.notificationLeadTime,
        sharedWith: eventForm.sharedWith,
        start: selectedSlot.start,
        end: selectedSlot.end,
        recurrenceRule: recurrenceRule.frequency !== 'none' ? recurrenceRule : { frequency: 'none', interval: 1 }
      };
      
      console.log('Event data being sent:', eventData);

      // Usa endpoint per eventi condivisi
      const endpoint = "/api/events/shared";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) throw new Error("Failed to create recurring event");
      
      const result = await response.json();
      
      // Mostra informazioni dettagliate sui partecipanti
      let message = `✅ ${result.message || 'Evento creato con successo!'}\n`;
      if (result.eventsCreated && result.eventsCreated > 1) {
        message += `📊 Eventi creati: ${result.eventsCreated}\n`;
        message += `👥 Condiviso con: ${result.sharedWithCount || 0} utenti\n`;
      }
      if (eventForm.sharedWith.length > 0) {
        message += `📝 Utenti: ${eventForm.sharedWith.join(', ')}`;
      }
      alert(message);
      
      await fetchEvents();
      await fetchStatistics();
      setShowRecurrenceModal(false);
      
      // Reset form
      setEventForm({
        title: '',
        description: '',
        category: 'personal',
        priority: 'medium',
        color: '#4caf50',
        location: '',
        notificationLeadTime: 0,
        participantUsername: '',
        sharedWith: []
      });
      setRecurrenceRule({
        frequency: 'none',
        interval: 1,
        endDate: undefined,
        daysOfWeek: [],
        maxOccurrences: undefined
      });
      
    } catch (err) {
      setError("Error creating recurring event");
    }
  };

  const eventStyleGetter = (event: Event) => {
    return {
      style: {
        backgroundColor: event.color || '#4caf50',
        border: event.isRecurring ? '2px solid #ff9800' : '1px solid #ccc',
        opacity: event.priority === 'urgent' ? 1 : 0.8,
      }
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📅 Calendario Avanzato
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Barra Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon /> Filtri
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">Tutte</MenuItem>
                  <MenuItem value="work">Lavoro</MenuItem>
                  <MenuItem value="personal">Personale</MenuItem>
                  <MenuItem value="study">Studio</MenuItem>
                  <MenuItem value="meeting">Riunioni</MenuItem>
                  <MenuItem value="reminder">Promemoria</MenuItem>
                  <MenuItem value="project">Progetti</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">Tutte</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="low">Bassa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Luogo"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showRecurringOnly}
                    onChange={(e) => setShowRecurringOnly(e.target.checked)}
                  />
                }
                label="Solo ricorrenti"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${filteredEvents.length} eventi`}
              color="primary"
              icon={<EventIcon />}
            />
            <Button
              variant="outlined"
              startIcon={<StatsIcon />}
              onClick={() => setShowStatsModal(true)}
            >
              Statistiche
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent>
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            selectable
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            defaultView="month"
            views={["month", "week", "day", "agenda"]}
          />
        </CardContent>
      </Card>

      {/* Modal Evento Ricorrente */}
      <Dialog
        open={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <RepeatIcon /> Crea Evento Ricorrente
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titolo Evento"
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione"
                multiline
                rows={2}
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
                >
                  <MenuItem value="work">Lavoro</MenuItem>
                  <MenuItem value="personal">Personale</MenuItem>
                  <MenuItem value="study">Studio</MenuItem>
                  <MenuItem value="meeting">Riunioni</MenuItem>
                  <MenuItem value="reminder">Promemoria</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={eventForm.priority}
                  onChange={(e) => setEventForm({...eventForm, priority: e.target.value})}
                >
                  <MenuItem value="low">Bassa</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Luogo"
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="color"
                label="Colore"
                value={eventForm.color}
                onChange={(e) => setEventForm({...eventForm, color: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                👥 Condivisione Evento
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                👥 Aggiungi gli username degli utenti con cui vuoi condividere questo evento. 
                L'evento apparirà nel loro calendario e potranno visualizzarlo.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Username partecipante"
                  type="text"
                  placeholder="nomeutente"
                  value={eventForm.participantUsername}
                  onChange={(e) => setEventForm({...eventForm, participantUsername: e.target.value})}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addParticipant();
                    }
                  }}
                />
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    console.log('🔥 BUTTON CLICKED - Adding participant');
                    alert('Pulsante cliccato!'); // Alert visibile per debug
                    addParticipant();
                  }}
                  sx={{ minWidth: 'auto' }}
                >
                  Aggiungi
                </Button>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => {
                    console.log('🧪 TEST: Adding test user');
                    setEventForm({
                      ...eventForm,
                      sharedWith: [...eventForm.sharedWith, 'testuser'],
                    });
                    alert('Test user aggiunto direttamente!');
                  }}
                  sx={{ minWidth: 'auto', ml: 1 }}
                >
                  Test
                </Button>
              </Box>
            </Grid>
            
            {eventForm.sharedWith.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  L'evento sarà condiviso con questi utenti:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {eventForm.sharedWith.map((username, index) => (
                    <Chip
                      key={index}
                      label={username}
                      onDelete={() => {
                        console.log('🗑️ Removing participant:', username);
                        removeParticipant(username);
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🔄 Ricorrenza
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Frequenza</InputLabel>
                <Select
                  value={recurrenceRule.frequency}
                  onChange={(e) => setRecurrenceRule({
                    ...recurrenceRule, 
                    frequency: e.target.value as any
                  })}
                >
                  <MenuItem value="none">Nessuna</MenuItem>
                  <MenuItem value="daily">Giornaliera</MenuItem>
                  <MenuItem value="weekly">Settimanale</MenuItem>
                  <MenuItem value="monthly">Mensile</MenuItem>
                  <MenuItem value="yearly">Annuale</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {recurrenceRule.frequency !== 'none' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Intervallo"
                    value={recurrenceRule.interval}
                    onChange={(e) => setRecurrenceRule({
                      ...recurrenceRule, 
                      interval: parseInt(e.target.value) || 1
                    })}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Fine"
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => setRecurrenceRule({
                      ...recurrenceRule, 
                      endDate: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Occorrenze Massime"
                    onChange={(e) => setRecurrenceRule({
                      ...recurrenceRule, 
                      maxOccurrences: parseInt(e.target.value) || undefined
                    })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecurrenceModal(false)}>
            Annulla
          </Button>
          <Button 
            onClick={createRecurringEvent}
            variant="contained"
            disabled={!eventForm.title}
          >
            Crea Evento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Statistiche */}
      <Dialog
        open={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <StatsIcon /> Statistiche Calendario
        </DialogTitle>
        <DialogContent>
          {statistics && (
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="primary">
                      {statistics.totalEvents}
                    </Typography>
                    <Typography variant="body2">
                      Eventi Totali
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="secondary">
                      {statistics.recurringEvents}
                    </Typography>
                    <Typography variant="body2">
                      Eventi Ricorrenti
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="success.main">
                      {statistics.projectEvents}
                    </Typography>
                    <Typography variant="body2">
                      Eventi Progetti
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" color="warning.main">
                      {statistics.eventsThisMonth}
                    </Typography>
                    <Typography variant="body2">
                      Questo Mese
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Per Categoria
                    </Typography>
                    {statistics.eventsByCategory.map((cat) => (
                      <Chip
                        key={cat._id}
                        label={`${cat._id}: ${cat.count}`}
                        sx={{ m: 0.5 }}
                        variant="outlined"
                      />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Per Priorità
                    </Typography>
                    {statistics.eventsByPriority.map((priority) => (
                      <Chip
                        key={priority._id}
                        label={`${priority._id}: ${priority.count}`}
                        sx={{ 
                          m: 0.5,
                          backgroundColor: getPriorityColor(priority._id),
                          color: 'white'
                        }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatsModal(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedCalendar; 