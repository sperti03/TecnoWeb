import React, { useState, useEffect } from 'react';
import { Project, ViewMode, Task, TaskStatus } from './types';
import ProjectService from './ProjectService';
import TaskList from './TaskList';
import GanttView from './GanttView';
import TaskForm from './TaskForm';
import './ProjectHome.css';
import './ProjectDetail.css';
import CalendarProjectIntegration from './CalendarProjectIntegration';

interface ProjectDetailProps {
  project: Project;
  onProjectUpdate: () => void;
  onProjectEdit: (project: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onProjectUpdate,
  onProjectEdit
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const integration = new CalendarProjectIntegration();

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  const isOwner = () => {
    const userId = localStorage.getItem('userId');
    console.log('Debug isOwner:', {
      userId,
      projectOwner: currentProject.owner,
      comparison: currentProject.owner === userId,
      projectOwnerType: typeof currentProject.owner,
      userIdType: typeof userId
    });
    return String(currentProject.owner) === String(userId);
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus, output?: string) => {
    try {
      const updatedProject = await ProjectService.updateTaskStatus(currentProject._id!, {
        taskId,
        status: newStatus,
        output,
        actualEndDate: newStatus === TaskStatus.CONCLUSA ? new Date().toISOString() : undefined
      });
      setCurrentProject(updatedProject);
      onProjectUpdate();
    } catch (error) {
      console.error('Errore nell\'aggiornamento task:', error);
      alert('Errore nell\'aggiornamento della task');
    }
  };

  const handleDelayAction = async (taskId: string, action: 'translate' | 'compress') => {
    if (!isOwner()) {
      alert('Solo il capo-progetto può gestire i ritardi');
      return;
    }

    try {
      const updatedProject = await ProjectService.handleDelayConsequences(
        currentProject._id!,
        taskId,
        action
      );
      setCurrentProject(updatedProject);
      onProjectUpdate();
    } catch (error) {
      console.error('Errore nella gestione ritardi:', error);
      alert('Errore nella gestione dei ritardi');
    }
  };

  const handleCreateTask = () => {
    setIsCreatingTask(true);
    setSelectedTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setIsCreatingTask(false);
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleTaskSaved = async (taskData: Partial<Task>, phaseId?: string) => {
    try {
      // Aggiorna il progetto con la nuova/modificata task
      const updatedPhases = [...currentProject.phases];
      
      if (isCreatingTask && phaseId) {
        // Aggiungi nuova task alla fase
        const phaseIndex = updatedPhases.findIndex(p => p._id === phaseId);
        if (phaseIndex !== -1) {
          updatedPhases[phaseIndex].tasks.push({
            ...taskData,
            _id: Date.now().toString(), // ID temporaneo
            status: TaskStatus.NON_ATTIVABILE
          } as Task);
        }
      } else if (selectedTask) {
        // Modifica task esistente
        for (const phase of updatedPhases) {
          const taskIndex = phase.tasks.findIndex(t => t._id === selectedTask._id);
          if (taskIndex !== -1) {
            phase.tasks[taskIndex] = { ...phase.tasks[taskIndex], ...taskData };
            break;
          }
        }
      }

      const updatedProject = await ProjectService.updateProject(currentProject._id!, {
        ...currentProject,
        phases: updatedPhases
      });

      setCurrentProject(updatedProject);
      setIsTaskFormOpen(false);
      setSelectedTask(null);
      onProjectUpdate();

      // Auto-sync with calendar if enabled
      if (autoSyncEnabled) {
        try {
          await integration.syncProjectsToCalendar([updatedProject], {
            includeAllTasks: false,
            includeMilestones: true,
            onlyUserTasks: true
          });
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }

    } catch (error) {
      console.error('Errore nel salvataggio task:', error);
      alert('Errore nel salvataggio della task');
    }
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setSelectedTask(null);
  };

  const calculateProjectStats = () => {
    const allTasks = currentProject.phases.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.CONCLUSA).length;
    const inProgressTasks = allTasks.filter(t => t.status === TaskStatus.ATTIVA).length;
    const overdueTasks = allTasks.filter(t => t.status === TaskStatus.IN_RITARDO).length;
    const milestones = allTasks.filter(t => t.milestone);
    const completedMilestones = milestones.filter(t => t.status === TaskStatus.CONCLUSA).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      milestones: milestones.length,
      completedMilestones
    };
  };

  const stats = calculateProjectStats();

  return (
    <div className="project-detail">
      <header className="project-detail-header">
        <div className="project-info">
          <h1>{currentProject.name}</h1>
          <p className="project-description">{currentProject.description}</p>
          
          <div className="project-stats-summary">
            <div className="stat-box">
              <span className="stat-number">{stats.progress.toFixed(1)}%</span>
              <span className="stat-label">Completato</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.completedTasks}/{stats.totalTasks}</span>
              <span className="stat-label">Task</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.completedMilestones}/{stats.milestones}</span>
              <span className="stat-label">Milestones</span>
            </div>
            {stats.overdueTasks > 0 && (
              <div className="stat-box stat-warning">
                <span className="stat-number">{stats.overdueTasks}</span>
                <span className="stat-label">In ritardo</span>
              </div>
            )}
          </div>
        </div>

        <div className="project-actions">
          {isOwner() && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={() => onProjectEdit(currentProject)}
              >
                Modifica Progetto
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateTask}
              >
                Nuova Task
              </button>
            </>
          )}
        </div>
      </header>

      <div className="view-controls">
        <div className="view-mode-toggle">
          <button
            className={`btn ${viewMode === ViewMode.LIST ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setViewMode(ViewMode.LIST)}
          >
            Vista Lista
          </button>
          <button
            className={`btn ${viewMode === ViewMode.GANTT ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setViewMode(ViewMode.GANTT)}
          >
            Vista Gantt
          </button>
        </div>
      </div>

      <main className="project-content">
        {viewMode === ViewMode.LIST ? (
          <TaskList
            project={currentProject}
            onTaskStatusUpdate={handleTaskStatusUpdate}
            onTaskEdit={handleEditTask}
            onDelayAction={handleDelayAction}
            isOwner={isOwner()}
          />
        ) : (
          <GanttView
            project={currentProject}
            onTaskUpdate={handleTaskStatusUpdate}
            isOwner={isOwner()}
          />
        )}
      </main>

      {currentProject.notes && (
        <aside className="project-notes">
          <h3>Note del Progetto</h3>
          <div className="notes-content">
            {currentProject.notes}
          </div>
        </aside>
      )}

      {isTaskFormOpen && (
        <TaskForm
          task={isCreatingTask ? null : selectedTask}
          project={currentProject}
          onSave={handleTaskSaved}
          onCancel={handleTaskFormClose}
        />
      )}
    </div>
  );
};

export default ProjectDetail; 