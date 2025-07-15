import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import "./App.css";
import AuthPage from "./Authentication/AuthPage";
import HomePage from "./Homepage/HomePage";
import NoteHome from "./Note/NoteHome";
import TimeMachineComponent from "./TimeMachine/TimeMachine";
import CalendarHome from "./calendar/Calendar";
import Pomodoro from "./Pomodoro/pomodoro";
import { NotificationService } from "./services/NotificationService";
import { StudyCycleAutoService } from "./services/StudyCycleAutoService";

// Define types
interface User {
  id: string;
}

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

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Invitation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for current user on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (token && userId) {
      setCurrentUser({ id: userId });
    }
  }, []);

  // Periodic polling for notifications
  useEffect(() => {
    if (!currentUser) return;

    const checkNotifications = async () => {
      try {
        const pendingInvitations =
          await NotificationService.checkPendingInvitations(currentUser.id);
        setNotifications(pendingInvitations);
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    // Check immediately
    checkNotifications();

    // Set up periodic polling every 30 seconds
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Check for incomplete cycles and move them to next day
  useEffect(() => {
    if (!currentUser) return;

    const checkIncompleteCycles = async () => {
      try {
        const movedCount = await StudyCycleAutoService.autoMoveIncompleteCycles(
          currentUser.id
        );
        if (movedCount > 0) {
          console.log(`Moved ${movedCount} incomplete study cycles to today`);
        }
      } catch (error) {
        console.error("Error checking incomplete cycles:", error);
      }
    };

    // Check on app start
    checkIncompleteCycles();

    // Check every hour
    const cycleInterval = setInterval(checkIncompleteCycles, 60 * 60 * 1000);

    return () => clearInterval(cycleInterval);
  }, [currentUser]);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      // Find the invitation to get study settings
      const invitation = notifications.find(
        (notif) => notif._id === invitationId
      );

      await NotificationService.acceptInvitation(invitationId);

      // Remove the notification from the list
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== invitationId)
      );

      // Store study settings in sessionStorage for Pomodoro component
      if (invitation?.studySettings) {
        sessionStorage.setItem(
          "invitationStudySettings",
          JSON.stringify(invitation.studySettings)
        );
      }

      // Navigate to Pomodoro
      navigate("/Pomodoro");
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await NotificationService.declineInvitation(invitationId);
      // Remove the notification from the list
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== invitationId)
      );
    } catch (error) {
      console.error("Error declining invitation:", error);
    }
  };

  const handleDismissNotification = (invitationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif._id !== invitationId)
    );
  };

  return (
    <>
      {location.pathname !== "/auth" && <TimeMachineComponent />}
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/Homepage"
          element={
            <HomePage
              notifications={notifications}
              onAcceptInvitation={handleAcceptInvitation}
              onDeclineInvitation={handleDeclineInvitation}
            />
          }
        />
        <Route path="/Note" element={<NoteHome />} />
        <Route path="/CalendarHome" element={<CalendarHome />} />
        <Route path="/Pomodoro" element={<Pomodoro />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
