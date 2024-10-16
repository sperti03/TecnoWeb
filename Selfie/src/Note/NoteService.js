

// Funzione per aggiungere una nuova nota associata a un utente
export const addNoteForUser = async (title, content) => {
  const token = localStorage.getItem('token'); // Recupera il token JWT

  const response = await fetch('http://localhost:8000/api/addnote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Includi il token nell'header Authorization
    },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    throw new Error('Errore durante l\'aggiunta della nota');
  }

  const newNote = await response.json();
  return newNote;
};



export const getNotesForUser = async (userId) => {
  const token = localStorage.getItem('token'); // Recupera il token dal localStorage

  const response = await fetch(`http://localhost:8000/api/getnotes?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Includi il token JWT nell'header Authorization
    },
  });

  if (!response.ok) {
    throw new Error('Errore nel recupero delle note');
  }

  const notes = await response.json();
  return notes;
};
