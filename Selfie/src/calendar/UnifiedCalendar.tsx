import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './UnifiedCalendar.css';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SyncIcon from '@mui/icons-material/Sync';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FolderIcon from '@mui/icons-material/Folder';
import TaskIcon from '@mui/icons-material/Task';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import logo from './images/logo.png';
import CalendarProjectIntegration from '../Progetti/CalendarProjectIntegration.js';
import projectService from '../Progetti/ProjectService.js';

const localizer = momentLocalizer(moment);

// Local interfaces (JS backend in Progetti)
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  type?: 'event' | 'task' | 'milestone' | string;
  projectId?: string;
  taskId?: string;
  notificationLeadTime?: number;
  repeatInterval?: number;
  participants?: { email?: string; userId?: string }[];
  createdByEmail?: string;
  _id?: string;
  userId?: string;
}

interface Project {
  _id?: string;
  name: string;
  description: string;
  owner: string;
  phases: any[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SyncOptions {
  includeAllTasks?: boolean;
  includeMilestones?: boolean;
  onlyUserTasks?: boolean;
  notificationLeadTime?: number;
}

type FilterType = 'all' | 'events' | 'projects' | 'tasks' | 'milestones';

interface UnifiedCalendarProps {
  defaultFilter?: FilterType;
}

const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({ defaultFilter = 'all' }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>(defaultFilter);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    includeAllTasks: false,
    includeMilestones: true,
    onlyUserTasks: true,
    notificationLeadTime: 30
  });
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);
  
  // Stati per modal dettagli evento
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const integration = new CalendarProjectIntegration();

  // Helper functions per formattazione
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeLabel = (type?: string) => {
    switch (type) {
      case 'task': return '📋 Task Progetto';
      case 'milestone': return '🎯 Milestone';
      case 'event': return '📅 Evento';
      default: return '📅 Evento';
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carica eventi e progetti in parallelo
      const [eventsData, projectsData] = await Promise.all([
        integration.getUnifiedCalendarEvents(),
        projectService.getProjects()
      ]);

      setEvents(eventsData);
      setProjects(projectsData);
      
      // Calcola statistiche
      const stats = integration.getIntegrationStats(projectsData);
      setSyncStats(stats);
      
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = (): CalendarEvent[] => {
    switch (filter) {
      case 'events':
        return events.filter(e => e.type === 'event' || !e.type);
      case 'projects':
        return events.filter(e => e.projectId);
      case 'tasks':
        return events.filter(e => e.type === 'task');
      case 'milestones':
        return events.filter(e => e.type === 'milestone');
      default:
        return events;
    }
  };

  const getEventStyle = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let color = 'white';

    switch (event.type) {
      case 'task':
        backgroundColor = '#4caf50'; // Verde per task
        break;
      case 'milestone':
        backgroundColor = '#ff9800'; // Arancione per milestone
        break;
      case 'event':
      default:
        backgroundColor = '#3174ad'; // Blu per eventi normali
        break;
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await integration.syncProjectsToCalendar(projects, syncOptions);
      await loadData(); // Ricarica i dati dopo la sincronizzazione
      setSyncModalOpen(false);
    } catch (err) {
      setError('Errore durante la sincronizzazione');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const getFilterStats = () => {
    const filtered = getFilteredEvents();
    const total = events.length;
    return { filtered: filtered.length, total };
  };

  if (loading) return <div>Caricamento calendario...</div>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const filteredEvents = getFilteredEvents();
  const { filtered, total } = getFilterStats();

  return (
    <div className="unified-calendar">
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        p: 2,
        backgroundColor: '#f5f5f5',
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img src={logo} alt="Logo" style={{ height: 40 }} />
          <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 600 }}>
            Calendario Unificato
          </Typography>
          <Chip 
            label={`${filtered}/${total} eventi`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Sincronizza progetti">
            <IconButton 
              color="primary" 
              onClick={() => setSyncModalOpen(true)}
              disabled={syncing}
            >
              <SyncIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtri */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1, fontWeight: 500 }}>
          Filtri:
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button 
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'contained' : 'outlined'}
            startIcon={<CalendarMonthIcon />}
          >
            Tutto ({events.length})
          </Button>
          <Button 
            onClick={() => setFilter('events')}
            variant={filter === 'events' ? 'contained' : 'outlined'}
            startIcon={<CalendarMonthIcon />}
          >
            Eventi ({events.filter(e => e.type === 'event' || !e.type).length})
          </Button>
          <Button 
            onClick={() => setFilter('projects')}
            variant={filter === 'projects' ? 'contained' : 'outlined'}
            startIcon={<FolderIcon />}
          >
            Progetti ({events.filter(e => e.projectId).length})
          </Button>
          <Button 
            onClick={() => setFilter('tasks')}
            variant={filter === 'tasks' ? 'contained' : 'outlined'}
            startIcon={<TaskIcon />}
          >
            Task ({events.filter(e => e.type === 'task').length})
          </Button>
          <Button 
            onClick={() => setFilter('milestones')}
            variant={filter === 'milestones' ? 'contained' : 'outlined'}
            startIcon={<EmojiEventsIcon />}
          >
            Milestone ({events.filter(e => e.type === 'milestone').length})
          </Button>
        </ButtonGroup>
      </Box>

      {/* Statistiche sincronizzazione */}
      {syncStats && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              📊 Statistiche progetti: {syncStats.totalTasks} task totali, 
              {syncStats.totalMilestones} milestone, 
              {syncStats.syncableTasks} task sincronizzabili, 
              {syncStats.syncableMilestones} milestone sincronizzabili
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Calendario */}
      <Calendar
        localizer={localizer}
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        style={{ 
          height: 600, 
          margin: '0 auto', 
          background: 'white', 
          borderRadius: 12, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)', 
          padding: 16
        }}
        eventPropGetter={getEventStyle}
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        popup
        tooltipAccessor={(event) => event.description || event.title}
        onSelectEvent={(event) => {
          // Mostra dettagli evento
          setSelectedEvent(event);
          setShowEventDetailsModal(true);
        }}
      />

      {/* Modal Sincronizzazione */}
      <Modal open={syncModalOpen} onClose={() => setSyncModalOpen(false)}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 500, 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          boxShadow: 24, 
          p: 4 
        }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Sincronizzazione Progetti
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={syncOptions.includeMilestones}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    includeMilestones: e.target.checked
                  })}
                />
              }
              label="Includi milestone"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={syncOptions.includeAllTasks}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    includeAllTasks: e.target.checked
                  })}
                />
              }
              label="Includi tutti i task"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={syncOptions.onlyUserTasks}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    onlyUserTasks: e.target.checked
                  })}
                />
              }
              label="Solo task dell'utente"
            />
          </Box>

          <TextField
            label="Minuti di preavviso"
            type="number"
            value={syncOptions.notificationLeadTime}
            onChange={(e) => setSyncOptions({
              ...syncOptions,
              notificationLeadTime: parseInt(e.target.value) || 30
            })}
            fullWidth
            sx={{ mb: 3 }}
          />

          {syncStats && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Verranno sincronizzati {syncOptions.includeMilestones ? syncStats.syncableMilestones : 0} milestone 
              {syncOptions.includeAllTasks ? ` e ${syncStats.syncableTasks} task` : ''}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => setSyncModalOpen(false)}
              disabled={syncing}
            >
              Annulla
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSync}
              disabled={syncing}
              startIcon={syncing ? undefined : <SyncIcon />}
            >
              {syncing ? 'Sincronizzazione...' : 'Sincronizza'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal per visualizzare dettagli evento */}
      <Dialog 
        open={showEventDetailsModal} 
        onClose={() => setShowEventDetailsModal(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="span">
              {selectedEvent?.title}
            </Typography>
            <Chip 
              label={getEventTypeLabel(selectedEvent?.type)} 
              size="small" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Informazioni data e ora */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  📅 Data e Ora
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography><strong>Data:</strong> {formatDate(selectedEvent.start)}</Typography>
                  <Typography><strong>Orario:</strong> {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</Typography>
                  <Typography><strong>Durata:</strong> {Math.round((selectedEvent.end.getTime() - selectedEvent.start.getTime()) / (1000 * 60))} minuti</Typography>
                </Box>
              </Box>

              {/* Descrizione */}
              {selectedEvent.description && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    📝 Descrizione
                  </Typography>
                  <Typography sx={{ ml: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}

              {/* Informazioni progetto */}
              {selectedEvent.projectId && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    🚀 Informazioni Progetto
                  </Typography>
                  <Box sx={{ ml: 2, p: 2, bgcolor: 'blue.50', borderRadius: 1 }}>
                    <Typography><strong>Tipo:</strong> {selectedEvent.type}</Typography>
                    <Typography><strong>ID Progetto:</strong> {selectedEvent.projectId}</Typography>
                    {selectedEvent.taskId && (
                      <Typography><strong>ID Task:</strong> {selectedEvent.taskId}</Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Notifiche */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  🔔 Notifiche
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography>
                    <strong>Preavviso notifica:</strong> {selectedEvent.notificationLeadTime && selectedEvent.notificationLeadTime > 0 ? `${selectedEvent.notificationLeadTime} minuti` : 'Nessuno'}
                  </Typography>
                  <Typography>
                    <strong>Intervallo ripetizione:</strong> {selectedEvent.repeatInterval && selectedEvent.repeatInterval > 0 ? `${selectedEvent.repeatInterval} minuti` : 'Nessuno'}
                  </Typography>
                </Box>
              </Box>

              {/* Partecipanti */}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    👥 Partecipanti
                  </Typography>
                  <Box sx={{ ml: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedEvent.participants.map((participant, index) => (
                      <Chip 
                        key={index} 
                        label={participant.email || participant.userId || 'Partecipante'} 
                        color="secondary" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Creatore evento */}
              {selectedEvent.createdByEmail && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    👤 Creatore
                  </Typography>
                  <Typography sx={{ ml: 2 }}>
                    {selectedEvent.createdByEmail}
                  </Typography>
                </Box>
              )}

              {/* Metadati */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  ℹ️ Informazioni Tecniche
                </Typography>
                <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {selectedEvent._id && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>ID:</strong> {selectedEvent._id}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <strong>User ID:</strong> {selectedEvent.userId}
                  </Typography>
                </Box>
              </Box>

            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowEventDetailsModal(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UnifiedCalendar; 