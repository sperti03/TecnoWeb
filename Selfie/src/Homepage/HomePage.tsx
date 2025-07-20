import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Hello from "./Hello";
import MessageList from "../Messages/MessageList";
import { returnfirstNote } from "../Note/NoteHome";
import { Note, SortCriteria } from "../Note/types";
import Account from "../Account/Account";
import NotificationButton from "../components/NotificationButton/NotificationButton";
import "./HomePage.css";
import { v4 as uuidv4 } from "uuid";
import Carousel from "react-spring-3d-carousel";
import { config } from "react-spring";
import { useDrag } from "@use-gesture/react";
import { FaCalendarAlt, FaStickyNote, FaRegClock, FaProjectDiagram } from "react-icons/fa";

interface Invitation {
  _id: string;
  senderId: {
    username: string;
    email: string;
  };
  studySettings: any;
  message: string;
  status: string;
  createdAt: string;
}

interface HomePageProps {
  notifications?: Invitation[];
  onAcceptInvitation?: (invitationId: string) => void;
  onDeclineInvitation?: (invitationId: string) => void;
}

function HomePage({
  notifications = [],
  onAcceptInvitation = () => {},
  onDeclineInvitation = () => {},
}: HomePageProps) {
  const navigate = useNavigate();
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("date");
  const [offsetRadius] = useState(1);
  const [goToSlide, setGoToSlide] = useState(0);
  const totalSlides = 4;
  const [isDragging, setIsDragging] = useState(false);

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

  const cards = [0, 1, 2, 3].map((index) => {
    const baseStyle: React.CSSProperties = {
      userSelect: "none",
      cursor: "pointer",
      opacity: 1,
      filter: "none",
      transform: "none",
    };

    const commonProps = {
      style: baseStyle,
      onClick: () => {
        if (!isDragging) setGoToSlide(index);
      },
    };

    if (index === 0) {
      return {
        key: uuidv4(),
        content: (
          <div className="homecard calendario" {...commonProps}>
            <div className="cardtitle">
              <FaCalendarAlt className="icon" /> Calendario
            </div>
            <div className="card-body">
              <button
                className="button-card"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/CalendarHome");
                }}
              >
                Vai a Calendario
              </button>
            </div>
          </div>
        ),
      };
    }

    if (index === 1) {
      return {
        key: uuidv4(),
        content: (
          <div className="homecard note" {...commonProps}>
            <div className="cardtitle">
              <FaStickyNote className="icon" /> Note
            </div>
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
              className="button-card"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/Note");
              }}
            >
              Vai a tutte le note
            </button>
            <div>
              <label htmlFor="sort">Ordina per:</label>
              <select
                id="sort"
                value={sortCriteria}
                onChange={(e) =>
                  setSortCriteria(e.target.value as SortCriteria)
                }
              >
                <option value="title">Titolo</option>
                <option value="date">Data</option>
                <option value="length">Lunghezza</option>
              </select>
            </div>
          </div>
        ),
      };
    }

    if (index === 2) {
      return {
        key: uuidv4(),
        content: (
          <div className="homecard pomodoro" {...commonProps}>
            <div className="cardtitle">
              <FaRegClock className="icon" /> Pomodoro
            </div>
            <div className="card-body">
              <button
                className="button-card"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/Pomodoro");
                }}
              >
                Vai a Pomodoro
              </button>
            </div>
          </div>
        ),
      };
    }

    return {
      key: uuidv4(),
      content: (
        <div className="homecard progetti" {...commonProps}>
          <div className="cardtitle">
            <FaProjectDiagram className="icon" /> Progetti
          </div>
          <div className="card-body">
            <p>Gestisci i tuoi progetti e task</p>
            <button
              className="button-card"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/Projects");
              }}
            >
              Vai a Progetti
            </button>
          </div>
        </div>
      ),
    };
  });

  const bind = useDrag(({ down, movement: [mx], last }) => {
    if (last) {
      if (mx > 50) {
        setGoToSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
      } else if (mx < -50) {
        setGoToSlide((prev) => (prev + 1) % totalSlides);
      }
    }
  });

  return (
    <div className="homepage-container">
      <div className="greeting-section">
        <Hello />
      </div>

      <Account />

      <NotificationButton
        notifications={notifications}
        onAccept={onAcceptInvitation}
        onDecline={onDeclineInvitation}
      />

      <div className="main-content-wrapper">
        <div className="center-content">
          <MessageList />
          
          <div className="section">
            <h2>🗓️ Calendario</h2>
            <p>Organizza i tuoi eventi e impegni</p>
            <div className="button-group">
              <button onClick={() => navigate('/calendar')} className="home-button calendar-button">
                📅 Apri Calendario
              </button>
              <button onClick={() => navigate('/calendario-unificato')} className="home-button calendar-unified-button">
                🔄 Calendario Unificato
              </button>
              <button onClick={() => navigate('/calendario-avanzato')} className="home-button calendar-advanced-button">
                ⚡ Calendario Avanzato
              </button>
              <button onClick={() => navigate('/calendario-dashboard')} className="home-button calendar-dashboard-button">
                📊 Dashboard Calendario
              </button>
            </div>
          </div>
          
          <div className="carousel-wrapper" {...bind()}>
            <Carousel
              slides={cards}
              goToSlide={goToSlide}
              showNavigation={false}
              offsetRadius={offsetRadius}
              animationConfig={config.gentle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
