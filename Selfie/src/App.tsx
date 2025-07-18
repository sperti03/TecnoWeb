import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import "./App.css";
import AuthPage from "./Authentication/AuthPage";
import HomePage from "./Homepage/HomePage";
import NoteHome from "./Note/NoteHome";
import TimeMachineComponent from "./TimeMachine/TimeMachine";
import CalendarPage from "./calendar/CalendarPage";
import Pomodoro from "./Pomodoro/pomodoro";

function Layout() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/auth" && <TimeMachineComponent />}
      <Routes>
        <Route path="/" element={<Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/Homepage" element={<HomePage />} />
        <Route path="/Note" element={<NoteHome />} />
        <Route path="/calendarPage" element={<CalendarPage />} />
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
