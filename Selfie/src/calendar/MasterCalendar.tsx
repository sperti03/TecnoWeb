import React, { useEffect, useState, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
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
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  Divider
} from "@mui/material";
import {
  EventNote as EventIcon,
  FilterList as FilterIcon,
  Assessment as StatsIcon,
  Repeat as RepeatIcon,
  Add as AddIcon,
  Group as GroupIcon,
  School as StudyIcon,
  Work as ProjectIcon,
  Note as NoteIcon,
  CloudUpload as ImportIcon,
  CloudDownload as ExportIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  PriorityHigh as PriorityIcon,
  Sync as SyncIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import "./MasterCalendar.css";

// Import degli altri componenti calendario
import CalendarImportExport from './CalendarImportExport';
import CalendarProjectIntegration from '../Progetti/CalendarProjectIntegration.js';
import { StudyCycleService } from '../StudyCycle/StudyCycleService';
import { StudyCycleAutoService } from '../services/StudyCycleAutoService';

const localizer = momentLocalizer(moment);

// Interfaccia evento unificata che supporta tutti i tipi
interface UnifiedEvent {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  
  // Tipologia e metadati
  eventType: 'general' | 'study-cycle' | 'project' | 'note-todo' | 'recurring' | 'milestone';
  category: 'personal' | 'work' | 'study' | 'meeting' | 'reminder' | 'project' | 'milestone';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  color: string;
  location?: string;
  
  // Partecipanti e condivisione
  participants?: string[];
  sharedWith?: string[];
  createdBy?: string;
  
  // Eventi ricorrenti
  isRecurring?: boolean;
  parentEventId?: string;
  recurrenceRule?: {
    frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
    maxOccurrences?: number;
  };
  
  // Integrazione progetti
  isProjectEvent?: boolean;
  projectEventData?: {
    projectId: string;
    taskId: string;
    type: 'task' | 'milestone' | 'deadline';
  };
  
  // Study cycles
  studyCycleId?: string;
  studyCycleData?: {
    studyTime: number;
    pauseTime: number;
    cycles: number;
    subject: string;
  };
  
  // Note integration
  noteId?: string;
  todoText?: string;
  
  // Notifiche e reminder
  notificationLeadTime: number;
  reminderSent?: boolean;
  
  // Metadati
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FilterState {
  eventType: 'all' | 'general' | 'study-cycle' | 'project' | 'note-todo' | 'recurring';
  category: 'all' | 'personal' | 'work' | 'study' | 'meeting' | 'reminder' | 'project' | 'milestone';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  showRecurringOnly: boolean;
  location: string;
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

interface Statistics {
  totalEvents: number;
  recurringEvents: number;
  projectEvents: number;
  studyCycleEvents: number;
  noteEvents: number;
  eventsThisMonth: number;
  eventsThisWeek: number;
  eventsByCategory: Array<{ _id: string; count: number }>;
  eventsByPriority: Array<{ _id: string; count: number }>;
  eventsByType: Array<{ _id: string; count: number }>;
}

const MasterCalendar: React.FC = () => {
  // Stati principali
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  // UI State
  const [currentTab, setCurrentTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  
  // Filtri e ricerca
  const [filters, setFilters] = useState<FilterState>({
    eventType: 'all',
    category: 'all',
    priority: 'all',
    showRecurringOnly: false,
    location: '',
    dateRange: {}
  });
  
  // Modali
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showStudyCycleModal, setShowStudyCycleModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  
  // Eventi selezionati e form
  const [selectedSlot, setSelectedSlot] = useState<{start: Date; end: Date} | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    color: '#4caf50',
    location: '',
    notificationLeadTime: 0,
    participants: [] as string[],
    participantEmail: '',
    eventType: 'general',
    isRecurring: false,
    recurrenceRule: {
      frequency: 'none' as const,
      interval: 1,
      endDate: undefined as Date | undefined,
      daysOfWeek: [] as number[],
      maxOccurrences: undefined as number | undefined
    }
  });

  // Sincronizzazione e integrazione
  const [syncStatus, setSyncStatus] = useState({
    projects: false,
    studyCycles: false,
    notes: false
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // =======================
  // CARICAMENTO DATI
  // =======================
  
  useEffect(() => {
    loadAllData();
    
    // Auto-reschedule per study cycles
    autoRescheduleStudyCycles();
    
    // Setup notifiche
    setupNotifications();
    
    // Cleanup interval
    const intervalId = setInterval(checkUpcomingEvents, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEvents(),
        loadStatistics(),
        syncProjectEvents(),
        syncStudyCycleEvents(),
        syncNoteEvents()
      ]);
    } catch (err) {
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      const unifiedEvents = data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        createdAt: new Date(event.createdAt || Date.now()),
        updatedAt: new Date(event.updatedAt || Date.now())
      }));
      
      setEvents(unifiedEvents);
      setFilteredEvents(unifiedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/events/statistics', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const stats = await response.json();
        setStatistics(stats);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  // =======================
  // SINCRONIZZAZIONE
  // =======================

  const syncProjectEvents = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, projects: true }));
      // Implementa sincronizzazione progetti
      console.log('Syncing project events...');
      
      // Qui andrà la logica di sincronizzazione con i progetti
      
      setSyncStatus(prev => ({ ...prev, projects: false }));
    } catch (err) {
      console.error('Error syncing project events:', err);
      setSyncStatus(prev => ({ ...prev, projects: false }));
    }
  };

  const syncStudyCycleEvents = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, studyCycles: true }));
      await StudyCycleAutoService.syncToCalendar();
      setSyncStatus(prev => ({ ...prev, studyCycles: false }));
    } catch (err) {
      console.error('Error syncing study cycle events:', err);
      setSyncStatus(prev => ({ ...prev, studyCycles: false }));
    }
  };

  const syncNoteEvents = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, notes: true }));
      
      // Carica eventi dalle note con to-do
      const response = await fetch('/api/events?fromNotes=true', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const noteEvents = await response.json();
        // Merge con eventi esistenti
        setEvents(prev => {
          const nonNoteEvents = prev.filter(e => e.eventType !== 'note-todo');
          const mappedNoteEvents = noteEvents.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
            eventType: 'note-todo' as const,
            category: 'reminder' as const
          }));
          return [...nonNoteEvents, ...mappedNoteEvents];
        });
      }
      
      setSyncStatus(prev => ({ ...prev, notes: false }));
    } catch (err) {
      console.error('Error syncing note events:', err);
      setSyncStatus(prev => ({ ...prev, notes: false }));
    }
  };

  const autoRescheduleStudyCycles = async () => {
    try {
      await StudyCycleService.rescheduleIncomplete();
    } catch (error) {
      console.log("Auto-reschedule completed");
    }
  };

  // =======================
  // FILTRI E RICERCA
  // =======================

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const applyFilters = () => {
    let filtered = [...events];

    // Filtro per tipo evento
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }

    // Filtro per categoria
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // Filtro per priorità
    if (filters.priority !== 'all') {
      filtered = filtered.filter(event => event.priority === filters.priority);
    }

    // Filtro per eventi ricorrenti
    if (filters.showRecurringOnly) {
      filtered = filtered.filter(event => event.isRecurring);
    }

    // Filtro per location
    if (filters.location) {
      filtered = filtered.filter(event => 
        event.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filtro per date range
    if (filters.dateRange.start) {
      filtered = filtered.filter(event => event.start >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(event => event.end <= filters.dateRange.end!);
    }

    setFilteredEvents(filtered);
  };

  // =======================
  // GESTIONE EVENTI
  // =======================

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setEventForm({
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      color: '#4caf50',
      location: '',
      notificationLeadTime: 0,
      participants: [],
      participantEmail: '',
      eventType: 'general',
      isRecurring: false,
      recurrenceRule: {
        frequency: 'none',
        interval: 1,
        endDate: undefined,
        daysOfWeek: [],
        maxOccurrences: undefined
      }
    });
    setShowEventModal(true);
  };

  const handleEventClick = (event: UnifiedEvent) => {
    setSelectedEvent(event);
    
    // Azioni specifiche per tipo evento
    switch (event.eventType) {
      case 'study-cycle':
        if (event.studyCycleId) {
          const shouldOpenPomodoro = window.confirm(
            'Questo è un Study Cycle. Vuoi aprire il Pomodoro Timer?'
          );
          if (shouldOpenPomodoro) {
            window.open(`/Pomodoro?studyCycleId=${event.studyCycleId}`, '_blank');
            return;
          }
        }
        break;
        
      case 'project':
        if (event.projectEventData) {
          const shouldOpenProject = window.confirm(
            'Questo è un evento di progetto. Vuoi aprire il progetto?'
          );
          if (shouldOpenProject) {
            window.open(`/Progetti?projectId=${event.projectEventData.projectId}`, '_blank');
            return;
          }
        }
        break;
        
      case 'note-todo':
        if (event.noteId) {
          const shouldOpenNote = window.confirm(
            'Questo è un to-do da nota. Vuoi aprire la nota?'
          );
          if (shouldOpenNote) {
            window.open(`/Note?noteId=${event.noteId}`, '_blank');
            return;
          }
        }
        break;
    }
    
    setShowEventDetailsModal(true);
  };

  const createEvent = async () => {
    if (!selectedSlot || !eventForm.title.trim()) {
      setError('Il titolo dell\'evento è obbligatorio');
      return;
    }

    try {
      const newEvent = {
        title: eventForm.title,
        description: eventForm.description,
        start: selectedSlot.start,
        end: selectedSlot.end,
        category: eventForm.category,
        priority: eventForm.priority,
        color: eventForm.color,
        location: eventForm.location,
        notificationLeadTime: eventForm.notificationLeadTime,
        participants: eventForm.participants,
        eventType: eventForm.eventType,
        isRecurring: eventForm.isRecurring,
        recurrenceRule: eventForm.isRecurring ? eventForm.recurrenceRule : undefined
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) throw new Error('Failed to create event');

      const result = await response.json();
      const event = result.event || result;
      
      setEvents(prev => [...prev, {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        createdAt: new Date(event.createdAt || Date.now()),
        updatedAt: new Date(event.updatedAt || Date.now())
      }]);

      setShowEventModal(false);
      setError(null);
      
      // Mostra messaggio successo
      if (result.participantsInfo) {
        alert(`Evento creato con successo! ${result.participantsInfo.eventsCreated} eventi creati.`);
      }

    } catch (err) {
      setError('Errore durante la creazione dell\'evento');
    }
  };

  // =======================
  // NOTIFICHE
  // =======================

  const setupNotifications = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const checkUpcomingEvents = () => {
    const now = new Date();
    filteredEvents.forEach((event) => {
      const diffInMinutes = (event.start.getTime() - now.getTime()) / 60000;
      if (diffInMinutes <= event.notificationLeadTime && diffInMinutes > 0 && !event.reminderSent) {
        sendNotification(event);
        // Marca come inviato (in un'app reale, salveresti nel DB)
        event.reminderSent = true;
      }
    });
  };

  const sendNotification = (event: UnifiedEvent) => {
    if (Notification.permission === 'granted') {
      const icon = getEventIcon(event.eventType);
      new Notification(`${icon} ${event.title}`, {
        body: `Inizia tra ${event.notificationLeadTime} minuti`,
        icon: '/logo.png',
      });
    }
  };

  // =======================
  // UTILITY FUNCTIONS
  // =======================

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'study-cycle': return '📚';
      case 'project': return '🚀';
      case 'note-todo': return '📝';
      case 'recurring': return '🔄';
      case 'milestone': return '🎯';
      default: return '📅';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'study-cycle': return 'Study Cycle';
      case 'project': return 'Progetto';
      case 'note-todo': return 'To-Do Note';
      case 'recurring': return 'Ricorrente';
      case 'milestone': return 'Milestone';
      default: return 'Generale';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'work': return '💼 Lavoro';
      case 'personal': return '👤 Personale';
      case 'study': return '📖 Studio';
      case 'meeting': return '🤝 Riunione';
      case 'reminder': return '⏰ Promemoria';
      case 'project': return '🚀 Progetto';
      case 'milestone': return '🎯 Milestone';
      default: return '📋 Altro';
    }
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

  // =======================
  // RENDER COMPONENTI
  // =======================

  const renderFilterDrawer = () => (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 300, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎛️ Filtri Avanzati
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Filtro Tipo Evento */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo Evento</InputLabel>
          <Select
            value={filters.eventType}
            label="Tipo Evento"
            onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value as any }))}
          >
            <MenuItem value="all">🔍 Tutti</MenuItem>
            <MenuItem value="general">📅 Generale</MenuItem>
            <MenuItem value="study-cycle">📚 Study Cycle</MenuItem>
            <MenuItem value="project">🚀 Progetto</MenuItem>
            <MenuItem value="note-todo">📝 To-Do Note</MenuItem>
            <MenuItem value="recurring">🔄 Ricorrente</MenuItem>
          </Select>
        </FormControl>

        {/* Filtro Categoria */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={filters.category}
            label="Categoria"
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
          >
            <MenuItem value="all">🔍 Tutte</MenuItem>
            <MenuItem value="personal">👤 Personale</MenuItem>
            <MenuItem value="work">💼 Lavoro</MenuItem>
            <MenuItem value="study">📖 Studio</MenuItem>
            <MenuItem value="meeting">🤝 Riunione</MenuItem>
            <MenuItem value="reminder">⏰ Promemoria</MenuItem>
            <MenuItem value="project">🚀 Progetto</MenuItem>
            <MenuItem value="milestone">🎯 Milestone</MenuItem>
          </Select>
        </FormControl>

        {/* Filtro Priorità */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Priorità</InputLabel>
          <Select
            value={filters.priority}
            label="Priorità"
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
          >
            <MenuItem value="all">🔍 Tutte</MenuItem>
            <MenuItem value="urgent">🔴 Urgente</MenuItem>
            <MenuItem value="high">🟠 Alta</MenuItem>
            <MenuItem value="medium">🟡 Media</MenuItem>
            <MenuItem value="low">🟢 Bassa</MenuItem>
          </Select>
        </FormControl>

        {/* Filtro Location */}
        <TextField
          fullWidth
          label="📍 Filtra per Luogo"
          value={filters.location}
          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          sx={{ mb: 2 }}
        />

        {/* Toggle Ricorrenti */}
        <FormControlLabel
          control={
            <Switch
              checked={filters.showRecurringOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, showRecurringOnly: e.target.checked }))}
            />
          }
          label="🔄 Solo Eventi Ricorrenti"
        />

        <Divider sx={{ my: 2 }} />
        
        {/* Sync Status */}
        <Typography variant="subtitle2" gutterBottom>
          📡 Stato Sincronizzazione
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemIcon>
              {syncStatus.projects ? <SyncIcon className="rotating" /> : <ProjectIcon />}
            </ListItemIcon>
            <ListItemText primary="Progetti" secondary={syncStatus.projects ? 'Sincronizzando...' : 'Sincronizzato'} />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              {syncStatus.studyCycles ? <SyncIcon className="rotating" /> : <StudyIcon />}
            </ListItemIcon>
            <ListItemText primary="Study Cycles" secondary={syncStatus.studyCycles ? 'Sincronizzando...' : 'Sincronizzato'} />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              {syncStatus.notes ? <SyncIcon className="rotating" /> : <NoteIcon />}
            </ListItemIcon>
            <ListItemText primary="Note" secondary={syncStatus.notes ? 'Sincronizzando...' : 'Sincronizzato'} />
          </ListItem>
        </List>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<SyncIcon />}
          onClick={loadAllData}
          sx={{ mt: 2 }}
        >
          🔄 Aggiorna Tutto
        </Button>
      </Box>
    </Drawer>
  );

  const renderSpeedDial = () => (
    <SpeedDial
      ariaLabel="Azioni Rapide"
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      icon={<AddIcon />}
      open={speedDialOpen}
      onOpen={() => setSpeedDialOpen(true)}
      onClose={() => setSpeedDialOpen(false)}
    >
      <SpeedDialAction
        icon={<EventIcon />}
        tooltipTitle="Nuovo Evento"
        onClick={() => {
          setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 3600000) });
          setShowEventModal(true);
          setSpeedDialOpen(false);
        }}
      />
      <SpeedDialAction
        icon={<RepeatIcon />}
        tooltipTitle="Evento Ricorrente"
        onClick={() => {
          setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 3600000) });
          setEventForm(prev => ({ ...prev, isRecurring: true }));
          setShowEventModal(true);
          setSpeedDialOpen(false);
        }}
      />
      <SpeedDialAction
        icon={<StudyIcon />}
        tooltipTitle="Study Cycle"
        onClick={() => {
          setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 3600000) });
          setShowStudyCycleModal(true);
          setSpeedDialOpen(false);
        }}
      />
      <SpeedDialAction
        icon={<ProjectIcon />}
        tooltipTitle="Evento Progetto"
        onClick={() => {
          setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 3600000) });
          setShowProjectModal(true);
          setSpeedDialOpen(false);
        }}
      />
      <SpeedDialAction
        icon={<ImportIcon />}
        tooltipTitle="Import/Export"
        onClick={() => {
          setShowImportExportModal(true);
          setSpeedDialOpen(false);
        }}
      />
    </SpeedDial>
  );

  const renderStatsCards = () => {
    if (!statistics) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                📅 Eventi Totali
              </Typography>
              <Typography variant="h4" component="div">
                {statistics.totalEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                🔄 Ricorrenti
              </Typography>
              <Typography variant="h4" component="div">
                {statistics.recurringEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                🚀 Progetti
              </Typography>
              <Typography variant="h4" component="div">
                {statistics.projectEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                📚 Study Cycles
              </Typography>
              <Typography variant="h4" component="div">
                {statistics.studyCycleEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // =======================
  // RENDER PRINCIPALE
  // =======================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
        <Typography sx={{ ml: 2 }}>Caricamento calendario master...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🗓️ Master Calendar - Unificato
          </Typography>
          
          <Badge badgeContent={filteredEvents.length} color="secondary">
            <EventIcon />
          </Badge>
          
          <IconButton color="inherit" onClick={() => setShowStatsModal(true)}>
            <StatsIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={() => setShowImportExportModal(true)}>
            <ImportIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Stats Cards */}
      <Box sx={{ p: 2 }}>
        {renderStatsCards()}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtri Quick */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Chip
              label={`${filteredEvents.length} eventi`}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`Tipo: ${getEventTypeLabel(filters.eventType)}`}
              onDelete={filters.eventType !== 'all' ? () => setFilters(prev => ({ ...prev, eventType: 'all' })) : undefined}
              size="small"
              color={filters.eventType !== 'all' ? 'primary' : 'default'}
            />
          </Grid>
          <Grid item>
            <Chip
              label={`Categoria: ${getCategoryLabel(filters.category)}`}
              onDelete={filters.category !== 'all' ? () => setFilters(prev => ({ ...prev, category: 'all' })) : undefined}
              size="small"
              color={filters.category !== 'all' ? 'primary' : 'default'}
            />
          </Grid>
          {filters.showRecurringOnly && (
            <Grid item>
              <Chip
                label="🔄 Solo Ricorrenti"
                onDelete={() => setFilters(prev => ({ ...prev, showRecurringOnly: false }))}
                size="small"
                color="primary"
              />
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Calendario Principale */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventClick}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color || getPriorityColor(event.priority),
              borderColor: event.color || getPriorityColor(event.priority),
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '4px',
              border: `2px solid ${event.color || getPriorityColor(event.priority)}`,
            }
          })}
          formats={{
            eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
              const fmt = localizer && (localizer as any).format ? (localizer as any).format : undefined;
              const startStr = fmt ? fmt(start, 'HH:mm', culture) : '';
              const endStr = fmt ? fmt(end, 'HH:mm', culture) : '';
              return `${startStr} - ${endStr}`;
            },
            dayHeaderFormat: (date: Date, culture?: string, localizer?: any) => {
              const fmt = localizer && localizer.format ? localizer.format : undefined;
              return fmt ? fmt(date, 'dddd DD/MM', culture) : '';
            },
          }}
          messages={{
            allDay: 'Tutto il giorno',
            previous: '← Precedente',
            next: 'Successivo →',
            today: 'Oggi',
            month: 'Mese',
            week: 'Settimana',
            day: 'Giorno',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Ora',
            event: 'Evento',
            noEventsInRange: 'Nessun evento in questo periodo',
            showMore: (total) => `+ Altri ${total}`
          }}
        />
      </Box>

      {/* Drawer Filtri */}
      {renderFilterDrawer()}

      {/* Speed Dial */}
      {renderSpeedDial()}

      {/* Modal Evento Base */}
      <Dialog open={showEventModal} onClose={() => setShowEventModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {getEventIcon(eventForm.eventType)} Nuovo Evento
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titolo Evento"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrizione"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={eventForm.category}
                  label="Categoria"
                  onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value as any }))}
                >
                  <MenuItem value="personal">👤 Personale</MenuItem>
                  <MenuItem value="work">💼 Lavoro</MenuItem>
                  <MenuItem value="study">📖 Studio</MenuItem>
                  <MenuItem value="meeting">🤝 Riunione</MenuItem>
                  <MenuItem value="reminder">⏰ Promemoria</MenuItem>
                  <MenuItem value="project">🚀 Progetto</MenuItem>
                  <MenuItem value="milestone">🎯 Milestone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={eventForm.priority}
                  label="Priorità"
                  onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="low">🟢 Bassa</MenuItem>
                  <MenuItem value="medium">🟡 Media</MenuItem>
                  <MenuItem value="high">🟠 Alta</MenuItem>
                  <MenuItem value="urgent">🔴 Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="📍 Luogo"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="⏰ Notifica (minuti prima)"
                value={eventForm.notificationLeadTime}
                onChange={(e) => setEventForm(prev => ({ ...prev, notificationLeadTime: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={eventForm.isRecurring}
                    onChange={(e) => setEventForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  />
                }
                label="🔄 Evento Ricorrente"
              />
            </Grid>
            
            {eventForm.isRecurring && (
              <>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequenza</InputLabel>
                    <Select
                      value={eventForm.recurrenceRule.frequency}
                      label="Frequenza"
                      onChange={(e) => setEventForm(prev => ({
                        ...prev,
                        recurrenceRule: {
                          ...prev.recurrenceRule,
                          frequency: e.target.value as any
                        }
                      }))}
                    >
                      <MenuItem value="daily">📅 Giornaliera</MenuItem>
                      <MenuItem value="weekly">📅 Settimanale</MenuItem>
                      <MenuItem value="monthly">📅 Mensile</MenuItem>
                      <MenuItem value="yearly">📅 Annuale</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Intervallo"
                    value={eventForm.recurrenceRule.interval}
                    onChange={(e) => setEventForm(prev => ({
                      ...prev,
                      recurrenceRule: {
                        ...prev.recurrenceRule,
                        interval: parseInt(e.target.value) || 1
                      }
                    }))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </>
            )}

            {/* Partecipanti */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                👥 Partecipanti
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Email partecipante"
                  value={eventForm.participantEmail}
                  onChange={(e) => setEventForm(prev => ({ ...prev, participantEmail: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const email = eventForm.participantEmail.trim();
                      if (email && email.includes('@') && !eventForm.participants.includes(email)) {
                        setEventForm(prev => ({
                          ...prev,
                          participants: [...prev.participants, email],
                          participantEmail: ''
                        }));
                      }
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    const email = eventForm.participantEmail.trim();
                    if (email && email.includes('@') && !eventForm.participants.includes(email)) {
                      setEventForm(prev => ({
                        ...prev,
                        participants: [...prev.participants, email],
                        participantEmail: ''
                      }));
                    }
                  }}
                >
                  Aggiungi
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {eventForm.participants.map((email, index) => (
                  <Chip
                    key={index}
                    label={email}
                    onDelete={() => setEventForm(prev => ({
                      ...prev,
                      participants: prev.participants.filter((_, i) => i !== index)
                    }))}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventModal(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={createEvent}
            disabled={!eventForm.title.trim()}
          >
            Crea Evento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Dettagli Evento */}
      <Dialog open={showEventDetailsModal} onClose={() => setShowEventDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEvent && getEventIcon(selectedEvent.eventType)} Dettagli Evento
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.title}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  📅 Data e Ora
                </Typography>
                <Typography variant="body1">
                  {selectedEvent.start.toLocaleDateString('it-IT')} {selectedEvent.start.toLocaleTimeString('it-IT')} - {selectedEvent.end.toLocaleTimeString('it-IT')}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  🏷️ Tipo
                </Typography>
                <Typography variant="body1">
                  {getEventTypeLabel(selectedEvent.eventType)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  📂 Categoria
                </Typography>
                <Typography variant="body1">
                  {getCategoryLabel(selectedEvent.category)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  🎯 Priorità
                </Typography>
                <Chip
                  label={selectedEvent.priority}
                  size="small"
                  style={{ backgroundColor: getPriorityColor(selectedEvent.priority), color: 'white' }}
                />
              </Grid>
              
              {selectedEvent.location && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    📍 Luogo
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.location}
                  </Typography>
                </Grid>
              )}
              
              {selectedEvent.description && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    📝 Descrizione
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.description}
                  </Typography>
                </Grid>
              )}
              
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    👥 Partecipanti
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedEvent.participants.map((email, index) => (
                      <Chip key={index} label={email} size="small" />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {selectedEvent.isRecurring && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    🔄 Ricorrenza
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.recurrenceRule?.frequency === 'daily' && 'Giornaliera'}
                    {selectedEvent.recurrenceRule?.frequency === 'weekly' && 'Settimanale'}
                    {selectedEvent.recurrenceRule?.frequency === 'monthly' && 'Mensile'}
                    {selectedEvent.recurrenceRule?.frequency === 'yearly' && 'Annuale'}
                    {selectedEvent.recurrenceRule?.interval && selectedEvent.recurrenceRule.interval > 1 && 
                      ` (ogni ${selectedEvent.recurrenceRule.interval})`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDetailsModal(false)}>
            Chiudi
          </Button>
          {selectedEvent && (
            <Button variant="outlined" color="primary">
              Modifica
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal Import/Export */}
      {showImportExportModal && (
        <CalendarImportExport
          open={showImportExportModal}
          onClose={() => setShowImportExportModal(false)}
          onEventsImported={(importedEvents) => {
            setEvents(prev => [...prev, ...importedEvents]);
            setShowImportExportModal(false);
          }}
        />
      )}

      {/* Modal Statistiche */}
      <Dialog open={showStatsModal} onClose={() => setShowStatsModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          📊 Statistiche Calendario Master
        </DialogTitle>
        <DialogContent>
          {statistics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Panoramica Generale
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Eventi Totali" secondary={statistics.totalEvents} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Eventi Ricorrenti" secondary={statistics.recurringEvents} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Eventi Progetto" secondary={statistics.projectEvents} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Study Cycles" secondary={statistics.studyCycleEvents} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="To-Do da Note" secondary={statistics.noteEvents} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📅 Eventi per Periodo
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Questo Mese" secondary={statistics.eventsThisMonth} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Questa Settimana" secondary={statistics.eventsThisWeek} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📂 Eventi per Categoria
                    </Typography>
                    <List dense>
                      {statistics.eventsByCategory.map((cat, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={getCategoryLabel(cat._id)} 
                            secondary={cat.count} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎯 Eventi per Priorità
                    </Typography>
                    <List dense>
                      {statistics.eventsByPriority.map((pri, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={pri._id} 
                            secondary={pri.count} 
                          />
                          <Chip
                            size="small"
                            style={{ backgroundColor: getPriorityColor(pri._id), color: 'white' }}
                            label={pri.count}
                          />
                        </ListItem>
                      ))}
                    </List>
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

export default MasterCalendar; 