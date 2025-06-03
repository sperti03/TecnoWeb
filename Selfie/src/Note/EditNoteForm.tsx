import React, { useState, useEffect } from "react";
import { Note } from "./types";
import "./notestyle.css";

interface NoteFormProps {
  note?: Note;
  onSave: (id: string | null, title: string, content: string) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Se non c'è una nota, passiamo null come ID
    const noteId = note ? note._id : null;

    onSave(noteId, title, content);

    // Resetta il form solo se stai creando una nuova nota
    if (!note) {
      setTitle("");
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="notes-edit-form">
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
      <button type="submit">{note ? "Aggiorna Nota" : "Salva Nota"}</button>
    </form>
  );
};

export default NoteForm;
