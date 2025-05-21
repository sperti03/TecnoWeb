import React, { useEffect, useRef, useState } from "react";
import studyingcat from "../assets/studying catgif.gif";
import breakingcat from "../assets/breaking catgif2.gif";
import "./tomatostyle.css";

export default function Pomodoro() {
  const [studyTime, setStudyTime] = useState(1);
  const [pauseTime, setPauseTime] = useState(1);
  const [cycles, setCycles] = useState(1);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const styleSheetRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (phase === "idle" || phase === "end") return;

    const duration = (phase === "study" ? studyTime : pauseTime) * 60;
    setTimeLeft(duration);

    const colorHue = phase === "study" ? 45 : 215;
    document.documentElement.style.setProperty(
      "--main-color",
      `hsl(${colorHue}, 100%, 71%)`
    );
    document.documentElement.style.setProperty(
      "--second-color",
      `hsl(${colorHue}, 100%, 81%)`
    );
    document.documentElement.style.setProperty(
      "--third-color",
      `hsl(${colorHue}, 100%, 61%)`
    );
    document.documentElement.style.setProperty(
      "--fourth-color",
      `hsl(${colorHue}, 100%, 51%)`
    );
    document.documentElement.style.setProperty(
      "--fifth-color",
      `hsl(${colorHue}, 100%, 31%)`
    );
    document.documentElement.style.setProperty(
      "--sixth-color",
      `hsl(${colorHue}, 100%, 41%)`
    );

    if (styleSheetRef.current) {
      document.head.removeChild(styleSheetRef.current);
    }

    const style = document.createElement("style");
    const direction = phase === "break" ? "reverse" : "normal";
    style.innerText = `
  .ice {
    animation: shade ${duration}s linear ${direction} forwards,
               melt ${duration}s linear ${direction} forwards;
  }
  .bubble {
    animation: rotate ${duration}s linear forwards;
  }
  .bubble::before {
    animation: rotateBefore ${duration}s linear forwards;
  }
  .bubble::after {
    animation: rotateAfter ${duration}s linear forwards;
  }
`;

    document.head.appendChild(style);
    styleSheetRef.current = style;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handlePhaseSwitch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [phase]);

  const handlePhaseSwitch = () => {
    if (phase === "study") {
      setPhase("break");
    } else if (phase === "break") {
      if (currentCycle + 1 < cycles) {
        setCurrentCycle((c) => c + 1);
        setPhase("study");
      } else {
        setPhase("end");
      }
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentCycle(0);
    setPhase("study");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div id="pomodoro">
      <h1>pomodoro popsicle</h1>
      {phase === "idle" && (
        <form onSubmit={handleStart} id="studyForm">
          <div className="elenco">
            <label>Study Time:</label>
            <input
              type="number"
              value={studyTime}
              onChange={(e) => setStudyTime(parseInt(e.target.value))}
              min="1"
              required
            />
            <label>Break Time:</label>
            <input
              type="number"
              value={pauseTime}
              onChange={(e) => setPauseTime(parseInt(e.target.value))}
              min="1"
              required
            />
            <label>Sessions:</label>
            <input
              type="number"
              value={cycles}
              onChange={(e) => setCycles(parseInt(e.target.value))}
              min="1"
              required
            />
          </div>
          <div className="startbutton">
            <button type="submit">Start Studying</button>
          </div>
        </form>
      )}

      <div id="clock">
        <div id="textOnClock">
          {phase === "study" && "STUDY"}
          {phase === "break" && "BREAK"}
          {phase === "end" && "The End"}
          {phase === "idle" && "get started"}
        </div>
        {phase !== "idle" && phase !== "end" && (
          <div className="timer" id="timerDisplay">
            {formatTime(timeLeft)}
          </div>
        )}
        {phase !== "idle" && phase !== "end" && (
          <div id="cycleCounter">
            Session: {currentCycle + 1}/{cycles}
          </div>
        )}
      </div>

      <div className="stick">
        <span className="stickwrite">you won a break!</span>
        <div className="ice"></div>
      </div>

      <div className="bubble"></div>

      <div
        className="catimages"
        style={{ display: phase === "study" ? "flex" : "none" }}
      >
        <img
          className="image"
          src={studyingcat}
          style={{ transform: "scaleX(-1)" }}
        />
        <img className="image" src={studyingcat} />
      </div>

      <div
        className="catimages"
        style={{ display: phase === "break" ? "flex" : "none" }}
      >
        <img
          className="image"
          src={breakingcat}
          style={{ transform: "scaleX(-1)" }}
        />
        <img className="image" src={breakingcat} />
      </div>
    </div>
  );
}
