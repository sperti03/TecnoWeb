import { Project, Task, TaskUpdate, TaskStatus } from './types';

const API_BASE = 'http://localhost:3000'; // Backend gira su porta 3000

class ProjectService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // GET - Recupera tutti i progetti dell'utente
  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE}/api/getprojects`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Errore nel recupero progetti: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nel recupero progetti:', error);
      throw error;
    }
  }

  // POST - Crea un nuovo progetto
  async createProject(projectData: Omit<Project, '_id' | 'owner' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      console.log('Sending project data:', projectData);
      console.log('Auth headers:', this.getAuthHeaders());
      
      const response = await fetch(`${API_BASE}/api/addproject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Errore nella creazione progetto: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nella creazione progetto:', error);
      throw error;
    }
  }

  // PUT - Aggiorna un progetto esistente
  async updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    try {
      const response = await fetch(`${API_BASE}/api/updateproject/${projectId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'aggiornamento progetto: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore nell\'aggiornamento progetto:', error);
      throw error;
    }
  }

  // DELETE - Elimina un progetto
  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/deleteproject/${projectId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Errore nell'eliminazione progetto: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione progetto:', error);
      throw error;
    }
  }

  // Funzioni di utilità per la logica di business

  // Calcola lo status di una task basato su input disponibili e date
  calculateTaskStatus(task: Task, allTasks: Task[]): TaskStatus {
    const now = new Date();
    const endDate = new Date(task.end);
    const hasInput = this.isTaskInputAvailable(task, allTasks);

    // Se la data è passata e non è conclusa
    if (endDate < now && task.status !== TaskStatus.CONCLUSA) {
      const daysPassed = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPassed > 30) { // Se sono passati più di 30 giorni
        return TaskStatus.ABBANDONATA;
      }
      return TaskStatus.IN_RITARDO;
    }

    // Se non ha input disponibile
    if (!hasInput) {
      return TaskStatus.NON_ATTIVABILE;
    }

    // Mantieni lo status corrente se valido
    return task.status;
  }

  // Verifica se l'input per una task è disponibile
  private isTaskInputAvailable(task: Task, allTasks: Task[]): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true; // Nessuna dipendenza = input sempre disponibile
    }

    // Verifica che tutte le dipendenze siano concluse
    return task.dependencies.every(depId => {
      const dependentTask = allTasks.find(t => t._id === depId);
      return dependentTask?.status === TaskStatus.CONCLUSA;
    });
  }

  // Aggiorna lo status di una task
  async updateTaskStatus(projectId: string, taskUpdate: TaskUpdate): Promise<Project> {
    // Per ora aggiorneremo l'intero progetto
    // In futuro si potrebbe creare un endpoint specifico per le task
    try {
      const projects = await this.getProjects();
      const project = projects.find(p => p._id === projectId);
      
      if (!project) {
        throw new Error('Progetto non trovato');
      }

      // Trova e aggiorna la task
      let taskFound = false;
      for (const phase of project.phases) {
        const taskIndex = phase.tasks.findIndex(t => t._id === taskUpdate.taskId);
        if (taskIndex !== -1) {
          phase.tasks[taskIndex].status = taskUpdate.status;
          if (taskUpdate.output) {
            phase.tasks[taskIndex].output = taskUpdate.output;
          }
          if (taskUpdate.actualEndDate) {
            phase.tasks[taskIndex].end = taskUpdate.actualEndDate;
          }
          taskFound = true;
          break;
        }
      }

      if (!taskFound) {
        throw new Error('Task non trovata');
      }

      // Aggiorna il progetto
      return await this.updateProject(projectId, project);
    } catch (error) {
      console.error('Errore nell\'aggiornamento task:', error);
      throw error;
    }
  }

  // Gestisce le conseguenze dei ritardi (traslazione o contrazione)
  async handleDelayConsequences(
    projectId: string, 
    delayedTaskId: string, 
    action: 'translate' | 'compress'
  ): Promise<Project> {
    try {
      const projects = await this.getProjects();
      const project = projects.find(p => p._id === projectId);
      
      if (!project) {
        throw new Error('Progetto non trovato');
      }

      const allTasks = project.phases.flatMap(p => p.tasks);
      const delayedTask = allTasks.find(t => t._id === delayedTaskId);
      
      if (!delayedTask) {
        throw new Error('Task ritardata non trovata');
      }

      const dependentTasks = allTasks.filter(t => 
        t.dependencies.includes(delayedTaskId)
      );

      const delayedTaskEnd = new Date(delayedTask.end);
      const now = new Date();
      const delayDays = Math.ceil((now.getTime() - delayedTaskEnd.getTime()) / (1000 * 60 * 60 * 24));

      for (const depTask of dependentTasks) {
        const startDate = new Date(depTask.start);
        const endDate = new Date(depTask.end);
        const duration = endDate.getTime() - startDate.getTime();

        if (action === 'translate') {
          // Trasla le date mantenendo la durata
          depTask.start = new Date(startDate.getTime() + (delayDays * 24 * 60 * 60 * 1000)).toISOString();
          depTask.end = new Date(endDate.getTime() + (delayDays * 24 * 60 * 60 * 1000)).toISOString();
        } else if (action === 'compress') {
          // Comprime la durata mantenendo la data di fine originale
          const newDuration = duration - (delayDays * 24 * 60 * 60 * 1000);
          if (newDuration > 0) {
            depTask.start = new Date(endDate.getTime() - newDuration).toISOString();
          }
        }
      }

      return await this.updateProject(projectId, project);
    } catch (error) {
      console.error('Errore nella gestione ritardi:', error);
      throw error;
    }
  }

  // Converte i dati per la visualizzazione Gantt
  convertToGanttData(project: Project) {
    const ganttTasks = [];
    
    for (const phase of project.phases) {
      // Aggiungi la fase come gruppo
      ganttTasks.push({
        id: `phase-${phase._id}`,
        name: phase.name,
        start: new Date(Math.min(...phase.tasks.map(t => new Date(t.start).getTime()))),
        end: new Date(Math.max(...phase.tasks.map(t => new Date(t.end).getTime()))),
        progress: this.calculatePhaseProgress(phase),
        type: 'phase' as const,
        status: TaskStatus.ATTIVA
      });

      // Aggiungi le task della fase
      for (const task of phase.tasks) {
        ganttTasks.push({
          id: task._id || '',
          name: task.name,
          start: new Date(task.start),
          end: new Date(task.end),
          progress: this.calculateTaskProgress(task),
          dependencies: task.dependencies,
          type: task.milestone ? 'milestone' as const : 'task' as const,
          actor: task.actors[0] || '',
          status: task.status
        });
      }
    }

    return ganttTasks;
  }

  private calculatePhaseProgress(phase: { tasks: Task[] }): number {
    if (phase.tasks.length === 0) return 0;
    const completedTasks = phase.tasks.filter(t => t.status === TaskStatus.CONCLUSA).length;
    return (completedTasks / phase.tasks.length) * 100;
  }

  private calculateTaskProgress(task: Task): number {
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
  }
}

export default new ProjectService(); 