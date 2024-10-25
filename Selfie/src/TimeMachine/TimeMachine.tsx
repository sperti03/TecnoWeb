import React, { useState, useEffect } from "react";
import "./TimeMachine.css";
import { getTime, setTime, resetTime, advanceTime } from "./TimeMachineService";

const TimeMachineComponent: React.FC = () => {
  const [virtualTime, setVirtualTime] = useState<Date>(new Date());
  const [inputTime, setInputTime] = useState<string>(
    virtualTime.toISOString().slice(0, 16)
  );
  const [milliseconds, setMilliseconds] = useState<number>(1000);
  const [isOpen, setIsOpen] = useState<boolean>(false); // Stato per mostrare/nascondere la Time Machine

  // Ottiene il tempo iniziale dal backend al caricamento della componente
  useEffect(() => {
    const fetchTime = async () => {
      try {
        const time = await getTime();
        setVirtualTime(time);
        setInputTime(time.toISOString().slice(0, 16));
      } catch (error) {
        console.error("Errore nel recupero del tempo virtuale:", error);
      }
    };
    fetchTime();
  }, []);

  // Funzione per impostare una nuova data e ora virtuale
  const handleSetTime = async () => {
    try {
      const newTime = new Date(inputTime);
      const updatedTime = await setTime(newTime);
      setVirtualTime(updatedTime);
    } catch (error) {
      console.error("Errore durante l'impostazione del tempo:", error);
    }
  };

  // Funzione per resettare la data virtuale alla data e ora di sistema
  const handleResetTime = async () => {
    try {
      const resetToSystemTime = await resetTime();
      setVirtualTime(resetToSystemTime);
    } catch (error) {
      console.error("Errore durante il reset del tempo:", error);
    }
  };

  // Funzione per avanzare il tempo virtuale
  const handleAdvanceTime = async () => {
    try {
      const advancedTime = await advanceTime(milliseconds);
      setVirtualTime(new Date(advancedTime));
    } catch (error) {
      console.error("Errore durante l'avanzamento del tempo:", error);
    }
  };

  // Gestione dell'avanzamento automatico del tempo
  useEffect(() => {
    const interval = setInterval(() => {
      handleAdvanceTime();
    }, milliseconds);

    return () => {
      clearInterval(interval);
    };
  }, [milliseconds]);

  return (
    <>
      <button
        className="time-machine-button"
        onClick={() => setIsOpen(!isOpen)} // Gestione apertura e chiusura
      >
        Time Machine
      </button>

      <div className={`time-machine-container ${isOpen ? "open" : ""}`}>
        <p>Tempo virtuale corrente: {virtualTime.toLocaleString()}</p>

        <label>
          Imposta Data/Ora:
          <input
            type="datetime-local"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
          />
        </label>
        <button onClick={handleSetTime}>Imposta</button>

        <button onClick={handleResetTime}>Resetta al Tempo Reale</button>
      </div>
    </>
  );
};

export default TimeMachineComponent;
