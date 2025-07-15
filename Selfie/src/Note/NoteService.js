


// Funzione per aggiungere un evento al calendario per un to-do con scadenza
export const addCalendarEventForTodo = async (todo, noteId) => {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:3000/api/addcalendar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `To-Do: ${todo.text}`,
      description: `Dalla nota ${noteId}`,
      date: todo.deadline,
    }),
  });
};

// Funzione per aggiungere una nuova nota associata a un utente
export const addNoteForUser = async (title, content, accessType, accessList, todos) => {
  const token = localStorage.getItem('token');
  let username = "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    username = payload.username;
  } catch {}
  let safeAccessList = accessList;
  if (accessType === 'limited' && username && !accessList.includes(username)) {
    safeAccessList = [...accessList, username];
  }
  const response = await fetch('http://localhost:3000/api/addnote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content, accessType, accessList: safeAccessList, todos }),
  });

  if (!response.ok) {
    throw new Error('Errore durante l\'aggiunta della nota');
  }

  const newNote = await response.json();

  // Se ci sono todos con deadline, aggiungi attività al calendario
  if (todos && Array.isArray(todos)) {
    for (const todo of todos) {
      if (todo.deadline) {
        await addCalendarEventForTodo(todo, newNote._id);
      }
    }
  }

  return newNote;
};




// funzione per aggiornare una note di un utente
export const updateNoteForUser = async (noteId, title, content, accessType, accessList, todos) => {
  const token = localStorage.getItem('token');
  let username = "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    username = payload.username;
  } catch {}
  let safeAccessList = accessList;
  if (accessType === 'limited' && username && !accessList.includes(username)) {
    safeAccessList = [...accessList, username];
  }
  const response = await fetch(`http://localhost:3000/api/updatenote/${noteId}`,{
    method:'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({title, content, accessType, accessList: safeAccessList, todos}),
  });

  if(!response.ok){
    throw new Error('errore nell\' aggiornamento della nota, sucabene');
  }
  const updatedNote = await response.json();

  // Se ci sono todos con deadline, aggiungi attività al calendario
  if (todos && Array.isArray(todos)) {
    for (const todo of todos) {
      if (todo.deadline) {
        await addCalendarEventForTodo(todo, updatedNote._id);
      }
    }
  }

  return updatedNote;
};

// Funzione per eliminare una nota
export const deleteNoteForUser = async (noteId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3000/api/deletenote/${noteId}`, {
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
  const token = localStorage.getItem('token'); 

  const response = await fetch(`http://localhost:3000/api/getnotes?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, 
    },
  });

  if (!response.ok) {
    throw new Error('Errore nel recupero delle note');
  }

  const notes = await response.json();
  return notes;
};



export const getUsers = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/api/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // se usi JWT
    },
  });

  if (!response.ok) {
    throw new Error("Errore nel recupero degli utenti");
  }

  const users = await response.json();
  return users; 
};





