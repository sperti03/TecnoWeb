import React from "react";
import NotePreview from "./NotePreview.tsx";
import { Note } from "./types.ts";

interface NoteListProps {
  notes: Note[];
}

const NoteList: React.FC<NoteListProps> = ({ notes }) => {
  return (
    <div>
      {notes.length === 0 ? (
        <p>Nessuna nota disponibile, porco di dio</p>
      ) : (
        notes.map((note) => <NotePreview key={note.id} note={note} />)
      )}
    </div>
  );
};

export default NoteList;
