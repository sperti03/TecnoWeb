import React, { useState, useEffect } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";

import "./ProfileModal.css";

interface DecodedToken extends JwtPayload {
  username?: string;
  email?: string;
  userId?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [currentUsername, setCurrentUsername] = useState("Stranger");
  const [currentEmail, setCurrentEmail] = useState("user@example.com");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const API_BASE_URL = "http://localhost:3000/api";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const {
        username = "Stranger",
        email = "user@example.com",
        userId,
      } = decoded;

      setCurrentUsername(username);
      setCurrentEmail(email);
      setEditUsername(username);
      setEditEmail(email);

      if (userId) {
        fetch(`${API_BASE_URL}/user/${userId}/image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Errore nel recupero immagine");
            return res.blob();
          })
          .then((blob) => setProfileImage(URL.createObjectURL(blob)))
          .catch((err) => console.error("Errore immagine:", err));
      }
    } catch (error) {
      console.error("Errore token:", error);
      setErrorMessage("Sessione scaduta. Effettua nuovamente il login.");
    }
  }, [isOpen]);

  const handleEdit = () => {
    setIsEditing(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Non autenticato. Effettua il login.");
      return;
    }

    const formData = new FormData();
    formData.append("username", editUsername);
    formData.append("email", editEmail);
    if (newImageFile) formData.append("profileImage", newImageFile);

    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentUsername(editUsername);
        setCurrentEmail(editEmail);
        setIsEditing(false);
        setSuccessMessage(data.message || "Profilo aggiornato con successo.");
        if (data.token) localStorage.setItem("token", data.token);
      } else {
        setErrorMessage(data.message || "Errore durante l'aggiornamento.");
      }
    } catch {
      setErrorMessage("Errore di rete. Riprova più tardi.");
    }
  };

  const handleCancel = () => {
    setEditUsername(currentUsername);
    setEditEmail(currentEmail);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Profilo Utente</h2>

        {successMessage && (
          <div className="alert success">{successMessage}</div>
        )}
        {errorMessage && <div className="alert error">{errorMessage}</div>}

        {profileImage && (
          <div className="image-container">
            <img src={profileImage} alt="Profilo" />
          </div>
        )}

        {isEditing ? (
          <div className="form">
            <label>
              Nome utente:
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </label>

            <label>
              Email:
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </label>

            <label>
              Immagine profilo:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setNewImageFile(file || null);
                  if (file) setProfileImage(URL.createObjectURL(file));
                }}
              />
            </label>

            <div className="actions">
              <button className="btn primary" onClick={handleSave}>
                Salva
              </button>
              <button className="btn" onClick={handleCancel}>
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="info">
            <div>
              <strong>Username:</strong> {currentUsername}
            </div>
            <div>
              <strong>Email:</strong> {currentEmail}
            </div>

            <div className="actions">
              <button className="btn primary" onClick={handleEdit}>
                Modifica
              </button>
              <button className="btn" onClick={onClose}>
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
