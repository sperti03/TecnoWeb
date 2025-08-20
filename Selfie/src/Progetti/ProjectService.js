import { TaskStatus } from './types.js';

const API_BASE = '/api';

class ProjectService {
	getAuthHeaders() {
		const token = localStorage.getItem('token');
		return {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		};
	}

	// GET - Recupera tutti i progetti dell'utente
	async getProjects() {
		const response = await fetch(`${API_BASE}/getprojects`, {
			method: 'GET',
			headers: this.getAuthHeaders(),
		});
		if (!response.ok) throw new Error(`Errore nel recupero progetti: ${response.statusText}`);
		return await response.json();
	}

	// POST - Crea un nuovo progetto
	async createProject(projectData) {
		const response = await fetch(`${API_BASE}/addproject`, {
			method: 'POST',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(projectData),
		});
		if (!response.ok) throw new Error(`Errore nella creazione progetto: ${response.statusText}`);
		return await response.json();
	}

	// PUT - Aggiorna un progetto esistente
	async updateProject(projectId, projectData) {
		const response = await fetch(`${API_BASE}/updateproject/${projectId}`, {
			method: 'PUT',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(projectData),
		});
		if (!response.ok) throw new Error(`Errore nell'aggiornamento progetto: ${response.statusText}`);
		return await response.json();
	}

	// DELETE - Elimina un progetto
	async deleteProject(projectId) {
		const response = await fetch(`${API_BASE}/deleteproject/${projectId}`, {
			method: 'DELETE',
			headers: this.getAuthHeaders(),
		});
		if (!response.ok) throw new Error(`Errore nell'eliminazione progetto: ${response.statusText}`);
	}

	// Business logic helpers
	calculateTaskStatus(task, allTasks) {
		const now = new Date();
		const endDate = new Date(task.end);
		const hasInput = this.isTaskInputAvailable(task, allTasks);
		if (endDate < now && task.status !== TaskStatus.CONCLUSA) {
			const daysPassed = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
			if (daysPassed > 30) return TaskStatus.ABBANDONATA;
			return TaskStatus.IN_RITARDO;
		}
		if (!hasInput) return TaskStatus.NON_ATTIVABILE;
		return task.status;
	}

	isTaskInputAvailable(task, allTasks) {
		if (!task.dependencies || task.dependencies.length === 0) return true;
		return task.dependencies.every((depId) => {
			const dependentTask = allTasks.find((t) => t._id === depId);
			return dependentTask && dependentTask.status === TaskStatus.CONCLUSA;
		});
	}

	async updateTaskStatus(projectId, taskUpdate) {
		const projects = await this.getProjects();
		const project = projects.find((p) => p._id === projectId);
		if (!project) throw new Error('Progetto non trovato');
		let taskFound = false;
		for (const phase of project.phases) {
			const taskIndex = phase.tasks.findIndex((t) => t._id === taskUpdate.taskId);
			if (taskIndex !== -1) {
				phase.tasks[taskIndex].status = taskUpdate.status;
				if (taskUpdate.output) phase.tasks[taskIndex].output = taskUpdate.output;
				if (taskUpdate.actualEndDate) phase.tasks[taskIndex].end = taskUpdate.actualEndDate;
				taskFound = true;
				break;
			}
		}
		if (!taskFound) throw new Error('Task non trovata');
		return await this.updateProject(projectId, project);
	}

	async handleDelayConsequences(projectId, delayedTaskId, action) {
		const projects = await this.getProjects();
		const project = projects.find((p) => p._id === projectId);
		if (!project) throw new Error('Progetto non trovato');
		const allTasks = project.phases.flatMap((p) => p.tasks);
		const delayedTask = allTasks.find((t) => t._id === delayedTaskId);
		if (!delayedTask) throw new Error('Task ritardata non trovata');
		const dependentTasks = allTasks.filter((t) => t.dependencies.includes(delayedTaskId));
		const delayedTaskEnd = new Date(delayedTask.end);
		const now = new Date();
		const delayDays = Math.ceil((now.getTime() - delayedTaskEnd.getTime()) / (1000 * 60 * 60 * 24));
		for (const depTask of dependentTasks) {
			const startDate = new Date(depTask.start);
			const endDate = new Date(depTask.end);
			const duration = endDate.getTime() - startDate.getTime();
			if (action === 'translate') {
				depTask.start = new Date(startDate.getTime() + delayDays * 24 * 60 * 60 * 1000).toISOString();
				depTask.end = new Date(endDate.getTime() + delayDays * 24 * 60 * 60 * 1000).toISOString();
			} else if (action === 'compress') {
				const newDuration = duration - delayDays * 24 * 60 * 60 * 1000;
				if (newDuration > 0) {
					depTask.start = new Date(endDate.getTime() - newDuration).toISOString();
				}
			}
		}
		return await this.updateProject(projectId, project);
	}

	convertToGanttData(project) {
		const ganttTasks = [];
		for (const phase of project.phases) {
			ganttTasks.push({
				id: `phase-${phase._id}`,
				name: phase.name,
				start: new Date(Math.min(...phase.tasks.map((t) => new Date(t.start).getTime()))),
				end: new Date(Math.max(...phase.tasks.map((t) => new Date(t.end).getTime()))),
				progress: this.calculatePhaseProgress(phase),
				type: 'phase',
				status: 'Attiva',
			});
			for (const task of phase.tasks) {
				ganttTasks.push({
					id: task._id || '',
					name: task.name,
					start: new Date(task.start),
					end: new Date(task.end),
					progress: this.calculateTaskProgress(task),
					dependencies: task.dependencies,
					type: task.milestone ? 'milestone' : 'task',
					actor: task.actors[0] || '',
					status: task.status,
				});
			}
		}
		return ganttTasks;
	}

	calculatePhaseProgress(phase) {
		if (phase.tasks.length === 0) return 0;
		const completedTasks = phase.tasks.filter((t) => t.status === TaskStatus.CONCLUSA).length;
		return (completedTasks / phase.tasks.length) * 100;
	}

	calculateTaskProgress(task) {
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

