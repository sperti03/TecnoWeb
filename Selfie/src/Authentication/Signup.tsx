import { useNavigate } from "react-router-dom";
import "./LogSign.css";
import { useState } from "react";
import { Resend } from "resend";

interface SignupProps {
  switchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ switchToLogin }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const navigate = useNavigate();
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("birthdate", birthdate);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      const response = await fetch("http://localhost:8000/api/signup", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("token", responseData.token);
        setError("");
        navigate("/HomePage");
      } else {
        const errorMessage = await response.text();
        console.error("Signup failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Errore durante il signup");
    }
  };

  return (
    <div className="auth-page">
      <div className="logsign-container">
        <div className="title">
          <span>Signup</span>
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
            <i className="bi bi-envelope"></i>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <div className="rows">
            <i className="bi bi-lock"></i>
            <input
              type="password"
              placeholder="Ripeti password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="rows">
            <i className="bi bi-calendar"></i>
            <input
              type="date"
              placeholder="Data di nascita"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
            />
            <div className="rows">
              <i className="bi bi-image"></i>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) setProfileImage(e.target.files[0]);
                }}
              />
            </div>
          </div>
          <div className="rows button">
            <input type="submit" value="Signup" />
          </div>
          <div className="link-signlog">
            Sei già registrato?{" "}
            <span
              onClick={switchToLogin}
              style={{ cursor: "pointer", color: "blue" }}
            >
              Accedi qui
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
