import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";
import AuthPage from "./Authentication/AuthPage";
import HomePage from "./HomePage";

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
        </Routes>
      </Router>
    </>
  );
}

export default App;
