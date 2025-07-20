import React, { useState } from 'react';
import { Task, TaskStatus } from './types';

interface TaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, status: TaskStatus, output?: string) => void;
  onEdit: () => void;
  onDelayAction: (taskId: string, action: 'translate' | 'compress') => void;
  isOwner: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusUpdate,
  onEdit,
  onDelayAction,
  isOwner
}) => {
  const [showOutputForm, setShowOutputForm] = useState(false);
  const [outputText, setOutputText] = useState(task.output || '');

  const getCurrentUserId = () => {
    return localStorage.getItem('userId') || '';
  };

  const isTaskActor = () => {
    const userId = getCurrentUserId();
    return task.actors.includes(userId);
  };

  const canUpdateStatus = () => {
    return isTaskActor() || isOwner;
  };

  const getStatusColor = (): string => {
    switch (task.status) {
      case TaskStatus.NON_ATTIVABILE:
        return '#6c757d';
      case TaskStatus.ATTIVABILE:
        return '#007bff';
      case TaskStatus.ATTIVA:
        return '#28a745';
      case TaskStatus.CONCLUSA:
        return '#20c997';
      case TaskStatus.RIATTIVATA:
        return '#fd7e14';
      case TaskStatus.IN_RITARDO:
        return '#dc3545';
      case TaskStatus.ABBANDONATA:
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (): number => {
    const now = new Date();
    const deadline = new Date(task.end);
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatus = () => {
    const days = getDaysUntilDeadline();
    if (days < 0) return { text: `${Math.abs(days)} giorni fa`, class: 'overdue' };
    if (days === 0) return { text: 'Oggi', class: 'today' };
    if (days <= 3) return { text: `${days} giorni`, class: 'urgent' };
    return { text: `${days} giorni`, class: 'normal' };
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === TaskStatus.CONCLUSA) {
      setShowOutputForm(true);
    } else {
      onStatusUpdate(task._id!, newStatus);
    }
  };

  const handleOutputSubmit = () => {
    onStatusUpdate(task._id!, TaskStatus.CONCLUSA, outputText);
    setShowOutputForm(false);
  };

  const handleDelayAction = (action: 'translate' | 'compress') => {
    onDelayAction(task._id!, action);
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className={`task-card ${task.milestone ? 'milestone' : ''}`}>
      <div className="task-header">
        <div className="task-title-section">
          <h4 className="task-name">{task.name}</h4>
          {task.milestone && <span className="milestone-badge">🎯 Milestone</span>}
        </div>
        
        <div className="task-actions">
          {isOwner && (
            <button 
              className="btn-icon btn-edit"
              onClick={onEdit}
              title="Modifica task"
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      <div className="task-content">
        <div 
          className="task-status"
          style={{ backgroundColor: getStatusColor() }}
        >
          {task.status}
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-details">
          <div className="task-dates">
            <div className="date-item">
              <span className="date-label">Inizio:</span>
              <span className="date-value">{formatDate(task.start)}</span>
            </div>
            <div className="date-item">
              <span className="date-label">Fine:</span>
              <span className="date-value">{formatDate(task.end)}</span>
            </div>
            <div className={`deadline-status ${deadlineStatus.class}`}>
              {deadlineStatus.text}
            </div>
          </div>

          {task.actors.length > 0 && (
            <div className="task-actors">
              <span className="actors-label">Attori:</span>
              <div className="actors-list">
                {task.actors.map((actor, index) => (
                  <span key={index} className="actor-badge">
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.dependencies.length > 0 && (
            <div className="task-dependencies">
              <span className="dependencies-label">Dipendenze:</span>
              <span className="dependencies-count">{task.dependencies.length} task</span>
            </div>
          )}
        </div>

        {task.input && (
          <div className="task-input">
            <strong>Input:</strong>
            <p>{task.input}</p>
          </div>
        )}

        {task.output && (
          <div className="task-output">
            <strong>Output:</strong>
            <p>{task.output}</p>
          </div>
        )}

        {task.milestone && task.milestoneDate && (
          <div className="milestone-date">
            <strong>Data Milestone:</strong>
            <span>{formatDate(task.milestoneDate)}</span>
          </div>
        )}
      </div>

      {canUpdateStatus() && (
        <div className="task-status-controls">
          <h5>Aggiorna Status:</h5>
          <div className="status-buttons">
            {task.status === TaskStatus.ATTIVABILE && (
              <button
                className="btn btn-success btn-small"
                onClick={() => handleStatusChange(TaskStatus.ATTIVA)}
              >
                Inizia
              </button>
            )}
            
            {task.status === TaskStatus.ATTIVA && (
              <button
                className="btn btn-primary btn-small"
                onClick={() => handleStatusChange(TaskStatus.CONCLUSA)}
              >
                Completa
              </button>
            )}

            {(task.status === TaskStatus.CONCLUSA || task.status === TaskStatus.RIATTIVATA) && isOwner && (
              <button
                className="btn btn-warning btn-small"
                onClick={() => handleStatusChange(TaskStatus.RIATTIVATA)}
              >
                Richiedi Revisione
              </button>
            )}
          </div>
        </div>
      )}

      {task.status === TaskStatus.IN_RITARDO && isOwner && (
        <div className="delay-actions">
          <h5>Gestione Ritardo:</h5>
          <div className="delay-buttons">
            <button
              className="btn btn-warning btn-small"
              onClick={() => handleDelayAction('translate')}
            >
              Trasla Dipendenti
            </button>
            <button
              className="btn btn-danger btn-small"
              onClick={() => handleDelayAction('compress')}
            >
              Comprimi Dipendenti
            </button>
          </div>
        </div>
      )}

      {showOutputForm && (
        <div className="output-form-overlay">
          <div className="output-form">
            <h4>Completa Task</h4>
            <textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              placeholder="Descrivi l'output della task..."
              rows={4}
            />
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOutputForm(false)}
              >
                Annulla
              </button>
              <button
                className="btn btn-primary"
                onClick={handleOutputSubmit}
              >
                Completa Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard; 