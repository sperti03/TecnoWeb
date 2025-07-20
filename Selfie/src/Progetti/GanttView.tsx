import React, { useState, useEffect } from 'react';
import { Project, Task, TaskStatus } from './types';
import ProjectService from './ProjectService';
import './ProjectHome.css';
import './GanttView.css';

interface GanttViewProps {
  project: Project;
  onTaskUpdate: (taskId: string, status: TaskStatus, output?: string) => void;
  isOwner: boolean;
}

interface GanttRow {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: 'phase' | 'task' | 'milestone';
  status?: TaskStatus;
  progress: number;
  level: number;
  actors?: string[];
}

const GanttView: React.FC<GanttViewProps> = ({
  project,
  onTaskUpdate,
  isOwner
}) => {
  const [ganttData, setGanttData] = useState<GanttRow[]>([]);
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const [scale, setScale] = useState<'days' | 'weeks' | 'months'>('weeks');

  useEffect(() => {
    generateGanttData();
  }, [project]);

  const generateGanttData = () => {
    const rows: GanttRow[] = [];
    let minDate = new Date();
    let maxDate = new Date();

    // Raccoglie tutte le date per calcolare il range della timeline
    const allDates: Date[] = [];
    
    project.phases.forEach((phase, phaseIndex) => {
      if (phase.tasks.length > 0) {
        phase.tasks.forEach(task => {
          allDates.push(new Date(task.start));
          allDates.push(new Date(task.end));
        });

        // Calcola le date della fase
        const phaseStart = new Date(Math.min(...phase.tasks.map(t => new Date(t.start).getTime())));
        const phaseEnd = new Date(Math.max(...phase.tasks.map(t => new Date(t.end).getTime())));
        
        allDates.push(phaseStart);
        allDates.push(phaseEnd);

        // Aggiungi la fase
        rows.push({
          id: `phase-${phase._id}`,
          name: phase.name || `Fase ${phaseIndex + 1}`,
          start: phaseStart,
          end: phaseEnd,
          type: 'phase',
          progress: calculatePhaseProgress(phase),
          level: 0
        });

        // Aggiungi le task della fase
        phase.tasks.forEach(task => {
          rows.push({
            id: task._id!,
            name: task.name,
            start: new Date(task.start),
            end: new Date(task.end),
            type: task.milestone ? 'milestone' : 'task',
            status: task.status,
            progress: calculateTaskProgress(task),
            level: 1,
            actors: task.actors
          });
        });
      }
    });

    if (allDates.length > 0) {
      minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      
      // Aggiungi un po' di margine
      minDate.setDate(minDate.getDate() - 7);
      maxDate.setDate(maxDate.getDate() + 7);
    }

    setGanttData(rows);
    setTimelineStart(minDate);
    setTimelineEnd(maxDate);
  };

  const calculatePhaseProgress = (phase: { tasks: Task[] }): number => {
    if (phase.tasks.length === 0) return 0;
    const completedTasks = phase.tasks.filter(t => t.status === TaskStatus.CONCLUSA).length;
    return (completedTasks / phase.tasks.length) * 100;
  };

  const calculateTaskProgress = (task: Task): number => {
    switch (task.status) {
      case TaskStatus.CONCLUSA:
        return 100;
      case TaskStatus.ATTIVA:
        return 50;
      case TaskStatus.RIATTIVATA:
        return 75;
      default:
        return 0;
    }
  };

  const getTimelineDays = (): Date[] => {
    const days: Date[] = [];
    const current = new Date(timelineStart);
    
    while (current <= timelineEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getTimelineWeeks = (): Date[] => {
    const weeks: Date[] = [];
    const current = new Date(timelineStart);
    
    // Trova il lunedì della settimana corrente
    const dayOfWeek = current.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setDate(current.getDate() + mondayOffset);
    
    while (current <= timelineEnd) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return weeks;
  };

  const getTimelineMonths = (): Date[] => {
    const months: Date[] = [];
    const current = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
    
    while (current <= timelineEnd) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  const getTimelineUnits = () => {
    switch (scale) {
      case 'days':
        return getTimelineDays();
      case 'weeks':
        return getTimelineWeeks();
      case 'months':
        return getTimelineMonths();
      default:
        return getTimelineWeeks();
    }
  };

  const getUnitWidth = () => {
    const units = getTimelineUnits();
    return units.length > 0 ? Math.max(40, 800 / units.length) : 40;
  };

  const getBarPosition = (start: Date, end: Date) => {
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const startOffset = start.getTime() - timelineStart.getTime();
    const duration = end.getTime() - start.getTime();
    
    const left = (startOffset / totalDuration) * 100;
    const width = (duration / totalDuration) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  const getStatusColor = (type: string, status?: TaskStatus): string => {
    if (type === 'phase') return '#6c757d';
    if (type === 'milestone') return '#ffc107';
    
    switch (status) {
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

  const formatTimelineLabel = (date: Date): string => {
    switch (scale) {
      case 'days':
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      case 'weeks':
        return `S${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('it-IT', { month: 'short' })}`;
      case 'months':
        return date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString('it-IT');
    }
  };

  const handleTaskClick = (rowId: string) => {
    if (rowId.startsWith('phase-')) return;
    
    const task = project.phases
      .flatMap(p => p.tasks)
      .find(t => t._id === rowId);
    
    if (task && task.status === TaskStatus.ATTIVABILE) {
      onTaskUpdate(rowId, TaskStatus.ATTIVA);
    }
  };

  if (ganttData.length === 0) {
    return (
      <div className="gantt-view">
        <div className="gantt-empty">
          <p>Nessuna task da visualizzare nel diagramma di Gantt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gantt-view">
      <div className="gantt-controls">
        <div className="scale-controls">
          <button
            className={`btn ${scale === 'days' ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setScale('days')}
          >
            Giorni
          </button>
          <button
            className={`btn ${scale === 'weeks' ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setScale('weeks')}
          >
            Settimane
          </button>
          <button
            className={`btn ${scale === 'months' ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setScale('months')}
          >
            Mesi
          </button>
        </div>
      </div>

      <div className="gantt-container">
        <div className="gantt-sidebar">
          <div className="gantt-header">Task</div>
          {ganttData.map((row) => (
            <div 
              key={row.id} 
              className={`gantt-row-label level-${row.level} ${row.type}`}
            >
              <div className="row-name">{row.name}</div>
              {row.actors && row.actors.length > 0 && (
                <div className="row-actors">
                  {row.actors.slice(0, 2).map((actor, index) => (
                    <span key={index} className="actor-badge">
                      {actor.split('@')[0]}
                    </span>
                  ))}
                  {row.actors.length > 2 && (
                    <span className="actor-more">+{row.actors.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="gantt-timeline">
          <div className="gantt-timeline-header">
            {getTimelineUnits().map((unit, index) => (
              <div 
                key={index} 
                className="timeline-unit"
                style={{ width: getUnitWidth() }}
              >
                {formatTimelineLabel(unit)}
              </div>
            ))}
          </div>

          <div className="gantt-chart">
            {ganttData.map((row) => {
              const position = getBarPosition(row.start, row.end);
              const color = getStatusColor(row.type, row.status);
              
              return (
                <div key={row.id} className={`gantt-row ${row.type}`}>
                  <div
                    className="gantt-bar"
                    style={{
                      ...position,
                      backgroundColor: color,
                      cursor: row.type === 'task' ? 'pointer' : 'default'
                    }}
                    onClick={() => handleTaskClick(row.id)}
                    title={`${row.name} (${row.start.toLocaleDateString()} - ${row.end.toLocaleDateString()})`}
                  >
                    {row.progress > 0 && (
                      <div 
                        className="progress-bar"
                        style={{ width: `${row.progress}%` }}
                      />
                    )}
                    {row.type === 'milestone' && (
                      <div className="milestone-marker">♦</div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Linea del tempo attuale */}
            <div 
              className="current-time-line"
              style={{
                left: getBarPosition(new Date(), new Date()).left
              }}
            />
          </div>
        </div>
      </div>

      <div className="gantt-legend">
        <div className="legend-item">
          <div className="legend-color phase"></div>
          <span>Fasi</span>
        </div>
        <div className="legend-item">
          <div className="legend-color task"></div>
          <span>Task</span>
        </div>
        <div className="legend-item">
          <div className="legend-color milestone"></div>
          <span>Milestones</span>
        </div>
        <div className="legend-item">
          <div className="legend-line current-time"></div>
          <span>Oggi</span>
        </div>
      </div>
    </div>
  );
};

export default GanttView; 