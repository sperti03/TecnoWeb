import React, { useState } from 'react';
import { Event, Resource } from './types';
import {
  TextField, Button, Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl, Grid, Box, Typography, DialogActions
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (event: Event) => void;
  resources: Resource[];
}

const daysOfWeek = [
  { label: 'Lunedì', value: 1 },
  { label: 'Martedì', value: 2 },
  { label: 'Mercoledì', value: 3 },
  { label: 'Giovedì', value: 4 },
  { label: 'Venerdì', value: 5 },
  { label: 'Sabato', value: 6 },
  { label: 'Domenica', value: 0 },
];

const EventForm: React.FC<Props> = ({ open, onClose, onCreated, resources }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [invited, setInvited] = useState('');
  const [resource, setResource] = useState('');
  const [notification, setNotification] = useState({ system: false, email: false });
  const [repeat, setRepeat] = useState({ frequency: 'none' } as any);

  if (!open) return null;

  const handleRepeatChange = (field: string, value: any) => {
    setRepeat((r: any) => ({ ...r, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !start || !end) return;
    onCreated({
      title,
      description,
      start: start?.toISOString() || '',
      end: end?.toISOString() || '',
      location,
      createdBy: '',
      invitedUsers: invited.split(',').filter(x=>x.trim()).map(email => ({ user: email.trim(), status: 'pending' })),
      notification,
      repeat,
      resource
    } as any);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, minWidth: 350 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Nuovo Evento</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Titolo" value={title} onChange={e => setTitle(e.target.value)} required fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descrizione" value={description} onChange={e => setDescription(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={6}>
            <DateTimePicker 
              label="Inizio" 
              value={start} 
              onChange={setStart} 
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={6}>
            <DateTimePicker 
              label="Fine" 
              value={end} 
              onChange={setEnd} 
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Luogo" value={location} onChange={e => setLocation(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Invitati (email, separati da virgola)" value={invited} onChange={e => setInvited(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Risorsa</InputLabel>
              <Select value={resource} label="Risorsa" onChange={e => setResource(e.target.value)}>
                <MenuItem value="">Nessuna</MenuItem>
                {resources.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel control={<Checkbox checked={notification.system} onChange={e => setNotification(n => ({ ...n, system: e.target.checked }))} />} label="Notifica sistema" />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel control={<Checkbox checked={notification.email} onChange={e => setNotification(n => ({ ...n, email: e.target.checked }))} />} label="Notifica email" />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Ripetizione</InputLabel>
              <Select value={repeat.frequency} label="Ripetizione" onChange={e => setRepeat((r: any) => ({ ...r, frequency: e.target.value }))}>
                <MenuItem value="none">Nessuna</MenuItem>
                <MenuItem value="daily">Ogni giorno</MenuItem>
                <MenuItem value="weekly">Ogni settimana</MenuItem>
                <MenuItem value="monthly">Ogni mese</MenuItem>
                <MenuItem value="custom">Personalizzata</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {repeat.frequency === 'custom' && (
            <Grid item xs={12}>
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle2">Giorni della settimana:</Typography>
                {daysOfWeek.map(d => (
                  <FormControlLabel
                    key={d.value}
                    control={<Checkbox checked={repeat.daysOfWeek?.includes(d.value) || false}
                      onChange={e => {
                        const arr = repeat.daysOfWeek || [];
                        if (e.target.checked) handleRepeatChange('daysOfWeek', [...arr, d.value]);
                        else handleRepeatChange('daysOfWeek', arr.filter((v: number) => v !== d.value));
                      }}
                    />}
                    label={d.label}
                  />
                ))}
                <TextField label="Giorno del mese" type="number" inputProps={{min:1,max:31}} value={repeat.dayOfMonth || ''} onChange={e => handleRepeatChange('dayOfMonth', e.target.value ? parseInt(e.target.value) : undefined)} sx={{mt:1}} fullWidth />
                <TextField label="Ripeti N volte" type="number" inputProps={{min:1}} value={repeat.count || ''} onChange={e => handleRepeatChange('count', e.target.value ? parseInt(e.target.value) : undefined)} sx={{mt:1}} fullWidth />
                <TextField label="Ripeti fino al" type="date" value={repeat.until || ''} onChange={e => handleRepeatChange('until', e.target.value || undefined)} sx={{mt:1}} fullWidth InputLabelProps={{ shrink: true }} />
              </Box>
            </Grid>
          )}
        </Grid>
        <DialogActions sx={{mt:2}}>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained">Crea</Button>
        </DialogActions>
      </Box>
    </LocalizationProvider>
  );
};

export default EventForm; 