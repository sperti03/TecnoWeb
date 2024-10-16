import React, { useState, useEffect } from "react";
import NoteList from "./NoteList.tsx";
import NoteForm from "./NoteForm.tsx";
import { Note, SortCriteria } from "./types.ts";
import { getNotesForUser, addNoteForUser } from "./NoteService.js"; // Importa le API dal servizio
import { useParams } from "react-router-dom"; // Per ottenere l'userId se necessario

const NoteHome: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sortBy, setSortBy] = useState<SortCriteria>("title"); // Ordina per titolo, data o lunghezza

  const { userId } = useParams<{ userId: string }>(); // Ottieni l'userId dinamicamente (se usi React Router)

  // Carica le note dal backend al montaggio del componente
  useEffect(() => {
    const fetchNotes = async () => {
      if (userId) {
        try {
          const fetchedNotes = await getNotesForUser(userId); // Usa la funzione API per ottenere le note
          setNotes(fetchedNotes); // Aggiorna lo stato con le note ricevute
        } catch (error) {
          console.error("Errore nel recupero delle note:", error);
        }
      }
    };
    fetchNotes();
  }, [userId]);

  const handleSort = (criteria: SortCriteria) => {
    setSortBy(criteria);
  };

  // Ordina le note in base al criterio selezionato
  const sortedNotes = [...notes].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "date")
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "length") return a.content.length - b.content.length;
    return 0;
  });

  // Funzione per gestire l'aggiunta di una nuova nota
  const handleAddNote = async (title: string, content: string) => {
    if (userId) {
      try {
        const newNote = await addNoteForUser(userId, title, content); // Chiama l'API per aggiungere la nota
        setNotes([...notes, newNote]); // Aggiorna lo stato con la nuova nota
      } catch (error) {
        console.error("Errore nella creazione della nota:", error);
      }
    }
  };

  return (
    <div>
      <h1>Le tue note</h1>
      <button onClick={() => handleSort("title")}>Ordina per Titolo</button>
      <button onClick={() => handleSort("date")}>Ordina per Data</button>
      <button onClick={() => handleSort("length")}>Ordina per Lunghezza</button>

      {/* Lista delle note ordinate */}
      <NoteList notes={sortedNotes} />

      {/* Form per aggiungere nuove note */}
      <NoteForm userId={userId!} onSave={handleAddNote} />
    </div>
  );
};

export default NoteHome;
