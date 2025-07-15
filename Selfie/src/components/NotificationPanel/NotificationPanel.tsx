import React from "react";
import "./NotificationPanel.css";

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

interface NotificationPanelProps {
  notifications: Invitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onAccept,
  onDecline,
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <span className="notification-title">Pending Invitations</span>
        <span className="notification-count">{notifications.length}</span>
      </div>

      <div className="notification-list">
        {notifications.map((notification) => (
          <div key={notification._id} className="notification-item">
            <div className="notification-content">
              <div className="notification-sender">
                {notification.senderId.username}
              </div>
              <div className="notification-message">
                {notification.message || "wants to study together"}
              </div>
              <div className="notification-settings">
                {notification.studySettings && (
                  <span>
                    {notification.studySettings.studyTime}min study,{" "}
                    {notification.studySettings.pauseTime}min break
                  </span>
                )}
              </div>
            </div>

            <div className="notification-actions">
              <button
                className="accept-btn"
                onClick={() => onAccept(notification._id)}
              >
                Accept
              </button>
              <button
                className="decline-btn"
                onClick={() => onDecline(notification._id)}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel;
