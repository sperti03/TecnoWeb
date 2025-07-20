import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Event as EventIcon,
  GetApp as GetAppIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Google as GoogleIcon,
  CalendarToday as CalendarIcon,
  Description as JsonIcon,
  FileCopy as FileIcon
} from '@mui/icons-material';
import { createEvents, EventAttributes } from 'ics';

interface CalendarImportExportProps {
  open: boolean;
  onClose: () => void;
  onEventsImported: (events: any[]) => void;
}

interface ImportStats {
  imported: number;
  skipped: number;
  errors: number;
}

const CalendarImportExport: React.FC<CalendarImportExportProps> = ({
  open,
  onClose,
  onEventsImported
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // Esporta tutti gli eventi come iCal
  const exportToICal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/events', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const events = await response.json();
      
      const icsEvents: EventAttributes[] = events.map((event: any) => ({
        title: event.title,
        start: [
          new Date(event.start).getFullYear(),
          new Date(event.start).getMonth() + 1,
          new Date(event.start).getDate(),
          new Date(event.start).getHours(),
          new Date(event.start).getMinutes(),
        ],
        end: [
          new Date(event.end).getFullYear(),
          new Date(event.end).getMonth() + 1,
          new Date(event.end).getDate(),
          new Date(event.end).getHours(),
          new Date(event.end).getMinutes(),
        ],
        description: event.description || '',
        location: event.location || '',
        categories: [event.category || 'personal'],
        uid: event._id,
        productId: 'selfie-calendar',
        calName: 'Selfie Calendar'
      }));

      createEvents(icsEvents, (error, value) => {
        if (error) {
          setError('Errore durante la creazione del file iCal');
          return;
        }
        
        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `selfie-calendar-${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setSuccess(`Esportati ${events.length} eventi in formato iCal`);
      });
      
    } catch (err) {
      setError('Errore durante l\'esportazione');
    } finally {
      setLoading(false);
    }
  };

  // Esporta come JSON
  const exportToJSON = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/events', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const events = await response.json();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'Selfie Calendar',
        eventsCount: events.length,
        events: events.map((event: any) => ({
          id: event._id,
          title: event.title,
          start: event.start,
          end: event.end,
          description: event.description,
          category: event.category,
          priority: event.priority,
          color: event.color,
          location: event.location,
          isRecurring: event.isRecurring,
          recurrenceRule: event.recurrenceRule,
          notificationLeadTime: event.notificationLeadTime,
          eventType: event.eventType,
          isProjectEvent: event.isProjectEvent,
          projectEventData: event.projectEventData
        }))
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selfie-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess(`Esportati ${events.length} eventi in formato JSON`);
      
    } catch (err) {
      setError('Errore durante l\'esportazione JSON');
    } finally {
      setLoading(false);
    }
  };

  // Importa da file iCal
  const importFromICal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const events = parseICalContent(content);
        
        if (events.length === 0) {
          setError('Nessun evento trovato nel file iCal');
          setLoading(false);
          return;
        }
        
        await importEvents(events);
        
      } catch (err) {
        setError('Errore durante la lettura del file iCal');
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  // Importa da file JSON
  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.events || !Array.isArray(data.events)) {
          setError('Formato JSON non valido');
          setLoading(false);
          return;
        }
        
        await importEvents(data.events);
        
      } catch (err) {
        setError('Errore durante la lettura del file JSON');
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  // Parse del contenuto iCal (implementazione semplificata)
  const parseICalContent = (content: string) => {
    const events = [];
    const lines = content.split('\n');
    let currentEvent: any = {};
    let inEvent = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (trimmedLine === 'END:VEVENT') {
        if (currentEvent.title && currentEvent.start) {
          events.push({
            title: currentEvent.title,
            start: currentEvent.start,
            end: currentEvent.end || currentEvent.start,
            description: currentEvent.description || '',
            location: currentEvent.location || '',
            category: 'personal'
          });
        }
        inEvent = false;
      } else if (inEvent) {
        if (trimmedLine.startsWith('SUMMARY:')) {
          currentEvent.title = trimmedLine.substring(8);
        } else if (trimmedLine.startsWith('DTSTART:')) {
          currentEvent.start = parseICalDate(trimmedLine.substring(8));
        } else if (trimmedLine.startsWith('DTEND:')) {
          currentEvent.end = parseICalDate(trimmedLine.substring(6));
        } else if (trimmedLine.startsWith('DESCRIPTION:')) {
          currentEvent.description = trimmedLine.substring(12);
        } else if (trimmedLine.startsWith('LOCATION:')) {
          currentEvent.location = trimmedLine.substring(9);
        }
      }
    }
    
    return events;
  };

  // Parse delle date iCal
  const parseICalDate = (dateString: string): Date => {
    // Formato: 20231201T120000Z o 20231201T120000
    const cleanDate = dateString.replace(/[TZ]/g, '');
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    const hour = parseInt(cleanDate.substring(8, 10)) || 0;
    const minute = parseInt(cleanDate.substring(10, 12)) || 0;
    const second = parseInt(cleanDate.substring(12, 14)) || 0;
    
    return new Date(year, month, day, hour, minute, second);
  };

  // Importa eventi nel database
  const importEvents = async (events: any[]) => {
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const event of events) {
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: event.title,
            start: event.start,
            end: event.end,
            description: event.description || '',
            location: event.location || '',
            category: event.category || 'personal',
            priority: event.priority || 'medium',
            color: event.color || '#4caf50',
            notificationLeadTime: event.notificationLeadTime || 0,
            eventType: event.eventType || 'general'
          }),
        });
        
        if (response.ok) {
          imported++;
        } else {
          skipped++;
        }
      } catch (err) {
        errors++;
      }
    }
    
    setImportStats({ imported, skipped, errors });
    setSuccess(`Importazione completata: ${imported} eventi importati`);
    setLoading(false);
    
    // Notifica il componente padre
    onEventsImported(events);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setImportStats(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BackupIcon />
          Importazione ed Esportazione Calendario
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {importStats && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Statistiche importazione: {importStats.imported} importati, {importStats.skipped} saltati, {importStats.errors} errori
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Esportazione */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <DownloadIcon /> Esportazione
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Esporta i tuoi eventi in diversi formati per usarli in altre applicazioni.
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="iCal (.ics)"
                      secondary="Compatibile con Google Calendar, Outlook, Apple Calendar"
                    />
                    <Button
                      variant="outlined"
                      onClick={exportToICal}
                      disabled={loading}
                      startIcon={<GetAppIcon />}
                    >
                      Esporta
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemIcon>
                      <JsonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="JSON"
                      secondary="Backup completo con tutte le proprietà"
                    />
                    <Button
                      variant="outlined"
                      onClick={exportToJSON}
                      disabled={loading}
                      startIcon={<GetAppIcon />}
                    >
                      Esporta
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Importazione */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <UploadIcon /> Importazione
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Importa eventi da file esterni o da backup precedenti.
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="iCal (.ics)"
                      secondary="Da Google Calendar, Outlook, Apple Calendar"
                    />
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={loading}
                      startIcon={<UploadIcon />}
                    >
                      Importa
                      <input
                        type="file"
                        hidden
                        accept=".ics"
                        onChange={importFromICal}
                      />
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemIcon>
                      <RestoreIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="JSON Backup"
                      secondary="Ripristina da backup Selfie"
                    />
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={loading}
                      startIcon={<UploadIcon />}
                    >
                      Importa
                      <input
                        type="file"
                        hidden
                        accept=".json"
                        onChange={importFromJSON}
                      />
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Istruzioni */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            💡 Suggerimenti
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Per Google Calendar: esporta in iCal, poi importa su Google Calendar<br/>
            • Per backup completi: usa il formato JSON che mantiene tutte le proprietà<br/>
            • L'importazione non sovrascrive eventi esistenti<br/>
            • Verifica sempre i risultati dopo l'importazione
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarImportExport; 