import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Message from "./Message";
import "./HomePage.css"; // Importiamo un file CSS separato per lo styling
import { returnfirstNote } from "./../Note/NoteHome"; // Importa la funzione returnfirstNote
import { Note } from "./../Note/types"; // Assicurati di avere un tipo Note definito

function HomePage() {
  const [firstNote, setFirstNote] = useState<Note | null>(null); // Stato per la prima nota
  const [loading, setLoading] = useState(true); // Stato per il caricamento
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFirstNote = async () => {
      const note = await returnfirstNote(); // Chiama la funzione che recupera la prima nota
      setFirstNote(note); // Salva la nota nello stato
      setLoading(false); // Fine del caricamento
    };

    fetchFirstNote();
  }, []); // Effetto per il caricamento della prima nota al montaggio del componente

  return (
    <div className="homepage-container">
      <div className="greeting-section">
        <Message />
      </div>

      <div className="card-container">
        <div className="homecard">
          <div className="cardtitle">Calendario</div>
          <div className="card-body"></div>
        </div>

        <div className="homecard">
          <div className="cardtitle">Note</div>
          <div className="card-body">
            {firstNote && (
              <>
                <h4>{firstNote.title}</h4>
                <p>{firstNote.content.slice(0, 200)}...</p>{" "}
              </>
            )}

            {!firstNote && <p>Nessuna Nota</p>}
          </div>
          <button
            className="button-card   bottom"
            onClick={() => navigate("/Note")}
          >
            Vai a tutte le note
          </button>
        </div>

        <div className="homecard">
          <div className="cardtitle">Pomodoro</div>
          <div className="card-body"></div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
