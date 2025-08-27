import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationButton.css";

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

interface NotificationButtonProps {
  notifications: Invitation[];
  onAccept?: (invitationId: string) => void;
  onDecline?: (invitationId: string) => void;
  inline?: boolean; // when true, render suitable for navbar (no absolute positioning)
}

export default function NotificationButton({
  notifications,
  onAccept = () => {},
  onDecline = () => {},
  inline = false,
}: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleAccept = (invitation: Invitation) => {
    onAccept(invitation._id);
    setIsOpen(false);

    // Navigate to Pomodoro with the study settings
    navigate("/pomodoro", {
      state: {
        studySettings: invitation.studySettings,
        fromInvitation: true,
        invitationId: invitation._id,
      },
    });
  };

  const handleDecline = (invitation: Invitation) => {
    onDecline(invitation._id);
  };

  return (
    <div className={`notification-button-container${inline ? " inline" : ""}`}>
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h3>Notifiche</h3>
              <button
                className="close-dropdown"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="notification-dropdown-content">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span>📭</span>
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                notifications.map((invitation) => (
                  <div key={invitation._id} className="notification-item">
                    <div className="notification-icon">🍅</div>

                    <div className="notification-info">
                      <div className="notification-title">Invito di Studio</div>
                      <div className="notification-message">
                        <strong>{invitation.senderId.username}</strong> ti ha
                        invitato a una sessione di studio
                      </div>
                      {invitation.message && (
                        <div className="invitation-custom-message">
                          💬 "{invitation.message}"
                        </div>
                      )}
                      <div className="notification-time">
                        📅{" "}
                        {new Date(invitation.createdAt).toLocaleString(
                          "it-IT",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>

                    <div className="notification-actions">
                      <button
                        className="accept-button"
                        onClick={() => handleAccept(invitation)}
                        title="Accetta e vai al Pomodoro"
                      >
                        ✓
                      </button>
                      <button
                        className="decline-button"
                        onClick={() => handleDecline(invitation)}
                        title="Rifiuta"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
