

export const getNotesForUser = async (userId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/getnotes?userId=${userId}`);  
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status}`);
    }
    return await response.json();  // Restituisce le note filtrate per userId
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    throw error;
  }
};


// Funzione per aggiungere una nuova nota associata a un utente
export const addNoteForUser = async (userId, title, content) => {
  try {
    const response = await fetch("http://localhost:8000/api/addnote", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, title, content }),  // CORRETTO
    });

    if (!response.ok) {
      throw new Error(`Errore nella creazione della nota: ${response.status}`);
    }
    return await response.json();  // Restituisce la nuova nota
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    throw error;
  }
};


// Funzione per aggiornare una nota esistente (nota che appartiene a un utente specifico)
export const updateNoteForUser = async (noteId, userId, title, content) => {
  try {
    const response = await fetch("http://localhost:8000/api/updatenote", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, title, content }),  // Si assicura che la nota aggiornata sia associata all'utente giusto
    });

    if (!response.ok) {
      throw new Error(`Errore nella modifica della nota: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Errore nella modifica della nota:", error);
    throw error;
  }
};

// Funzione per cancellare una nota (nota di un utente specifico)
export const deleteNoteForUser = async (noteId, userId) => {
  try {
    const response = await fetch("http://localhost:8000/api/deletenote", {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ noteId, userId }),  // Assicurati di inviare l'ID della nota e l'ID dell'utente
    });

    if (!response.ok) {
      throw new Error(`Errore nella cancellazione della nota: ${response.status}`);
    }
  } catch (error) {
    console.error("Errore nella cancellazione della nota:", error);
    throw error;
  }
};
