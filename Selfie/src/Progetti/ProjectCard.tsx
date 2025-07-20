import React from 'react';
import { Project } from './types';

interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  progress: number;
}

interface ProjectCardProps {
  project: Project;
  stats: ProjectStats;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isOwner: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onSelect,
  onEdit,
  onDelete,
  isOwner
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'var(--progress-low)';
    if (progress < 70) return 'var(--progress-medium)';
    return 'var(--progress-high)';
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questo progetto?')) {
      onDelete();
    }
  };

  return (
    <div className="project-card" onClick={onSelect}>
      <div className="project-card-header">
        <h3 className="project-title">{project.name}</h3>
        {isOwner && (
          <div className="project-actions">
            <button 
              className="btn-icon btn-edit" 
              onClick={handleEdit}
              title="Modifica progetto"
            >
              ✏️
            </button>
            <button 
              className="btn-icon btn-delete" 
              onClick={handleDelete}
              title="Elimina progetto"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="project-description">
        {project.description && project.description.length > 100 
          ? `${project.description.substring(0, 100)}...`
          : project.description || 'Nessuna descrizione'
        }
      </div>

      <div className="project-progress">
        <div className="progress-info">
          <span>Progresso: {stats.progress.toFixed(1)}%</span>
          <span>{stats.completed}/{stats.total} task</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${stats.progress}%`,
              backgroundColor: getProgressBarColor(stats.progress)
            }}
          />
        </div>
      </div>

      <div className="project-stats">
        <div className="stat-item">
          <span className="stat-label">Fasi:</span>
          <span className="stat-value">{project.phases.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In corso:</span>
          <span className="stat-value stat-progress">{stats.inProgress}</span>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-item">
            <span className="stat-label">In ritardo:</span>
            <span className="stat-value stat-overdue">{stats.overdue}</span>
          </div>
        )}
      </div>

      <div className="project-meta">
        <div className="project-dates">
          <small>Creato: {formatDate(project.createdAt)}</small>
          <small>Aggiornato: {formatDate(project.updatedAt)}</small>
        </div>
        {!isOwner && (
          <div className="project-role">
            <span className="role-badge">Partecipante</span>
          </div>
        )}
      </div>

      {project.notes && (
        <div className="project-notes">
          <small>
            Note: {project.notes.length > 50 
              ? `${project.notes.substring(0, 50)}...`
              : project.notes
            }
          </small>
        </div>
      )}
    </div>
  );
};

export default ProjectCard; 