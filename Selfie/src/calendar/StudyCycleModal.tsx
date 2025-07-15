import React, { useState } from "react";
import { StudyCycleService } from "../StudyCycle/StudyCycleService";
import "./StudyCycleModal.css";

interface StudyCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { start: Date; end: Date } | null;
  onStudyCycleCreated: (event: any) => void;
}

const StudyCycleModal: React.FC<StudyCycleModalProps> = ({
  isOpen,
  onClose,
  selectedSlot,
  onStudyCycleCreated,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    studyTime: 25,
    pauseTime: 5,
    cycles: 4,
    scheduledTime: "09:00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLoading(true);
    setError(null);

    try {
      const studyCycleData = {
        ...formData,
        scheduledDate: selectedSlot.start.toISOString().split("T")[0],
      };

      const result = await StudyCycleService.createStudyCycle(studyCycleData);

      // Convert the calendar event dates for display
      const calendarEvent = {
        ...result.calendarEvent,
        start: new Date(result.calendarEvent.start),
        end: new Date(result.calendarEvent.end),
      };

      onStudyCycleCreated(calendarEvent);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Time") || name === "cycles" ? Number(value) : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Study Cycle</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="study-cycle-form">
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Morning Study Session"
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="e.g., Mathematics, History, etc."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studyTime">Study Time (minutes):</label>
              <input
                type="number"
                id="studyTime"
                name="studyTime"
                value={formData.studyTime}
                onChange={handleInputChange}
                min="1"
                max="120"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pauseTime">Break Time (minutes):</label>
              <input
                type="number"
                id="pauseTime"
                name="pauseTime"
                value={formData.pauseTime}
                onChange={handleInputChange}
                min="1"
                max="60"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cycles">Number of Cycles:</label>
              <input
                type="number"
                id="cycles"
                name="cycles"
                value={formData.cycles}
                onChange={handleInputChange}
                min="1"
                max="10"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="scheduledTime">Start Time:</label>
              <input
                type="time"
                id="scheduledTime"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="selected-date">
            <strong>Selected Date: </strong>
            {selectedSlot?.start.toLocaleDateString()}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="create-button">
              {loading ? "Creating..." : "Create Study Cycle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudyCycleModal;
