import React, { useEffect, useState } from "react";
import "./notestyle.css";

import {
  getNotesForUser,
  addNoteForUser,
  updateNoteForUser,
  deleteNoteForUser,
} from "./NoteService"; // Importa la funzione per aggiungere note
import NoteForm from "./EditNoteForm";
import { SortCriteria, Note } from "./types";
import { marked } from "marked";

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
  const [newAccessType, setNewAccessType] = useState("public"); // Aggiungi stato per il tipo di accesso
  const [newLimitedUsers, setNewLimitedUsers] = useState<string[]>([]); // Aggiungi stato per la lista limitata

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

  // Aggiunta nota
  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newNoteTitle || !newNoteContent) {
      setError("Il titolo e il contenuto sono obbligatori");
      return;
    }

    try {
      const newNote = await addNoteForUser(
        newNoteTitle,
        newNoteContent,
        newAccessType,
        newLimitedUsers
      ); // Includi gli altri parametri
      setNotes([...notes, newNote]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewAccessType("public");
      setNewLimitedUsers([]);
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
    <div className="notes-container">
      <h1>Le mie note</h1>

      {/* Form per aggiungere nuove note */}
      <form onSubmit={handleAddNote} className="notes-form">
        <input
          type="text"
          placeholder="Titolo della nota"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Contenuto della nota"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          required
        />
        <div>
          <label htmlFor="newAccessType">Tipo di accesso:</label>
          <select
            id="newAccessType"
            value={newAccessType}
            onChange={(e) => setNewAccessType(e.target.value)}
          >
            <option value="public">Pubblica</option>
            <option value="private">Privata</option>
            <option value="limited">Limitata</option>
          </select>
        </div>

        {newAccessType === "limited" && (
          <div>
            <input
              type="text"
              placeholder="Aggiungi username"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const username = e.currentTarget.value.trim();
                  if (username && !newLimitedUsers.includes(username)) {
                    setNewLimitedUsers([...newLimitedUsers, username]);
                  }
                  e.currentTarget.value = "";
                }
              }}
            />
            <ul>
              {newLimitedUsers.map((user, index) => (
                <li key={index}>{user}</li>
              ))}
            </ul>
          </div>
        )}
        <button type="submit">Aggiungi nota</button>
      </form>

      <div className="notes-sort">
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

      <ul className="notes-list">
        {notes.map((note) => (
          <li key={note._id}>
            <h3>{note.title}</h3>
            <div
              dangerouslySetInnerHTML={{ __html: marked(note.content) }}
            ></div>
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

export const returnfirstNote = async (sortCriteria: SortCriteria) => {
  try {
    const notes = await getNotesForUser(""); // Ottieni le note dell'utente

    if (notes.length > 0) {
      // Ordina le note in base al criterio selezionato
      switch (sortCriteria) {
        case "title":
          notes.sort((a: Note, b: Note) => a.title.localeCompare(b.title));
          break;
        case "date":
          notes.sort(
            (a: Note, b: Note) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "length":
          notes.sort((a: Note, b: Note) => a.content.length - b.content.length);
          break;
        default:
          break;
      }

      return notes[0]; // Restituisci la prima nota in base all'ordinamento
    } else {
      return null; // Nessuna nota trovata
    }
  } catch (error) {
    console.error("Errore nel recupero della prima nota:", error);
    return null;
  }
};

export default NoteHome;
