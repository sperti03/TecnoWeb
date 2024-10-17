

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


// funzione per aggiornare una note di un utente
export const updateNoteForUser = async (noteId, title, content) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:8000/api/updatenote/${noteId}`,{
    method:'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Includi il token nell'header Authorization
    },
    body: JSON.stringify({title, content}),
  });

  if(!response.ok){
    throw new Error('errore nell\' aggiornamento della nota, sucabene');
  }
  return await response.json();
};

// Funzione per eliminare una nota
export const deleteNoteForUser = async (noteId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:8000/api/deletenote/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Errore nell\'eliminazione della nota');
  }
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
