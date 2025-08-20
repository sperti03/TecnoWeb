


// Service for advanced Note-Calendar integration
export const NoteCalendarIntegration = {
  // Add calendar event for a to-do with deadline
  async addCalendarEventForTodo(todo, noteId, noteTitle) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/addcalendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `📝 To-Do: ${todo.text}`,
          description: `Dalla nota: "${noteTitle}" (ID: ${noteId})`,
          date: todo.deadline,
          noteId: noteId,
          todoText: todo.text,
          isFromNote: true
        }),
      });

      if (response.ok) {
        const event = await response.json();
        console.log(`✅ Evento calendario creato per to-do: ${todo.text}`);
        return event;
      } else {
        console.error('Errore nella creazione evento calendario:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Errore durante creazione evento calendario:', error);
      return null;
    }
  },

  // Get calendar events created from notes
  async getCalendarEventsFromNotes() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/events?fromNotes=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const events = await response.json();
        return events.filter(event => event.isFromNote);
      }
      return [];
    } catch (error) {
      console.error('Errore recupero eventi da note:', error);
      return [];
    }
  },

  // Remove calendar events for a specific note
  async removeCalendarEventsForNote(noteId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/from-note/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🗑️ Rimossi ${result.deletedCount} eventi per nota ${noteId}`);
        return result.deletedCount;
      }
      return 0;
    } catch (error) {
      console.error('Errore rimozione eventi nota:', error);
      return 0;
    }
  },

  // Sync all todos from a note to calendar
  async syncNoteToCalendar(note, removeExisting = true) {
    try {
      if (removeExisting) {
        await this.removeCalendarEventsForNote(note._id);
      }

      if (!note.todos || !Array.isArray(note.todos)) {
        return { created: 0, errors: 0 };
      }

      let created = 0;
      let errors = 0;

      for (const todo of note.todos) {
        if (todo.deadline && !todo.checked) {
          const event = await this.addCalendarEventForTodo(todo, note._id, note.title);
          if (event) {
            created++;
          } else {
            errors++;
          }
        }
      }

      return { created, errors };
    } catch (error) {
      console.error('Errore sync nota calendario:', error);
      return { created: 0, errors: 1 };
    }
  },

  // Check if automatic sync is enabled for user
  isAutoSyncEnabled() {
    return localStorage.getItem('noteCalendarAutoSync') !== 'false';
  },

  // Enable/disable automatic sync
  setAutoSync(enabled) {
    localStorage.setItem('noteCalendarAutoSync', enabled.toString());
  }
};

// Legacy function for backward compatibility
export const addCalendarEventForTodo = async (todo, noteId, noteTitle = 'Nota') => {
  return await NoteCalendarIntegration.addCalendarEventForTodo(todo, noteId, noteTitle);
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
  const response = await fetch('/api/addnote', {
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

  // Auto-sync to calendar if enabled
  if (NoteCalendarIntegration.isAutoSyncEnabled()) {
    const syncResult = await NoteCalendarIntegration.syncNoteToCalendar(newNote, false);
    console.log(`📅 Sync risultato: ${syncResult.created} eventi creati, ${syncResult.errors} errori`);
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
  const response = await fetch(`/api/updatenote/${noteId}`,{
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

  // Auto-sync to calendar if enabled
  if (NoteCalendarIntegration.isAutoSyncEnabled()) {
    const syncResult = await NoteCalendarIntegration.syncNoteToCalendar(updatedNote, true);
    console.log(`🔄 Update sync risultato: ${syncResult.created} eventi creati, ${syncResult.errors} errori`);
  }

  return updatedNote;
};

// Funzione per eliminare una nota
export const deleteNoteForUser = async (noteId) => {
  const token = localStorage.getItem('token');

  // Remove associated calendar events first
  if (NoteCalendarIntegration.isAutoSyncEnabled()) {
    await NoteCalendarIntegration.removeCalendarEventsForNote(noteId);
  }

  const response = await fetch(`/api/deletenote/${noteId}`, {
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

  const response = await fetch(`/api/getnotes?userId=${userId}`, {
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

  const response = await fetch("/api/users", {
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





