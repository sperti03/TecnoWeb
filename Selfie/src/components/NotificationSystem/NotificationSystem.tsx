import React, { useState, useEffect } from "react";
import "./NotificationSystem.css";

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

interface NotificationSystemProps {
  notifications: Invitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

export default function NotificationSystem({
  notifications,
  onAccept,
  onDecline,
}: NotificationSystemProps) {
  const handleAccept = (invitation: Invitation) => {
    onAccept(invitation._id);
  };

  const handleDecline = (invitation: Invitation) => {
    onDecline(invitation._id);
  };

  return (
    <div className="notification-system">
      <div className="notification-header-section">
        <h3 className="notifications-title">
          <span className="notification-icon">🔔</span>
          Notifiche
          <span className="notification-count">{notifications.length}</span>
        </h3>
      </div>

      <div className="notifications-container">
        {notifications.map((invitation) => (
          <div
            key={invitation._id}
            className="notification notification-invitation"
          >
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-title-section">
                  <span className="notification-emoji">🍅</span>
                  <h4 className="notification-title">Invito di Studio</h4>
                </div>
                <button
                  className="notification-close"
                  onClick={() => onDecline(invitation._id)}
                  title="Rifiuta invito"
                >
                  ×
                </button>
              </div>

              <div className="notification-body">
                <p className="notification-message">
                  <strong className="sender-name">
                    {invitation.senderId.username}
                  </strong>{" "}
                  <span className="invitation-text">
                    ti ha invitato a una sessione di studio!
                  </span>
                </p>

                {invitation.message && (
                  <div className="invitation-message">
                    💬 "{invitation.message}"
                  </div>
                )}

                <div className="invitation-details">
                  <span className="invitation-time">
                    📅{" "}
                    {new Date(invitation.createdAt).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="notification-actions">
                <button
                  className="notification-btn accept-btn"
                  onClick={() => handleAccept(invitation)}
                >
                  <span className="btn-icon">🍅</span>
                  Accetta
                </button>
                <button
                  className="notification-btn decline-btn"
                  onClick={() => handleDecline(invitation)}
                >
                  <span className="btn-icon">❌</span>
                  Rifiuta
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { Invitation };
