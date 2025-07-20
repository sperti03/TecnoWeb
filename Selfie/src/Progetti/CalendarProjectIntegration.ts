import { Project, Task, Phase, TaskStatus } from './types';

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  userId: string;
  notificationLeadTime: number;
  repeatInterval: number;
  participants?: { email: string; userId?: string }[];
  createdByEmail?: string;
  _id?: string;
  projectId?: string;
  taskId?: string;
  type?: 'event' | 'task' | 'milestone';
}

interface SyncOptions {
  includeAllTasks?: boolean;
  includeMilestones?: boolean;
  onlyUserTasks?: boolean;
  notificationLeadTime?: number;
}

class CalendarProjectIntegration {
  private API_BASE = 'http://localhost:8000';
  
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private getCurrentUserId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  }

  // Converte task di progetto in eventi calendario
  taskToCalendarEvent(task: Task, project: Project, phase: Phase): CalendarEvent | null {
    if (!task.start || !task.end) return null;
    
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return null;

    const start = new Date(task.start);
    const end = new Date(task.end);
    
    // Verifica che l'utente sia coinvolto nel task
    const isUserInvolved = task.actors.includes(currentUserId) || 
                          project.owner === currentUserId;
    
    if (!isUserInvolved) return null;

    const title = task.milestone 
      ? `🎯 ${task.name} (Milestone)` 
      : `📋 ${task.name}`;
    
    const description = `Progetto: ${project.name}\nFase: ${phase.name}\n${task.description || ''}`;
    
    return {
      title,
      start,
      end,
      description,
      userId: currentUserId,
      notificationLeadTime: task.milestone ? 60 : 30, // 1h per milestone, 30min per task
      repeatInterval: 0,
      participants: task.actors.map(actorId => ({ email: '', userId: actorId })),
      projectId: project._id,
      taskId: task._id,
      type: task.milestone ? 'milestone' : 'task'
    };
  }

  // Converte milestone in eventi calendario
  milestoneToCalendarEvent(task: Task, project: Project, phase: Phase): CalendarEvent | null {
    if (!task.milestone || !task.milestoneDate) return null;
    
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return null;

    const milestoneDate = new Date(task.milestoneDate);
    const endDate = new Date(milestoneDate.getTime() + 60 * 60 * 1000); // 1 ora

    const title = `🎯 ${task.name} - Milestone`;
    const description = `Progetto: ${project.name}\nFase: ${phase.name}\nMilestone: ${task.description || ''}`;

    return {
      title,
      start: milestoneDate,
      end: endDate,
      description,
      userId: currentUserId,
      notificationLeadTime: 120, // 2 ore di preavviso per milestone
      repeatInterval: 0,
      participants: task.actors.map(actorId => ({ email: '', userId: actorId })),
      projectId: project._id,
      taskId: task._id,
      type: 'milestone'
    };
  }

  // Sincronizza tutti i progetti con il calendario
  async syncProjectsToCalendar(projects: Project[], options: SyncOptions = {}): Promise<void> {
    const {
      includeAllTasks = false,
      includeMilestones = true,
      onlyUserTasks = true,
      notificationLeadTime = 30
    } = options;

    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('User not authenticated');

    // Prima rimuove eventi esistenti legati ai progetti
    await this.clearProjectEventsFromCalendar();

    for (const project of projects) {
      for (const phase of project.phases) {
        for (const task of phase.tasks) {
          const events: CalendarEvent[] = [];

          // Aggiungi task normale se richiesto
          if (includeAllTasks) {
            const taskEvent = this.taskToCalendarEvent(task, project, phase);
            if (taskEvent) events.push(taskEvent);
          }

          // Aggiungi milestone se richiesto
          if (includeMilestones && task.milestone) {
            const milestoneEvent = this.milestoneToCalendarEvent(task, project, phase);
            if (milestoneEvent) events.push(milestoneEvent);
          }

          // Crea eventi nel calendario
          for (const event of events) {
            try {
              await this.createCalendarEvent(event);
            } catch (error) {
              console.error('Error creating calendar event:', error);
            }
          }
        }
      }
    }
  }

  // Rimuove eventi di progetti dal calendario
  private async clearProjectEventsFromCalendar(): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/api/events/clear-project-events`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        console.error('Failed to clear project events');
      }
    } catch (error) {
      console.error('Error clearing project events:', error);
    }
  }

  // Crea evento nel calendario
  private async createCalendarEvent(event: CalendarEvent): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/api/events`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...event,
          projectEventData: {
            projectId: event.projectId,
            taskId: event.taskId,
            type: event.type
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Ottieni eventi calendario con informazioni progetti
  async getUnifiedCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(`${this.API_BASE}/api/events/unified`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unified calendar events');
      }

      const events = await response.json();
      return events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('Error fetching unified calendar events:', error);
      return [];
    }
  }

  // Crea task da evento calendario
  async createTaskFromCalendarEvent(event: CalendarEvent, projectId: string, phaseId: string): Promise<Task | null> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return null;

    const newTask: Partial<Task> = {
      name: event.title.replace(/^[📋🎯]\s*/, ''), // Rimuovi emoji
      description: event.description || '',
      start: event.start.toISOString().split('T')[0],
      end: event.end.toISOString().split('T')[0],
      actors: [currentUserId],
      milestone: event.type === 'milestone',
      milestoneDate: event.type === 'milestone' ? event.start.toISOString().split('T')[0] : undefined,
      dependencies: [],
      status: TaskStatus.NON_ATTIVABILE
    };

    try {
      // Aggiorna il progetto aggiungendo il task
      const project = await this.getProject(projectId);
      if (!project) return null;

      const phase = project.phases.find(p => p._id === phaseId);
      if (!phase) return null;

      phase.tasks.push(newTask as Task);

      await this.updateProject(project);
      return newTask as Task;
    } catch (error) {
      console.error('Error creating task from calendar event:', error);
      return null;
    }
  }

  private async getProject(projectId: string): Promise<Project | null> {
    try {
      const response = await fetch(`${this.API_BASE}/api/getprojects`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) return null;
      
      const projects = await response.json();
      return projects.find((p: Project) => p._id === projectId) || null;
    } catch {
      return null;
    }
  }

  private async updateProject(project: Project): Promise<void> {
    await fetch(`${this.API_BASE}/api/updateproject/${project._id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(project),
    });
  }

  // Calcola statistiche integrazione
  getIntegrationStats(projects: Project[]): {
    totalTasks: number;
    totalMilestones: number;
    syncableTasks: number;
    syncableMilestones: number;
  } {
    const currentUserId = this.getCurrentUserId();
    let totalTasks = 0;
    let totalMilestones = 0;
    let syncableTasks = 0;
    let syncableMilestones = 0;

    for (const project of projects) {
      for (const phase of project.phases) {
        for (const task of phase.tasks) {
          totalTasks++;
          
          if (task.milestone) {
            totalMilestones++;
            if (task.milestoneDate && (task.actors.includes(currentUserId!) || project.owner === currentUserId)) {
              syncableMilestones++;
            }
          }

          if (task.start && task.end && (task.actors.includes(currentUserId!) || project.owner === currentUserId)) {
            syncableTasks++;
          }
        }
      }
    }

    return {
      totalTasks,
      totalMilestones,
      syncableTasks,
      syncableMilestones
    };
  }
}

export default CalendarProjectIntegration;
export type { CalendarEvent, SyncOptions }; 