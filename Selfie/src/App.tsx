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
import MasterCalendar from "./calendar/MasterCalendar";
import Pomodoro from "./Pomodoro/pomodoro";
import ProjectHome from "./Progetti/ProjectHome.js";
import UnifiedCalendar from './calendar/UnifiedCalendar';
import AdvancedCalendar from './calendar/AdvancedCalendar';
import CalendarDashboard from './calendar/CalendarDashboard';
import StudyCycleManager from './StudyCycle/StudyCycleManager';
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

  // Initialize auto-reschedule system and check for incomplete cycles
  useEffect(() => {
    if (!currentUser) return;

    // Initialize the automatic reschedule system
    const initAutoReschedule = async () => {
      try {
        // Request notification permission
        await StudyCycleAutoService.requestNotificationPermission();
        
        // Initialize daily auto-reschedule system
        StudyCycleAutoService.initializeAutoReschedule();
        
        console.log('🕰️ Study Cycle auto-reschedule system initialized');
      } catch (error) {
        console.error('Error initializing auto-reschedule system:', error);
      }
    };

    initAutoReschedule();

    // Also check immediately for any incomplete cycles
    const checkIncompleteCycles = async () => {
      try {
        const result = await StudyCycleAutoService.autoRescheduleIncomplete();
        if (result.success && result.count > 0) {
          console.log(`✅ Auto-rescheduled ${result.count} incomplete study cycles to today`);
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
                  <Route path="/CalendarHome" element={<MasterCalendar />} />
          <Route path="/calendar" element={<MasterCalendar />} />
          <Route path="/calendario-unificato" element={<MasterCalendar />} />
          <Route path="/calendario-avanzato" element={<MasterCalendar />} />
          <Route path="/calendario-dashboard" element={<MasterCalendar />} />
          <Route path="/master-calendar" element={<MasterCalendar />} />
        <Route path="/Pomodoro" element={<Pomodoro />} />
        <Route path="/Projects" element={<ProjectHome />} />
        <Route path="/progetti" element={<ProjectHome />} />
        <Route path="/studycycle" element={<StudyCycleManager />} />
        <Route path="/time-machine" element={<TimeMachineComponent />} />
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
