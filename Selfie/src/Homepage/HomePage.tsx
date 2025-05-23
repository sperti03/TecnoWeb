import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Hello from "./Hello";
import MessageList from "../Messages/MessageList";
import "./HomePage.css";
import { returnfirstNote } from "./../Note/NoteHome";
import { Note, SortCriteria } from "./../Note/types";
import CalendarHome from "../calendar/Calendar";
function HomePage() {
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("date");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFirstNote = async () => {
      const note = await returnfirstNote(sortCriteria);
      setFirstNote(note);
      setLoading(false);
    };

    fetchFirstNote();
  }, [sortCriteria]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortCriteria(e.target.value as SortCriteria);
  };

  return (
    <div className="homepage-container">
      <div className="greeting-section">
        <Hello />
      </div>
      <div className="nav-bar">
        <i className="bi bi-gear"></i>
        <MessageList />
      </div>

      <div className="card-container">
        <div className="homecard">
          <div className="cardtitle">Calendario</div>
          <div className="card-body">
            <button
              className="button-card bottom"
              onClick={() => navigate("/CalendarHome")}
            >
              Vai a Calendario
            </button>
            <p></p>
          </div>
        </div>
        <div className="homecard">
          <div className="cardtitle">Note</div>
          <div className="card-body">
            {loading ? (
              <p>Caricamento...</p>
            ) : firstNote ? (
              <>
                <h4>{firstNote.title}</h4>
                <p>{firstNote.content.slice(0, 200)}...</p>
              </>
            ) : (
              <p>Nessuna Nota</p>
            )}
          </div>
          <button
            className="button-card bottom"
            onClick={() => navigate("/Note")}
          >
            Vai a tutte le note
          </button>

          <div>
            <label htmlFor="sort">Ordina per:</label>
            <select id="sort" value={sortCriteria} onChange={handleSortChange}>
              <option value="title">Titolo</option>
              <option value="date">Data</option>
              <option value="length">Lunghezza</option>
            </select>
          </div>
        </div>

        <div className="homecard">
          <div className="cardtitle">Pomodoro</div>
          <div className="card-body">
            <button
              className="button-card bottom"
              onClick={() => navigate("/Pomodoro")}
            >
              Vai a Pomodoro
            </button>
            <p></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
