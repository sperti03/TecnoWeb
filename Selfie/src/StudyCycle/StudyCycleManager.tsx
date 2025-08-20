import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { StudyCycleService } from './StudyCycleService';
import { InvitationService } from './InvitationService';
import { StudyCycleAutoService } from '../services/StudyCycleAutoService';
import './StudyCycleManager.css';

interface StudyCycle {
  _id: string;
  title: string;
  subject: string;
  studyTime: number; // in minutes
  pauseTime: number; // in minutes
  cycles: number;
  scheduledDate: string;
  scheduledTime: string; // "HH:MM" format
  userId: string;
  calendarEventId?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'rescheduled';
  completedCycles: number;
  createdAt: string;
  lastModified: string;
  originalDate?: string; // Track the original date for rescheduled cycles
  rescheduledCount: number;
  // Backward compatibility (se necessario)
  name?: string;
  description?: string;
  studyDuration?: number;
  breakDuration?: number;
  currentCycle?: number;
  progress?: number;
  participants?: string[];
  createdBy?: string;
  completedAt?: string;
  tags?: string[];
}

interface Invitation {
  _id: string;
  senderId: {
    username: string;
    email: string;
  };
  studySettings: StudyCycle;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

const StudyCycleManager: React.FC = () => {
  const [studyCycles, setStudyCycles] = useState<StudyCycle[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [rescheduledCycles, setRescheduledCycles] = useState<StudyCycle[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<StudyCycle | null>(null);

  // Form states
  const [cycleForm, setCycleForm] = useState({
    title: '',
    subject: '',
    studyTime: 25,
    pauseTime: 5,
    cycles: 4,
    tags: [] as string[]
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    message: '',
    cycleId: ''
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cyclesData, invitationsData, rescheduledData] = await Promise.all([
        StudyCycleService.getStudyCycles(),
        InvitationService.getReceivedInvitations(),
        StudyCycleAutoService.getTodaysRescheduledCycles()
      ]);
      setStudyCycles(cyclesData);
      setInvitations(invitationsData);
      setRescheduledCycles(rescheduledData);
    } catch (error) {
      setError('Errore nel caricamento dei dati');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Manual reschedule function
  const handleManualReschedule = async () => {
    setRescheduleLoading(true);
    try {
      const result = await StudyCycleAutoService.manualReschedule();
      
      if (result.success && result.count > 0) {
        setSuccess(`✅ Riprogrammati ${result.count} cicli di studio incompleti per oggi!`);
        // Reload data to show updated cycles
        await loadData();
      } else if (result.success && result.count === 0) {
        setSuccess('ℹ️ Nessun ciclo di studio incompleto da riprogrammare.');
      } else {
        setError(`❌ Errore durante la riprogrammazione: ${result.message}`);
      }
    } catch (error) {
      setError('Errore durante la riprogrammazione automatica');
      console.error(error);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCreateCycle = async () => {
    try {
      setLoading(true);
      const newCycle = await StudyCycleService.createStudyCycle({
        ...cycleForm,
        status: 'pending',
        currentCycle: 0,
        progress: 0
      });
      
      setStudyCycles([...studyCycles, newCycle]);
      setShowCreateModal(false);
      setCycleForm({
        title: '',
        subject: '',
        studyTime: 25,
        pauseTime: 5,
        cycles: 4,
        tags: []
      });
      setSuccess('Ciclo di studio creato con successo!');
    } catch (error) {
      setError('Errore nella creazione del ciclo di studio');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCycle = async (cycle: StudyCycle) => {
    try {
      const updatedCycle = await StudyCycleService.updateProgress(cycle._id, {
        status: 'in-progress',
        currentCycle: 1,
        startedAt: new Date().toISOString()
      });
      
      setStudyCycles(studyCycles.map(c => 
        c._id === cycle._id ? { ...c, ...updatedCycle } : c
      ));
      setSuccess(`Ciclo "${cycle.name}" avviato!`);
    } catch (error) {
      setError('Errore nell\'avvio del ciclo');
    }
  };

  const handleCompleteCycle = async (cycle: StudyCycle) => {
    try {
      const completedCycle = await StudyCycleService.completeStudyCycle(cycle._id, {
        completedAt: new Date().toISOString(),
        status: 'completed',
        progress: 100
      });
      
      setStudyCycles(studyCycles.map(c => 
        c._id === cycle._id ? { ...c, ...completedCycle } : c
      ));
      setSuccess(`Ciclo "${cycle.name}" completato!`);
    } catch (error) {
      setError('Errore nel completamento del ciclo');
    }
  };

  const handleSendInvitation = async () => {
    try {
      setLoading(true);
      await InvitationService.sendInvitation({
        ...inviteForm,
        studyCycleId: selectedCycle?._id
      });
      
      setShowInviteModal(false);
      setInviteForm({ email: '', message: '', cycleId: '' });
      setSuccess('Invito inviato con successo!');
    } catch (error) {
      setError('Errore nell\'invio dell\'invito');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await InvitationService.acceptInvitation(invitationId);
      setInvitations(invitations.map(inv => 
        inv._id === invitationId ? { ...inv, status: 'accepted' } : inv
      ));
      setSuccess('Invito accettato!');
      loadData(); // Reload to get updated study cycles
    } catch (error) {
      setError('Errore nell\'accettazione dell\'invito');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await InvitationService.declineInvitation(invitationId);
      setInvitations(invitations.map(inv => 
        inv._id === invitationId ? { ...inv, status: 'declined' } : inv
      ));
      setSuccess('Invito rifiutato');
    } catch (error) {
      setError('Errore nel rifiuto dell\'invito');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !cycleForm.tags.includes(tagInput.trim())) {
      setCycleForm({
        ...cycleForm,
        tags: [...cycleForm.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCycleForm({
      ...cycleForm,
      tags: cycleForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'paused': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckIcon />;
      case 'in-progress': return <PlayIcon />;
      case 'paused': return <PauseIcon />;
      case 'pending': return <TimerIcon />;
      default: return <TimerIcon />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        📚 Gestione Cicli di Studio
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="I Miei Cicli" icon={<TimerIcon />} />
          <Tab label="Inviti Ricevuti" icon={<GroupIcon />} />
          <Tab label="Statistiche" icon={<HistoryIcon />} />
        </Tabs>
      </Box>

      {/* Tab 1: My Study Cycles */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">I Tuoi Cicli di Studio</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleManualReschedule}
                disabled={rescheduleLoading}
                size="small"
              >
                {rescheduleLoading ? 'Riprogrammando...' : 'Riprogramma Incompleti'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateModal(true)}
              >
                Nuovo Ciclo
              </Button>
            </Box>
          </Box>

          {/* Show rescheduled cycles alert */}
          {rescheduledCycles.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                🔄 <strong>{rescheduledCycles.length}</strong> ciclo/i di studio riprogrammato/i per oggi da sessioni precedenti incomplete.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            {studyCycles.map((cycle) => (
              <Grid item xs={12} md={6} lg={4} key={cycle._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" noWrap>
                        {cycle.name}
                      </Typography>
                      <Chip
                        label={cycle.status}
                        color={getStatusColor(cycle.status) as any}
                        icon={getStatusIcon(cycle.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {cycle.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        📖 Studio: {formatDuration(cycle.studyTime || cycle.studyDuration || 0)}
                      </Typography>
                      <Typography variant="body2">
                        ☕ Pausa: {formatDuration(cycle.pauseTime || cycle.breakDuration || 0)}
                      </Typography>
                      <Typography variant="body2">
                        🔄 Cicli: {cycle.completedCycles || cycle.currentCycle || 0}/{cycle.cycles}
                      </Typography>
                    </Box>

                    {cycle.status === 'in-progress' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Progresso: {Math.round(cycle.progress || 0)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={cycle.progress || 0} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}

                    {cycle.tags && cycle.tags.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {cycle.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {cycle.status === 'scheduled' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayIcon />}
                          onClick={() => handleStartCycle(cycle)}
                        >
                          Avvia
                        </Button>
                      )}
                      
                      {cycle.status === 'in-progress' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleCompleteCycle(cycle)}
                        >
                          Completa
                        </Button>
                      )}

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SendIcon />}
                        onClick={() => {
                          setSelectedCycle(cycle);
                          setShowInviteModal(true);
                        }}
                      >
                        Invita
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab 2: Received Invitations */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Inviti Ricevuti
          </Typography>

          <List>
            {invitations.map((invitation) => (
              <ListItem
                key={invitation._id}
                sx={{
                  mb: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <ListItemIcon>
                  <GroupIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${invitation.senderId.username} ti ha invitato al ciclo "${invitation.studySettings.name}"`}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {invitation.message}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`${invitation.studySettings.studyDuration}min studio`}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={`${invitation.studySettings.breakDuration}min pausa`}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={`${invitation.studySettings.cycles} cicli`}
                          size="small"
                        />
                      </Box>
                    </Box>
                  }
                />
                {invitation.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleAcceptInvitation(invitation._id)}
                    >
                      Accetta
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDeclineInvitation(invitation._id)}
                    >
                      Rifiuta
                    </Button>
                  </Box>
                )}
                {invitation.status !== 'pending' && (
                  <Chip
                    label={invitation.status === 'accepted' ? 'Accettato' : 'Rifiutato'}
                    color={invitation.status === 'accepted' ? 'success' : 'error'}
                    size="small"
                  />
                )}
              </ListItem>
            ))}
            {invitations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Nessun invito ricevuto
              </Typography>
            )}
          </List>
        </Box>
      )}

      {/* Tab 3: Statistics */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Statistiche Studio
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {studyCycles.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cicli Totali
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">
                    {studyCycles.filter(c => c.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cicli Completati
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {studyCycles.filter(c => c.status === 'in-progress').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cicli in Corso
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    {rescheduledCycles.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cicli Riprogrammati Oggi
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Rescheduled cycles info */}
          {rescheduledCycles.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🔄 Cicli Riprogrammati per Oggi
              </Typography>
              <Grid container spacing={2}>
                {rescheduledCycles.map((cycle) => (
                  <Grid item xs={12} md={6} key={cycle._id}>
                    <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                      <CardContent>
                        <Typography variant="h6" color="info.main">
                          {cycle.title || cycle.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Originariamente programmato per: {new Date(cycle.originalDate || cycle.scheduledDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          📖 {cycle.studyTime}min studio + ☕ {cycle.pauseTime}min pausa × {cycle.cycles} cicli
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          ⏰ Oggi alle: {cycle.scheduledTime}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Create Cycle Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crea Nuovo Ciclo di Studio</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome del Ciclo"
                value={cycleForm.title}
                onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrizione"
                value={cycleForm.subject}
                onChange={(e) => setCycleForm({ ...cycleForm, subject: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Durata Studio (minuti)"
                value={cycleForm.studyTime}
                onChange={(e) => setCycleForm({ ...cycleForm, studyTime: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Durata Pausa (minuti)"
                value={cycleForm.pauseTime}
                onChange={(e) => setCycleForm({ ...cycleForm, pauseTime: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Numero di Cicli"
                value={cycleForm.cycles}
                onChange={(e) => setCycleForm({ ...cycleForm, cycles: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Aggiungi Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  size="small"
                />
                <Button variant="outlined" onClick={addTag}>
                  Aggiungi
                </Button>
              </Box>
              <Box>
                {cycleForm.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCycle}
            disabled={!cycleForm.title.trim()}
          >
            Crea Ciclo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onClose={() => setShowInviteModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invita Amici al Ciclo di Studio</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email dell'amico"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Messaggio personalizzato"
              value={inviteForm.message}
              onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
              placeholder="Unisciti a me per una sessione di studio produttiva!"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInviteModal(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSendInvitation}
            disabled={!inviteForm.email.trim()}
            startIcon={<SendIcon />}
          >
            Invia Invito
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudyCycleManager; 