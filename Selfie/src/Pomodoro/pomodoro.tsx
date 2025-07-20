import React, { useEffect, useRef, useState } from "react";
import studyingcat from "../assets/studying catgif.gif";
import breakingcat from "../assets/breaking catgif2.gif";
import "./tomatostyle.css";
import { StudyCycleService } from "../StudyCycle/StudyCycleService";
import { InvitationService } from "../StudyCycle/InvitationService";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import InvitationModal from "./InvitationModal";

export default function Pomodoro() {
  // Set Pomodoro defaults: 30 min study, 5 min break, 5 cycles
  const [studyTime, setStudyTime] = useState(30);
  const [pauseTime, setPauseTime] = useState(5);
  const [cycles, setCycles] = useState(5);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const styleSheetRef = useRef<HTMLStyleElement | null>(null);
  const [iceKey, setIceKey] = useState(0);
  const [totalTime, setTotalTime] = useState("");
  const [proposals, setProposals] = useState<
    { study: number; break: number; cycles: number }[]
  >([]);
  const [notification, setNotification] = useState<string>("");
  const [currentStudyCycleId, setCurrentStudyCycleId] = useState<string | null>(
    null
  );
  const [studyCycleTitle, setStudyCycleTitle] = useState<string>("");
  const [searchParams] = useSearchParams();
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [sharedSession, setSharedSession] = useState<any>(null);
  const [sessionParticipants, setSessionParticipants] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Show notification for a few seconds
  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  }

  // Notify on phase/cycle changes
  useEffect(() => {
    if (phase === "study") {
      showNotification(
        `Inizio sessione di studio (${currentCycle + 1}/${cycles})`
      );
    } else if (phase === "break") {
      showNotification(`Pausa! (${currentCycle + 1}/${cycles})`);
    } else if (phase === "end") {
      showNotification("Ciclo completato!");
    }
  }, [phase]);

  // Helper to parse total time input (e.g., '200', '3h', '2:30')
  function parseTotalTime(input: string): number | null {
    if (!input) return null;
    let min = 0;
    if (/^\d+$/.test(input)) return parseInt(input); // just minutes
    if (/^(\d+)h$/.test(input)) return parseInt(input) * 60;
    if (/^(\d+):(\d+)$/.test(input)) {
      const [h, m] = input.split(":").map(Number);
      return h * 60 + m;
    }
    return null;
  }

  // Generate proposals when totalTime changes
  useEffect(() => {
    const min = parseTotalTime(totalTime);
    if (!min || min < 40) {
      setProposals([]);
      return;
    }
    // Proposals: try to maximize study time, keep break reasonable
    // Try 5-10 cycles, break 5-15 min, study at least 20 min
    const props = [];
    for (let cycles = 5; cycles <= 10; cycles++) {
      for (let breakMin = 5; breakMin <= 15; breakMin += 5) {
        const studyMin = Math.floor((min - cycles * breakMin) / cycles);
        if (studyMin >= 20 && studyMin > breakMin) {
          props.push({ study: studyMin, break: breakMin, cycles });
        }
      }
    }
    // Sort by cycles descending, then study time descending
    props.sort((a, b) => b.cycles - a.cycles || b.study - a.study);
    setProposals(props.slice(0, 3)); // show up to 3 proposals
  }, [totalTime]);

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
  useEffect(() => {
    setIceKey((k) => k + 1);
  }, [phase]);
  const handlePhaseSwitch = () => {
    if (phase === "study") {
      setPhase("break");
    } else if (phase === "break") {
      if (currentCycle + 1 < cycles) {
        setCurrentCycle((c) => c + 1);
        setPhase("study");
        // Update study cycle progress if applicable
        updateStudyCycleProgress(currentCycle + 1, "in-progress");
      } else {
        setPhase("end");
        // Mark study cycle as completed
        completeStudyCycle(cycles, "completed");
      }
    }
  };

  const updateStudyCycleProgress = async (
    completedCycles: number,
    status: string
  ) => {
    if (currentStudyCycleId) {
      try {
        await StudyCycleService.updateProgress(currentStudyCycleId, {
          completedCycles,
          status,
        });
      } catch (error) {
        console.error("Failed to update study cycle progress:", error);
      }
    }
  };

  const completeStudyCycle = async (
    completedCycles: number,
    status: string
  ) => {
    if (currentStudyCycleId) {
      try {
        const totalStudyTime = completedCycles * studyTime; // Calculate total study time
        const result = await StudyCycleService.completeStudyCycle(
          currentStudyCycleId,
          {
            completedCycles,
            totalTime: totalStudyTime,
          }
        );

        if (result.rescheduledCycle) {
          showNotification(
            `Study cycle rescheduled for ${new Date(result.rescheduledCycle.scheduledDate).toLocaleDateString()}`
          );
        } else {
          showNotification("Study cycle completed successfully!");
        }
      } catch (error) {
        console.error("Failed to complete study cycle:", error);
        showNotification("Failed to save study cycle completion");
      }
    }
  };

  // Handlers for new controls
  function handleForceNext() {
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
  }
  function handleRestartCycle() {
    // Clear existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Restart the current phase without triggering phase change notifications
    const currentPhase = phase;
    if (currentPhase === "study") {
      // Just reset the timer for study phase
      setTimeLeft(studyTime * 60);
      showNotification("Sessione di studio riavviata");

      // Restart the interval
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
    } else if (currentPhase === "break") {
      // Just reset the timer for break phase
      setTimeLeft(pauseTime * 60);
      showNotification("Pausa riavviata");

      // Restart the interval
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
    }
  }
  function handleEndCycle() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setPhase("end");

    // Mark study cycle as incomplete if ended early
    if (currentStudyCycleId && currentCycle < cycles) {
      completeStudyCycle(currentCycle, "incomplete");
    }

    showNotification("Sessione terminata");
  }

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

  // Load study cycle settings from URL parameters
  useEffect(() => {
    const studyCycleId = searchParams.get("studyCycleId");
    const sessionId = searchParams.get("sessionId");
    const invitationId = searchParams.get("invitationId");

    if (studyCycleId) {
      loadStudyCycleSettings(studyCycleId);
    } else if (sessionId) {
      loadSharedSessionSettings(sessionId);
    } else if (invitationId) {
      // Handle direct invitation acceptance
      handleInvitationAcceptance(invitationId);
    }
  }, [searchParams]);

  // Check for invitation study settings on component mount
  useEffect(() => {
    const invitationSettings = sessionStorage.getItem(
      "invitationStudySettings"
    );
    if (invitationSettings) {
      try {
        const settings = JSON.parse(invitationSettings);

        // Apply invitation settings
        if (settings.studyTime) setStudyTime(settings.studyTime);
        if (settings.pauseTime) setPauseTime(settings.pauseTime);
        if (settings.cycles) setCycles(settings.cycles);
        if (settings.title) setStudyCycleTitle(settings.title);

        // Show notification about loaded settings
        showNotification(
          `Impostazioni caricate dall'invito: ${settings.studyTime || studyTime}min studio, ${settings.pauseTime || pauseTime}min pausa, ${settings.cycles || cycles} cicli`
        );

        // Clear the settings from session storage
        sessionStorage.removeItem("invitationStudySettings");
      } catch (error) {
        console.error("Error parsing invitation settings:", error);
      }
    }
  }, []);

  // Handle invitation settings from navigation state
  useEffect(() => {
    if (location.state?.fromInvitation && location.state?.studySettings) {
      const settings = location.state.studySettings;

      // Apply invitation settings
      if (settings.studyTime) setStudyTime(settings.studyTime);
      if (settings.pauseTime) setPauseTime(settings.pauseTime);
      if (settings.cycles) setCycles(settings.cycles);
      if (settings.title) setStudyCycleTitle(settings.title);

      // Show notification about loaded settings
      showNotification(
        `Invito accettato! Impostazioni: ${settings.studyTime || studyTime}min studio, ${settings.pauseTime || pauseTime}min pausa, ${settings.cycles || cycles} cicli`
      );

      // Clear the navigation state
      navigate("/pomodoro", { replace: true });
    }
  }, [location.state, navigate]);

  const loadStudyCycleSettings = async (cycleId: string) => {
    try {
      const studyCycles = await StudyCycleService.getStudyCycles();
      const studyCycle = studyCycles.find(
        (cycle: any) => cycle._id === cycleId
      );

      if (studyCycle) {
        setStudyTime(studyCycle.studyTime);
        setPauseTime(studyCycle.pauseTime);
        setCycles(studyCycle.cycles);
        setCurrentStudyCycleId(cycleId);
        setStudyCycleTitle(studyCycle.title);
        showNotification(`Loaded: ${studyCycle.title} - ${studyCycle.subject}`);
      }
    } catch (error) {
      showNotification("Failed to load study cycle settings");
    }
  };

  const loadSharedSessionSettings = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}`
      );
      if (response.ok) {
        const session = await response.json();
        setStudyTime(session.studyTime);
        setPauseTime(session.pauseTime);
        setCycles(session.cycles);
        setSharedSession({
          sessionId: sessionId,
          participants: session.participants,
          hostName: session.hostName,
        });
        showNotification(`Joined shared session with ${session.hostName}!`);
      }
    } catch (error) {
      showNotification("Failed to load shared session settings");
    }
  };

  const handleInvitationAcceptance = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/invitations/${invitationId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: localStorage.getItem("userId") }),
        }
      );

      if (response.ok) {
        const invitation = await response.json();
        setStudyTime(invitation.studyTime);
        setPauseTime(invitation.pauseTime);
        setCycles(invitation.cycles);
        setSharedSession({
          sessionId: invitation.sessionId,
          participants: invitation.participants,
          hostName: invitation.senderName,
        });
        showNotification(`Joined study session with ${invitation.senderName}!`);
      }
    } catch (error) {
      showNotification("Failed to accept invitation");
    }
  };

  const handleSaveToCalendar = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // Default to 2 PM tomorrow

      const studyCycleData = {
        title: `Study Session`,
        subject: `Focus Session`,
        studyTime: studyTime,
        pauseTime: pauseTime,
        cycles: cycles,
        scheduledDate: tomorrow.toISOString().split("T")[0],
        scheduledTime: "14:00",
      };

      const result = await StudyCycleService.createStudyCycle(studyCycleData);
      showNotification(`Study session scheduled! Redirecting to calendar...`);

      // Navigate to calendar after a brief delay
      setTimeout(() => {
        navigate("/CalendarHome");
      }, 2000);
    } catch (error) {
      console.error("Failed to save to calendar:", error);
      showNotification("Failed to save to calendar");
    }
  };

  return (
    <div id="pomodoro">
      {notification && (
        <div className="notification-message">{notification}</div>
      )}
      <div className="pomodoro-card">
        <div className="header-section">
          <h1>
            {studyCycleTitle
              ? `${studyCycleTitle} - Pomodoro Timer`
              : "Pomodoro Timer"}
          </h1>
          {sharedSession && (
            <div className="shared-session-indicator">
              <div className="session-badge">
                <span className="session-icon">👥</span>
                <span>Shared Session with {sharedSession.hostName}</span>
                <span className="participant-count">
                  ({sharedSession.participants?.length || 0} participants)
                </span>
              </div>
            </div>
          )}
        </div>
        {phase === "idle" && (
          <form onSubmit={handleStart} id="studyForm">
            <div className="elenco">
              <label>Total available time (min, 3h, 2:30):</label>
              <input
                type="text"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                placeholder="200, 3h, 2:30..."
                className={proposals.length ? "with-proposals" : ""}
              />
              {proposals.length > 0 && (
                <div className="proposals-container">
                  <div className="proposals-title">Proposals:</div>
                  {proposals.map((p, i) => (
                    <button
                      type="button"
                      key={i}
                      className="proposal-button"
                      onClick={() => {
                        setStudyTime(p.study);
                        setPauseTime(p.break);
                        setCycles(p.cycles);
                      }}
                    >
                      {p.cycles}x{p.study}+{p.break}
                    </button>
                  ))}
                </div>
              )}
              <label>Study Time (minutes):</label>
              <input
                type="number"
                value={studyTime}
                onChange={(e) => setStudyTime(parseInt(e.target.value))}
                min="1"
                required
                placeholder="30"
              />
              <label>Break Time (minutes):</label>
              <input
                type="number"
                value={pauseTime}
                onChange={(e) => setPauseTime(parseInt(e.target.value))}
                min="1"
                required
                placeholder="5"
              />
              <label>Sessions:</label>
              <input
                type="number"
                value={cycles}
                onChange={(e) => setCycles(parseInt(e.target.value))}
                min="1"
                required
                placeholder="5"
              />
            </div>
            <div className="feature-buttons">
              <button
                type="button"
                className="feature-button invite-button"
                onClick={() => setShowInvitationModal(true)}
              >
                👥 Invite Friends
              </button>
              <button
                type="button"
                className="feature-button calendar-button"
                onClick={handleSaveToCalendar}
              >
                📅 Save to Calendar
              </button>
            </div>
            <div className="startbutton">
              <button type="submit">Start</button>
            </div>
          </form>
        )}
        {/* Timer/info at top, not overlapping ice cream */}
        {phase !== "idle" && (
          <div className="timer-container">
            <div id="clock">
              <div id="textOnClock">
                {phase === "study" && "STUDY"}
                {phase === "break" && "BREAK"}
                {phase === "end" && "The End"}
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
          </div>
        )}
        {/* Ice cream and bubble centered, bubble behind ice cream */}
        {(phase === "study" || phase === "break") && (
          <div className="ice-cream-container">
            <div className="bubble"></div>
            <div className="ice-stick-container">
              <div className="ice" key={iceKey}></div>
              <div className="stick">
                <span className="stickwrite">Pausa!</span>
              </div>
            </div>
          </div>
        )}
        {/* Controls for active phase */}
        {(phase === "study" || phase === "break") && (
          <div className="control-buttons">
            <button
              type="button"
              onClick={handleForceNext}
              className="control-button advance"
            ></button>
            <button
              type="button"
              onClick={handleRestartCycle}
              className="control-button restart"
            ></button>
            <button
              type="button"
              onClick={handleEndCycle}
              className="control-button end"
            ></button>
          </div>
        )}
      </div>

      {/* Invitation Modal */}
      {showInvitationModal && (
        <InvitationModal
          isOpen={showInvitationModal}
          onClose={() => setShowInvitationModal(false)}
          studySettings={{
            studyTime,
            pauseTime,
            cycles,
          }}
        />
      )}
    </div>
  );
}
