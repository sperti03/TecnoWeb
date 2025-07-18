import React, { useState } from 'react';
import { TextField, Button, Select, MenuItem, InputLabel, FormControl, Box, Typography, DialogActions } from '@mui/material';

interface Props {
  onCreated: (name: string, type: string) => void;
}

const ResourceForm: React.FC<Props> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('room');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onCreated(name, type);
    setName('');
    setType('room');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, minWidth: 300 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Nuova Risorsa</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <TextField label="Nome risorsa" value={name} onChange={e => setName(e.target.value)} required fullWidth />
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tipo</InputLabel>
        <Select value={type} label="Tipo" onChange={e => setType(e.target.value)}>
          <MenuItem value="room">Sala</MenuItem>
          <MenuItem value="bike">Bici</MenuItem>
          <MenuItem value="device">Apparecchiatura</MenuItem>
        </Select>
      </FormControl>
      <DialogActions>
        <Button type="submit" variant="contained">Aggiungi Risorsa</Button>
      </DialogActions>
    </Box>
  );
};

export default ResourceForm; 