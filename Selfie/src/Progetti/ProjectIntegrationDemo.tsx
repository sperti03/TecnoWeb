import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TaskIcon from '@mui/icons-material/Task';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import CalendarProjectIntegration, { SyncOptions } from './CalendarProjectIntegration';
import projectService from './ProjectService';
import { Project } from './types';

const ProjectIntegrationDemo: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const integration = new CalendarProjectIntegration();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
      
      const integrationStats = integration.getIntegrationStats(projectsData);
      setStats(integrationStats);
    } catch (err) {
      setError('Errore nel caricamento dei progetti');
      console.error(err);
    }
  };

  const handleSync = async (options: SyncOptions) => {
    try {
      setSyncing(true);
      setError(null);
      
      await integration.syncProjectsToCalendar(projects, options);
      
      setSyncComplete(true);
      setTimeout(() => setSyncComplete(false), 3000);
    } catch (err) {
      setError('Errore durante la sincronizzazione');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const syncMilestones = () => handleSync({
    includeAllTasks: false,
    includeMilestones: true,
    onlyUserTasks: true,
    notificationLeadTime: 120
  });

  const syncAllTasks = () => handleSync({
    includeAllTasks: true,
    includeMilestones: true,
    onlyUserTasks: true,
    notificationLeadTime: 30
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IntegrationInstructionsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Integrazione Calendario-Progetti
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {syncComplete && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Sincronizzazione completata con successo!
        </Alert>
      )}

      {syncing && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Sincronizzazione in corso...</Typography>
              <LinearProgress sx={{ flex: 1 }} />
            </Box>
          </Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Statistiche */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Statistiche Progetti
              </Typography>
              
              {stats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {projects.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Progetti Totali
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {stats.totalTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Task Totali
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.totalMilestones}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Milestone Totali
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {stats.syncableTasks + stats.syncableMilestones}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Elementi Sincronizzabili
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography>Caricamento statistiche...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Azioni di Sincronizzazione */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEventsIcon color="warning" />
                <Typography variant="h6">
                  Sincronizza Milestone
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Sincronizza solo le milestone dei progetti nel calendario per tenere traccia delle scadenze importanti.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={`${stats?.syncableMilestones || 0} milestone`} 
                  size="small" 
                  color="warning" 
                  variant="outlined" 
                />
                <Chip 
                  label="2h preavviso" 
                  size="small" 
                  color="info" 
                  variant="outlined" 
                />
              </Box>
              
              <Button
                variant="contained"
                color="warning"
                startIcon={<SyncIcon />}
                onClick={syncMilestones}
                disabled={syncing || !stats?.syncableMilestones}
                fullWidth
              >
                Sincronizza Milestone
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TaskIcon color="success" />
                <Typography variant="h6">
                  Sincronizza Tutto
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Sincronizza tutti i task e le milestone dei progetti nel calendario per una vista completa.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={`${stats?.syncableTasks || 0} task`} 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${stats?.syncableMilestones || 0} milestone`} 
                  size="small" 
                  color="warning" 
                  variant="outlined" 
                />
              </Box>
              
              <Button
                variant="contained"
                color="success"
                startIcon={<SyncIcon />}
                onClick={syncAllTasks}
                disabled={syncing || (!stats?.syncableTasks && !stats?.syncableMilestones)}
                fullWidth
              >
                Sincronizza Tutto
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Collegamenti Rapidi */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔗 Collegamenti Rapidi
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<CalendarMonthIcon />}
                  href="/calendar"
                >
                  Calendario Classico
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<IntegrationInstructionsIcon />}
                  href="/calendario-unificato"
                >
                  Calendario Unificato
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<TaskIcon />}
                  href="/progetti"
                >
                  Gestione Progetti
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Istruzioni */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Come Funziona l'Integrazione
              </Typography>
              
              <Typography variant="body2" component="div">
                <strong>1. Sincronizzazione Automatica:</strong> I task e le milestone dei tuoi progetti vengono automaticamente convertiti in eventi calendario.
                <br /><br />
                <strong>2. Filtri Intelligenti:</strong> Nel calendario unificato puoi filtrare per vedere solo eventi, task, milestone o tutto insieme.
                <br /><br />
                <strong>3. Notifiche Smart:</strong> Ricevi notifiche personalizzate: 30 minuti per i task, 2 ore per le milestone.
                <br /><br />
                <strong>4. Sincronizzazione Bidirezionale:</strong> Puoi creare task dai eventi calendario e viceversa.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectIntegrationDemo; 