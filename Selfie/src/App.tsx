import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";
import AuthPage from "./Authentication/AuthPage";
import HomePage from "./HomePage";
import NoteHome from "./Note/NoteHome";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Rotta predefinita che reindirizza a /auth */}
          <Route path="/" element={<Navigate to="/auth" />} />
          {/* Rotta per login e sign up */}
          <Route path="/auth" element={<AuthPage />} />
          {/* Rotta per la home */}
          <Route path="/Homepage" element={<HomePage />} />
          {/* Rotta per le Note */}
          <Route path="/Note" element={<NoteHome />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
