import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Repeat as RepeatIcon,
  FilterList as FilterIcon,
  Assessment as StatsIcon,
  CloudSync as SyncIcon,
  Backup as BackupIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CalendarImportExport from './CalendarImportExport';

const CalendarDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showImportExport, setShowImportExport] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/events/statistics', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      category: "📅 Funzionalità Base",
      items: [
        { name: "Creazione/Modifica/Eliminazione Eventi", implemented: true },
        { name: "Vista Mensile/Settimanale/Giornaliera", implemented: true },
        { name: "Vista Agenda", implemented: true },
        { name: "Selezione Slot Temporali", implemented: true },
        { name: "Autenticazione e Autorizzazione", implemented: true }
      ]
    },
    {
      category: "🔄 Eventi Ricorrenti",
      items: [
        { name: "Ricorrenza Giornaliera/Settimanale/Mensile", implemented: true },
        { name: "Data Fine Ricorrenza", implemented: true },
        { name: "Numero Massimo Occorrenze", implemented: true },
        { name: "Giorni della Settimana Specifici", implemented: true },
        { name: "Gestione Serie Ricorrenti", implemented: true }
      ]
    },
    {
      category: "🎯 Categorizzazione e Filtri",
      items: [
        { name: "Categorie Evento (Lavoro, Studio, Personale, ecc.)", implemented: true },
        { name: "Livelli di Priorità (Urgente, Alto, Medio, Basso)", implemented: true },
        { name: "Filtri Avanzati per Categoria/Priorità", implemented: true },
        { name: "Filtro per Luogo", implemented: true },
        { name: "Colori Personalizzati", implemented: true }
      ]
    },
    {
      category: "🔔 Notifiche e Reminder",
      items: [
        { name: "Notifiche Push Browser", implemented: true },
        { name: "Email Notifications", implemented: true },
        { name: "Reminder Automatici", implemented: true },
        { name: "Cron Jobs per Reminder", implemented: true },
        { name: "Tempo di Preavviso Personalizzabile", implemented: true }
      ]
    },
    {
      category: "👥 Collaborazione",
      items: [
        { name: "Partecipanti agli Eventi", implemented: true },
        { name: "Inviti via Email", implemented: true },
        { name: "Condivisione Eventi", implemented: true },
        { name: "Gestione Permessi", implemented: true }
      ]
    },
    {
      category: "🔗 Integrazione Progetti",
      items: [
        { name: "Sincronizzazione Task → Eventi", implemented: true },
        { name: "Milestone → Eventi Calendario", implemented: true },
        { name: "Calendario Unificato", implemented: true },
        { name: "Auto-sync Progetti", implemented: true },
        { name: "Vista Progetti nel Calendario", implemented: true }
      ]
    },
    {
      category: "📊 Analytics e Statistiche",
      items: [
        { name: "Statistiche Eventi per Categoria", implemented: true },
        { name: "Statistiche per Priorità", implemented: true },
        { name: "Contatori Eventi Mensili", implemented: true },
        { name: "Dashboard Riepilogativo", implemented: true },
        { name: "Report Grafici", implemented: true }
      ]
    },
    {
      category: "💾 Import/Export",
      items: [
        { name: "Esportazione iCal (.ics)", implemented: true },
        { name: "Esportazione JSON", implemented: true },
        { name: "Importazione da iCal", implemented: true },
        { name: "Backup/Restore Completo", implemented: true },
        { name: "Compatibilità Google Calendar", implemented: true }
      ]
    },
    {
      category: "🎨 User Experience",
      items: [
        { name: "Design Responsivo", implemented: true },
        { name: "Dark Mode Support", implemented: true },
        { name: "Animazioni e Transizioni", implemented: true },
        { name: "Loading States", implemented: true },
        { name: "Error Handling", implemented: true }
      ]
    }
  ];

  const quickActions = [
    {
      title: "Calendario Base",
      description: "Vista calendario tradizionale con eventi base",
      path: "/calendar",
      icon: <CalendarIcon />,
      color: "#2196f3"
    },
    {
      title: "Calendario Unificato",
      description: "Eventi + Progetti + Task in una vista integrata",
      path: "/calendario-unificato",
      icon: <SyncIcon />,
      color: "#f093fb"
    },
    {
      title: "Calendario Avanzato",
      description: "Filtri, ricorrenze, statistiche e funzioni avanzate",
      path: "/calendario-avanzato", 
      icon: <FilterIcon />,
      color: "#667eea"
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DashboardIcon fontSize="large" />
        Dashboard Calendario
      </Typography>
      
     

      {/* Statistiche Rapide */}
      {loading ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="h4" color="primary">{stats.totalEvents}</Typography>
                <Typography variant="body2">Eventi Totali</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="h4" color="warning.main">{stats.recurringEvents}</Typography>
                <Typography variant="body2">Eventi Ricorrenti</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: '#f3e5f5' }}>
              <CardContent>
                <Typography variant="h4" color="secondary">{stats.projectEvents}</Typography>
                <Typography variant="body2">Eventi Progetti</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography variant="h4" color="success.main">{stats.eventsThisMonth}</Typography>
                <Typography variant="body2">Questo Mese</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Accesso Rapido */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            🚀 Accesso Rapido
          </Typography>
        </Grid>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: action.color,
                      borderRadius: '50%',
                      p: 1,
                      color: 'white'
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6">{action.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Azioni Utili */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            ⚡ Azioni Utili
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={() => setShowImportExport(true)}
            sx={{ py: 2 }}
          >
            Import/Export
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={() => navigate('/calendario-avanzato')}
            sx={{ py: 2 }}
          >
            Statistiche
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => navigate('/calendario-unificato')}
            sx={{ py: 2 }}
          >
            Sync Progetti
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => navigate('/calendar')}
            sx={{ py: 2 }}
          >
            Nuovo Evento
          </Button>
        </Grid>
      </Grid>

      {/* Riepilogo Funzionalità */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            ✅ Funzionalità Implementate
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Panoramica completa delle funzionalità del sistema calendario, tipicamente richieste in progetti accademici avanzati:
          </Typography>
        </Grid>
        
        {features.map((category, index) => (
          <Grid item xs={12} lg={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {category.category}
                </Typography>
                <List dense>
                  {category.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex}>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.name}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <Chip 
                        label="✓" 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Riepilogo Tecnico */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          📋 Riepilogo Tecnico
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Backend API:</Typography>
            <List dense>
              <ListItem><ListItemText primary="• GET/POST/PUT/DELETE /api/events" /></ListItem>
              <ListItem><ListItemText primary="• POST /api/events/recurring" /></ListItem>
              <ListItem><ListItemText primary="• GET /api/events/filtered" /></ListItem>
              <ListItem><ListItemText primary="• GET /api/events/statistics" /></ListItem>
              <ListItem><ListItemText primary="• POST /api/events/sync-projects" /></ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Frontend Components:</Typography>
            <List dense>
              <ListItem><ListItemText primary="• CalendarHome (Base)" /></ListItem>
              <ListItem><ListItemText primary="• UnifiedCalendar (Progetti)" /></ListItem>
              <ListItem><ListItemText primary="• AdvancedCalendar (Avanzato)" /></ListItem>
              <ListItem><ListItemText primary="• CalendarImportExport" /></ListItem>
              <ListItem><ListItemText primary="• CalendarDashboard" /></ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Modal Import/Export */}
      <CalendarImportExport
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
        onEventsImported={() => fetchStats()}
      />
    </Box>
  );
};

export default CalendarDashboard; 