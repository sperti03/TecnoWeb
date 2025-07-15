import React, { useState } from "react";
import { InvitationService } from "../StudyCycle/InvitationService";
import "./InvitationModal.css";

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studySettings: {
    studyTime: number;
    pauseTime: number;
    cycles: number;
    title?: string;
    subject?: string;
  };
}

const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  studySettings,
}) => {
  const [formData, setFormData] = useState({
    recipientUsername: "",
    message: `Join me for a study session! ${studySettings.cycles} cycles of ${studySettings.studyTime}min study + ${studySettings.pauseTime}min break.`,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const invitationData = {
        recipientUsername: formData.recipientUsername,
        message: formData.message,
        studySettings: {
          ...studySettings,
          title: studySettings.title || "Study Session",
          subject: studySettings.subject || "General Study",
        },
      };

      await InvitationService.sendInvitation(invitationData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          recipientUsername: "",
          message: `Join me for a study session! ${studySettings.cycles} cycles of ${studySettings.studyTime}min study + ${studySettings.pauseTime}min break.`,
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="invitation-modal-overlay">
      <div className="invitation-modal-content">
        <div className="invitation-modal-header">
          <h2>Invite Friend to Study</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Invitation Sent!</h3>
            <p>
              Your study invitation has been sent to{" "}
              {formData.recipientUsername}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="invitation-form">
            <div className="study-settings-preview">
              <h3>Study Session Details</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <span className="label">Study Time:</span>
                  <span className="value">
                    {studySettings.studyTime} minutes
                  </span>
                </div>
                <div className="setting-item">
                  <span className="label">Break Time:</span>
                  <span className="value">
                    {studySettings.pauseTime} minutes
                  </span>
                </div>
                <div className="setting-item">
                  <span className="label">Cycles:</span>
                  <span className="value">{studySettings.cycles}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="recipientUsername">Friend's Username:</label>
              <input
                type="text"
                id="recipientUsername"
                name="recipientUsername"
                value={formData.recipientUsername}
                onChange={handleInputChange}
                required
                placeholder="Enter username..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message (optional):</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add a personal message..."
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="send-button">
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InvitationModal;
