import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import "./Account.css";
import { JwtPayload, jwtDecode } from "jwt-decode";
interface DecodedToken extends JwtPayload {
  username?: string;
  email?: string;
  userId?: string;
}
const Account: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("Stranger");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const navigate = useNavigate();
  const accountRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = "http://localhost:8000/api";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const user = decodedToken.username || "Stranger";
        const mail = decodedToken.email || "utente@example.com";

        setCurrentUsername(user);

        // Carica immagine profilo se disponibile
        if (decodedToken.userId) {
          fetch(`${API_BASE_URL}/user/${decodedToken.userId}/image`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Errore nel recupero immagine");
              return res.blob();
            })
            .then((blob) => {
              const imageUrl = URL.createObjectURL(blob);
              setProfileImage(imageUrl);
            })
            .catch((err) => console.error("Errore immagine:", err));
        }
      } catch (error) {
        console.error("Errore nella decodifica del token:", error);
      }
    }
  }, []);

  const toggleAccountMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleEditProfile = () => {
    setIsMenuOpen(false);
    setIsProfileModalOpen(true);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logout effettuato");
    setIsMenuOpen(false);
    navigate("/auth");
  };
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <>
      <div className="account-container" ref={accountRef}>
        <button className="account-button" onClick={toggleAccountMenu}>
          <i className="bi bi-person-circle account-icon" />
        </button>

        {isMenuOpen && (
          <div className="account-menu">
            <div className="account-header">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="menu-avatar" />
              ) : (
                <i className="bi bi-person-circle menu-icon" />
              )}
              <span className="account-username">{currentUsername}</span>
            </div>
            <ul>
              <li>
                <button onClick={handleEditProfile}>Modifica Profilo</button>
              </li>
              <li>
                <button onClick={handleLogout}>Esci</button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={closeProfileModal} />
    </>
  );
};

export default Account;
