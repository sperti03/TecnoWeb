import React, { useState, useEffect } from "react";
import { addNoteForUser, updateNoteForUser } from "./NoteService.js";
import { Note } from "./types";

interface NoteFormProps {
  note?: Note;
  userId: string; // Aggiungi l'ID dell'utente come prop
  onSave: (title: string, content: string) => void; // Modifica qui per accettare due parametri
}

const NoteForm: React.FC<NoteFormProps> = ({ note, userId, onSave }) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");

  useEffect(() => {
    // Se la nota viene passata come prop, aggiorna il titolo e il contenuto
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Crea una nuova nota, assicurandoti che contenga l'userId
    const newNote: Note = {
      id: note?.id || Date.now().toString(), // Assicurati che l'ID sia una stringa
      title,
      content,
      userId, // Associa la nota all'utente corrente
      createdAt: note?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      // Se la nota esiste, aggiornala; altrimenti, aggiungi una nuova nota
      if (note?.id) {
        await updateNoteForUser(userId, note.id, title, content); // Chiama la funzione di aggiornamento
      } else {
        await addNoteForUser(userId, title, content); // Chiama la funzione di aggiunta
      }
      onSave(title, content); // Passa i dati della nota a onSave
    } catch (error) {
      console.error("Errore durante il salvataggio della nota:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Titolo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Scrivi la tua nota..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button type="submit">Salva Nota</button>
    </form>
  );
};

export default NoteForm;
