import React, { useState } from 'react';
import { Project, Task, TaskStatus, SortBy } from './types';
import TaskCard from './TaskCard';

interface TaskListProps {
  project: Project;
  onTaskStatusUpdate: (taskId: string, status: TaskStatus, output?: string) => void;
  onTaskEdit: (task: Task) => void;
  onDelayAction: (taskId: string, action: 'translate' | 'compress') => void;
  isOwner: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  project,
  onTaskStatusUpdate,
  onTaskEdit,
  onDelayAction,
  isOwner
}) => {
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.PHASE);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const expandAllPhases = () => {
    setExpandedPhases(new Set(project.phases.map(p => p._id || '')));
  };

  const collapseAllPhases = () => {
    setExpandedPhases(new Set());
  };

  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      const statusMatch = filterStatus === 'all' || task.status === filterStatus;
      const milestoneMatch = !showMilestonesOnly || task.milestone;
      return statusMatch && milestoneMatch;
    });
  };

  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case SortBy.DATE:
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        case SortBy.ACTOR:
          const aActor = a.actors[0] || '';
          const bActor = b.actors[0] || '';
          return aActor.localeCompare(bActor);
        case SortBy.STATUS:
          return a.status.localeCompare(b.status);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  };

  const getTaskStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.NON_ATTIVABILE:
        return '#gray';
      case TaskStatus.ATTIVABILE:
        return '#blue';
      case TaskStatus.ATTIVA:
        return '#green';
      case TaskStatus.CONCLUSA:
        return '#darkgreen';
      case TaskStatus.RIATTIVATA:
        return '#orange';
      case TaskStatus.IN_RITARDO:
        return '#red';
      case TaskStatus.ABBANDONATA:
        return '#darkred';
      default:
        return '#gray';
    }
  };

  const calculatePhaseProgress = (phase: { tasks: Task[] }): number => {
    if (phase.tasks.length === 0) return 0;
    const completedTasks = phase.tasks.filter(t => t.status === TaskStatus.CONCLUSA).length;
    return (completedTasks / phase.tasks.length) * 100;
  };

  const getPhaseStats = (phase: { tasks: Task[] }) => {
    const total = phase.tasks.length;
    const completed = phase.tasks.filter(t => t.status === TaskStatus.CONCLUSA).length;
    const inProgress = phase.tasks.filter(t => t.status === TaskStatus.ATTIVA).length;
    const overdue = phase.tasks.filter(t => t.status === TaskStatus.IN_RITARDO).length;
    const milestones = phase.tasks.filter(t => t.milestone).length;

    return { total, completed, inProgress, overdue, milestones };
  };

  return (
    <div className="task-list">
      <div className="task-list-controls">
        <div className="filter-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="sort-select"
          >
            <option value={SortBy.PHASE}>Per Fase</option>
            <option value={SortBy.DATE}>Per Data</option>
            <option value={SortBy.ACTOR}>Per Attore</option>
            <option value={SortBy.STATUS}>Per Status</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="filter-select"
          >
            <option value="all">Tutti gli Status</option>
            {Object.values(TaskStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showMilestonesOnly}
              onChange={(e) => setShowMilestonesOnly(e.target.checked)}
            />
            Solo Milestones
          </label>
        </div>

        <div className="expansion-controls">
          <button className="btn btn-small" onClick={expandAllPhases}>
            Espandi Tutto
          </button>
          <button className="btn btn-small" onClick={collapseAllPhases}>
            Comprimi Tutto
          </button>
        </div>
      </div>

      <div className="phases-container">
        {project.phases.map((phase) => {
          const filteredTasks = filterTasks(phase.tasks);
          const sortedTasks = sortTasks(filteredTasks);
          const isExpanded = expandedPhases.has(phase._id || '');
          const stats = getPhaseStats(phase);
          const progress = calculatePhaseProgress(phase);

          if (filteredTasks.length === 0 && (filterStatus !== 'all' || showMilestonesOnly)) {
            return null; // Non mostrare fasi vuote quando si applicano filtri
          }

          return (
            <div key={phase._id} className="phase-container">
              <div 
                className="phase-header"
                onClick={() => togglePhaseExpansion(phase._id || '')}
              >
                <div className="phase-info">
                  <h3 className="phase-name">
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                      ▶
                    </span>
                    {phase.name || `Fase ${project.phases.indexOf(phase) + 1}`}
                  </h3>
                  
                  <div className="phase-stats">
                    <span className="stat">
                      {stats.completed}/{stats.total} task
                    </span>
                    {stats.milestones > 0 && (
                      <span className="stat milestones">
                        {stats.milestones} 🎯
                      </span>
                    )}
                    {stats.overdue > 0 && (
                      <span className="stat overdue">
                        {stats.overdue} ⚠️
                      </span>
                    )}
                  </div>
                </div>

                <div className="phase-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{progress.toFixed(0)}%</span>
                </div>
              </div>

              {isExpanded && (
                <div className="phase-tasks">
                  {sortedTasks.length === 0 ? (
                    <div className="no-tasks">
                      Nessuna task in questa fase
                      {(filterStatus !== 'all' || showMilestonesOnly) && ' (con i filtri applicati)'}
                    </div>
                  ) : (
                    <div className="tasks-grid">
                      {sortedTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onStatusUpdate={onTaskStatusUpdate}
                          onEdit={() => onTaskEdit(task)}
                          onDelayAction={onDelayAction}
                          isOwner={isOwner}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {project.phases.length === 0 && (
        <div className="no-phases">
          <p>Nessuna fase definita per questo progetto.</p>
          {isOwner && (
            <p>Modifica il progetto per aggiungere fasi e attività.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList; 