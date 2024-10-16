import React from "react";
import { Note } from "./types";

interface NotePreviewProps {
  note: Note;
}

const NotePreview: React.FC<NotePreviewProps> = ({ note }) => {
  return (
    <div>
      <h3>{note.title}</h3>
      <p>{note.content.substring(0, 200)}...</p>
      <small>Creata il: {new Date(note.createdAt).toLocaleDateString()}</small>
    </div>
  );
};

export default NotePreview;
