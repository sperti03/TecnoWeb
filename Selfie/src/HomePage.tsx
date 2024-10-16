import React from "react";
import { useNavigate } from "react-router-dom";
import Message from "./Message";
import NoteHome from "./Note/NoteHome";

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="saluto">
        <Message></Message>
      </div>
      <div className="cardContainer">
        <div className="card">
          <div className="card-body">calendario</div>
        </div>
        <div className="card">
          <div className="card-body">
            <button
              onClick={() => {
                navigate("/Note");
              }}
            >
              Go to NoteHome
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-body">Pomodoro</div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
