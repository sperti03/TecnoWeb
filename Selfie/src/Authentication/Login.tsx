import "./LogSign.css";
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  switchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ switchToSignup }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const data = {
      username,
      password,
    };

    try {
      const response = await fetch(
        "mongodb://${gianluca.sperti}:${zeeN9eep}@${mongo_gianluca.sperti}?writeConcern=majority/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        console.log("Login successful");
        setError("");
        navigate("/HomePage");
      } else {
        const errorMessage = await response.text();
        console.error("Login failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Errore durante il login");
    }
  };

  return (
    <>
      <div className="logsign-container">
        <div className="title">
          <span>Login</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="rows">
            <i className="bi bi-person-circle"></i>
            <input
              type="text"
              placeholder="Nome utente"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="rows">
            <i className="bi bi-lock"></i>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="pass">
            <a href="#">Password dimenticata?</a>
          </div>
          <div className="rows button">
            <input type="submit" value="Login" />
          </div>
          <div className="link-signlog">
            Non sei ancora registrato?{" "}
            <span
              onClick={switchToSignup}
              style={{ cursor: "pointer", color: "blue" }}
            >
              Registrati qui
            </span>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;