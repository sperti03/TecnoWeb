class CalendarProjectIntegration {
	API_BASE = '';

	getAuthHeaders() {
		const token = localStorage.getItem('token');
		return {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		};
	}

	getCurrentUserId() {
		const token = localStorage.getItem('token');
		if (!token) return null;
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return payload.userId || null;
		} catch {
			return null;
		}
	}

	taskToCalendarEvent(task, project, phase) {
		if (!task.start || !task.end) return null;
		const currentUserId = this.getCurrentUserId();
		if (!currentUserId) return null;
		const start = new Date(task.start);
		const end = new Date(task.end);
		const isUserInvolved = task.actors.includes(currentUserId) || project.owner === currentUserId;
		if (!isUserInvolved) return null;
		const title = task.milestone ? `🎯 ${task.name} (Milestone)` : `📋 ${task.name}`;
		const description = `Progetto: ${project.name}\nFase: ${phase.name}\n${task.description || ''}`;
		return {
			title,
			start,
			end,
			description,
			userId: currentUserId,
			notificationLeadTime: task.milestone ? 60 : 30,
			repeatInterval: 0,
			participants: task.actors.map((actorId) => ({ email: '', userId: actorId })),
			projectId: project._id,
			taskId: task._id,
			type: task.milestone ? 'milestone' : 'task',
		};
	}

	milestoneToCalendarEvent(task, project, phase) {
		if (!task.milestone || !task.milestoneDate) return null;
		const currentUserId = this.getCurrentUserId();
		if (!currentUserId) return null;
		const milestoneDate = new Date(task.milestoneDate);
		const endDate = new Date(milestoneDate.getTime() + 60 * 60 * 1000);
		const title = `🎯 ${task.name} - Milestone`;
		const description = `Progetto: ${project.name}\nFase: ${phase.name}\nMilestone: ${task.description || ''}`;
		return {
			title,
			start: milestoneDate,
			end: endDate,
			description,
			userId: currentUserId,
			notificationLeadTime: 120,
			repeatInterval: 0,
			participants: task.actors.map((actorId) => ({ email: '', userId: actorId })),
			projectId: project._id,
			taskId: task._id,
			type: 'milestone',
		};
	}

	async syncProjectsToCalendar(projects, options = {}) {
		const { includeAllTasks = false, includeMilestones = true } = options;
		await this.clearProjectEventsFromCalendar();
		for (const project of projects) {
			for (const phase of project.phases) {
				for (const task of phase.tasks) {
					const events = [];
					if (includeAllTasks) {
						const taskEvent = this.taskToCalendarEvent(task, project, phase);
						if (taskEvent) events.push(taskEvent);
					}
					if (includeMilestones && task.milestone) {
						const milestoneEvent = this.milestoneToCalendarEvent(task, project, phase);
						if (milestoneEvent) events.push(milestoneEvent);
					}
					for (const event of events) {
						await this.createCalendarEvent(event);
					}
				}
			}
		}
	}

	async clearProjectEventsFromCalendar() {
		try {
			const response = await fetch(`${this.API_BASE}/api/events/clear-project-events`, {
				method: 'DELETE',
				headers: this.getAuthHeaders(),
			});
			if (!response.ok) console.error('Failed to clear project events');
		} catch (error) {
			console.error('Error clearing project events:', error);
		}
	}

	async createCalendarEvent(event) {
		const eventData = {
			title: event.title,
			start: event.start.toISOString(),
			end: event.end.toISOString(),
			description: event.description || '',
			notificationLeadTime: event.notificationLeadTime || 30,
			repeatInterval: event.repeatInterval || 0,
			eventType: 'project',
			participants: [],
			createdByEmail: '',
			projectEventData: {
				projectId: event.projectId,
				taskId: event.taskId,
				type: event.type,
			},
			category: event.type === 'milestone' ? 'milestone' : 'project',
			priority: event.type === 'milestone' ? 'high' : 'medium',
			color: event.type === 'milestone' ? '#ff9800' : '#2196f3',
			location: '',
		};
		const response = await fetch(`${this.API_BASE}/api/events`, {
			method: 'POST',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(eventData),
		});
		if (!response.ok) {
			let message = 'Unknown error';
			try { const e = await response.json(); message = e.message || message; } catch {}
			throw new Error(`Failed to create calendar event: ${message}`);
		}
		return await response.json();
	}

	async getUnifiedCalendarEvents() {
		try {
			const response = await fetch(`${this.API_BASE}/api/events/unified`, {
				method: 'GET',
				headers: this.getAuthHeaders(),
			});
			if (!response.ok) throw new Error('Failed to fetch unified calendar events');
			const events = await response.json();
			return events.map((event) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
		} catch (error) {
			console.error('Error fetching unified calendar events:', error);
			return [];
		}
	}

	async createTaskFromCalendarEvent(event, projectId, phaseId) {
		const currentUserId = this.getCurrentUserId();
		if (!currentUserId) return null;
		const newTask = {
			name: event.title.replace(/^[📋🎯]\s*/, ''),
			description: event.description || '',
			start: event.start.toISOString().split('T')[0],
			end: event.end.toISOString().split('T')[0],
			actors: [currentUserId],
			milestone: event.type === 'milestone',
			milestoneDate: event.type === 'milestone' ? event.start.toISOString().split('T')[0] : undefined,
			dependencies: [],
			status: 'Non attivabile',
		};
		try {
			const project = await this.getProject(projectId);
			if (!project) return null;
			const phase = project.phases.find((p) => p._id === phaseId);
			if (!phase) return null;
			phase.tasks.push(newTask);
			await this.updateProject(project);
			return newTask;
		} catch (error) {
			console.error('Error creating task from calendar event:', error);
			return null;
		}
	}

	async getProject(projectId) {
		try {
			const response = await fetch(`${this.API_BASE}/api/getprojects`, { headers: this.getAuthHeaders() });
			if (!response.ok) return null;
			const projects = await response.json();
			return projects.find((p) => p._id === projectId) || null;
		} catch {
			return null;
		}
	}

	async updateProject(project) {
		await fetch(`${this.API_BASE}/api/updateproject/${project._id}`, {
			method: 'PUT',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(project),
		});
	}

	getIntegrationStats(projects) {
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
						if (task.milestoneDate && (task.actors.includes(currentUserId) || project.owner === currentUserId)) {
							syncableMilestones++;
						}
					}
					if (task.start && task.end && (task.actors.includes(currentUserId) || project.owner === currentUserId)) {
						syncableTasks++;
					}
				}
			}
		}
		return { totalTasks, totalMilestones, syncableTasks, syncableMilestones };
	}
}

export default CalendarProjectIntegration;

