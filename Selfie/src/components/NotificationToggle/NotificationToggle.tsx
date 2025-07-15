import React, { useState } from "react";
import "./NotificationToggle.css";
import { FaBell, FaChevronDown, FaChevronUp } from "react-icons/fa";

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

interface NotificationToggleProps {
  notifications: Invitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  notifications,
  onAccept,
  onDecline,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="notification-toggle-container">
      <button
        className="notification-toggle-button"
        onClick={() => {
          if (notifications.length > 0) {
            setIsExpanded(!isExpanded);
          }
        }}
        disabled={notifications.length === 0}
      >
        <FaBell className="notification-icon" />
        <span className="notification-text">
          Notifications{" "}
          {notifications.length > 0 && `(${notifications.length})`}
        </span>
        {notifications.length > 0 && (
          <span className="notification-count-badge">
            {notifications.length}
          </span>
        )}
        {notifications.length > 0 &&
          (isExpanded ? <FaChevronUp /> : <FaChevronDown />)}
      </button>

      {isExpanded && notifications.length > 0 && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>Pending Study Invitations</h4>
          </div>

          <div className="notification-dropdown-list">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className="notification-dropdown-item"
              >
                <div className="notification-info">
                  <div className="notification-sender">
                    <strong>{notification.senderId.username}</strong>
                  </div>
                  {notification.studySettings && (
                    <div className="notification-details">
                      <span className="study-settings">
                        📚 {notification.studySettings.studyTime}min study • ⏸️{" "}
                        {notification.studySettings.pauseTime}min break • 🔄{" "}
                        {notification.studySettings.cycles} cycles
                      </span>
                    </div>
                  )}
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="notification-actions">
                  <button
                    className="accept-button"
                    onClick={() => onAccept(notification._id)}
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="decline-button"
                    onClick={() => onDecline(notification._id)}
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationToggle;
