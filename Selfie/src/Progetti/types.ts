export interface Task {
  _id?: string;
  name: string;
  description: string;
  actors: string[]; // userId o email
  phase: string;
  subphase: string;
  start: string; // ISO date
  end: string; // ISO date
  input: string;
  output: string;
  status: TaskStatus;
  milestone: boolean;
  milestoneDate?: string;
  dependencies: string[]; // IDs delle task dipendenti
}

export interface Phase {
  _id?: string;
  name: string;
  tasks: Task[];
}

export interface Project {
  _id?: string;
  name: string;
  description: string;
  owner: string; // ObjectId del capo-progetto
  phases: Phase[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum TaskStatus {
  NON_ATTIVABILE = "Non attivabile",
  ATTIVABILE = "Attivabile", 
  ATTIVA = "Attiva",
  CONCLUSA = "Conclusa",
  RIATTIVATA = "Riattivata",
  IN_RITARDO = "In ritardo",
  ABBANDONATA = "Abbandonata"
}

export enum ViewMode {
  LIST = "list",
  GANTT = "gantt"
}

export enum SortBy {
  DATE = "date",
  ACTOR = "actor",
  PHASE = "phase",
  STATUS = "status"
}

export interface TaskUpdate {
  taskId: string;
  status: TaskStatus;
  output?: string;
  actualEndDate?: string;
}

export interface NotificationData {
  type: 'task_assigned' | 'task_updated' | 'project_updated' | 'deadline_approaching';
  projectId: string;
  taskId?: string;
  message: string;
  timestamp: string;
}

export interface GanttTaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  type: 'task' | 'milestone' | 'phase';
  actor?: string;
  status: TaskStatus;
} 