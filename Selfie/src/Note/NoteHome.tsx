import React, { useEffect, useState } from "react";
import {
  getNotesForUser,
  addNoteForUser,
  updateNoteForUser,
  deleteNoteForUser,
} from "./NoteService"; // Importa la funzione per aggiungere note
import NoteForm from "./EditNoteForm";
import { SortCriteria, Note } from "./types";

const NoteHome: React.FC = () => {
  //per caricamento e ordinamento
  const [notes, setNotes] = useState<Note[]>([]);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  //per la add
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  //per la modifica
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isEditFormVisible, setEditFormVisible] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await getNotesForUser("");
        setNotes(fetchedNotes);
      } catch (err) {
        setError("Errore nel recupero delle note");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  //modifica nota
  const handleUpdateNote = async (
    noteId: string | null,
    title: string,
    content: string
  ) => {
    try {
      const updatedNote = await updateNoteForUser(noteId, title, content);
      setNotes(notes.map((note) => (note._id === noteId ? updatedNote : note))); // Aggiorna lo stato con la nota aggiornata
      setCurrentNote(null); // Resetta la nota corrente
      setEditFormVisible(false); // Nasconde il form di modifica
    } catch (error) {
      console.error("Errore nell'aggiornamento della nota:", error);
    }
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setEditFormVisible(true);
  };

  //aggiunta nota
  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newNoteTitle || !newNoteContent) {
      setError("Il titolo e il contenuto sono obbligatori");
      return;
    }

    try {
      const newNote = await addNoteForUser(newNoteTitle, newNoteContent);
      setNotes([...notes, newNote]); // Aggiungi la nuova nota alla lista esistente
      setNewNoteTitle(""); // Resetta i campi del form
      setNewNoteContent("");
      setError(null);
    } catch (err) {
      setError("Errore durante l'aggiunta della nota");
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteForUser(noteId);
      setNotes(notes.filter((note) => note._id !== noteId));
    } catch (error) {
      setError("Errore durante l'eliminazione della nota");
      console.error(error);
    }
  };

  const handleSortChange = (criteria: SortCriteria) => {
    setSortCriteria(criteria);
    const sortedNotes = [...notes];
    switch (criteria) {
      case "title":
        sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        sortedNotes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "length":
        sortedNotes.sort((a, b) => a.content.length - b.content.length);
        break;
      default:
        break;
    }
    setNotes(sortedNotes);
  };

  if (loading) {
    return <div>Caricamento in corso...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Le mie note</h1>

      {/* Form per aggiungere nuove note */}
      <form onSubmit={handleAddNote}>
        <div>
          <input
            type="text"
            placeholder="Titolo della nota"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Contenuto della nota"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            required
          />
        </div>
        <button type="submit">Aggiungi nota</button>
      </form>

      <div>
        <label htmlFor="sort">Ordina per:</label>
        <select
          id="sort"
          value={sortCriteria}
          onChange={(e) => handleSortChange(e.target.value as SortCriteria)}
        >
          <option value="title">Titolo</option>
          <option value="date">Data</option>
          <option value="length">Lunghezza</option>
        </select>
      </div>

      <ul>
        {notes.map((note) => (
          <li key={note._id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <small>
              Creato il: {new Date(note.createdAt).toLocaleDateString()}
            </small>
            <button onClick={() => handleEditNote(note)}>Modifica</button>
            <button onClick={() => handleDeleteNote(note._id)}>Elimina</button>
          </li>
        ))}
        {isEditFormVisible && currentNote && (
          <NoteForm note={currentNote} onSave={handleUpdateNote} />
        )}
      </ul>
    </div>
  );
};

export default NoteHome;
