import React, { useState, useEffect } from 'react';
import { TaskStatus, ViewMode } from './types.js';
import ProjectService from './ProjectService.js';
import TaskList from './TaskList.js';
import GanttView from './GanttView.js';
import TaskForm from './TaskForm.js';
import './ProjectHome.css';
import './ProjectDetail.css';
import CalendarProjectIntegration from './CalendarProjectIntegration.js';

const h = React.createElement;

const ProjectDetail = ({ project, onProjectUpdate, onProjectEdit }) => {
	const [viewMode, setViewMode] = useState(ViewMode.LIST);
	const [selectedTask, setSelectedTask] = useState(null);
	const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
	const [isCreatingTask, setIsCreatingTask] = useState(false);
	const [currentProject, setCurrentProject] = useState(project);
	const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
	const integration = new CalendarProjectIntegration();

	useEffect(() => {
		setCurrentProject(project);
	}, [project]);

	const isOwner = () => {
		const userId = localStorage.getItem('userId');
		return String(currentProject.owner) === String(userId);
	};

	const handleTaskStatusUpdate = async (taskId, newStatus, output) => {
		try {
			const updatedProject = await ProjectService.updateTaskStatus(currentProject._id, {
				taskId,
				status: newStatus,
				output,
				actualEndDate: newStatus === TaskStatus.CONCLUSA ? new Date().toISOString() : undefined,
			});
			setCurrentProject(updatedProject);
			onProjectUpdate();
		} catch (error) {
			console.error("Errore nell'aggiornamento task:", error);
			alert("Errore nell'aggiornamento della task");
		}
	};

	const handleDelayAction = async (taskId, action) => {
		if (!isOwner()) {
			alert('Solo il capo-progetto può gestire i ritardi');
			return;
		}
		try {
			const updatedProject = await ProjectService.handleDelayConsequences(currentProject._id, taskId, action);
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

	const handleEditTask = (task) => {
		setIsCreatingTask(false);
		setSelectedTask(task);
		setIsTaskFormOpen(true);
	};

	const handleTaskSaved = async (taskData, phaseId) => {
		try {
			const updatedPhases = [...currentProject.phases];
			if (isCreatingTask && phaseId) {
				const phaseIndex = updatedPhases.findIndex((p) => p._id === phaseId);
				if (phaseIndex !== -1) {
					updatedPhases[phaseIndex].tasks.push({
						...taskData,
						_id: Date.now().toString(),
						status: TaskStatus.NON_ATTIVABILE,
					});
				}
			} else if (selectedTask) {
				for (const phase of updatedPhases) {
					const taskIndex = phase.tasks.findIndex((t) => t._id === selectedTask._id);
					if (taskIndex !== -1) {
						phase.tasks[taskIndex] = { ...phase.tasks[taskIndex], ...taskData };
						break;
					}
				}
			}
			const updatedProject = await ProjectService.updateProject(currentProject._id, { ...currentProject, phases: updatedPhases });
			setCurrentProject(updatedProject);
			setIsTaskFormOpen(false);
			setSelectedTask(null);
			onProjectUpdate();
			if (autoSyncEnabled) {
				try {
					await integration.syncProjectsToCalendar([updatedProject], { includeAllTasks: false, includeMilestones: true, onlyUserTasks: true });
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
		const allTasks = currentProject.phases.flatMap((p) => p.tasks);
		const totalTasks = allTasks.length;
		const completedTasks = allTasks.filter((t) => t.status === TaskStatus.CONCLUSA).length;
		const inProgressTasks = allTasks.filter((t) => t.status === TaskStatus.ATTIVA).length;
		const overdueTasks = allTasks.filter((t) => t.status === TaskStatus.IN_RITARDO).length;
		const milestones = allTasks.filter((t) => t.milestone);
		const completedMilestones = milestones.filter((t) => t.status === TaskStatus.CONCLUSA).length;
		return { totalTasks, completedTasks, inProgressTasks, overdueTasks, milestones: milestones.length, completedMilestones };
	};

	const stats = calculateProjectStats();

	return h(
		'div',
		{ className: 'project-detail' },
		h(
			'header',
			{ className: 'project-detail-header' },
		h(
				'div',
				{ className: 'project-info' },
			h('h1', null, currentProject.name),
			h('p', { className: 'project-description' }, currentProject.description),
			h(
				'div',
				{ className: 'project-stats-summary' },
			h('div', { className: 'stat-box' }, h('span', { className: 'stat-number' }, `${(stats.completedTasks / (stats.totalTasks || 1)) * 100}%`), h('span', { className: 'stat-label' }, 'Completato')),
			h('div', { className: 'stat-box' }, h('span', { className: 'stat-number' }, `${stats.completedTasks}/${stats.totalTasks}`), h('span', { className: 'stat-label' }, 'Task')),
			h('div', { className: 'stat-box' }, h('span', { className: 'stat-number' }, `${stats.completedMilestones}/${stats.milestones}`), h('span', { className: 'stat-label' }, 'Milestones')),
			stats.overdueTasks > 0 ? h('div', { className: 'stat-box stat-warning' }, h('span', { className: 'stat-number' }, String(stats.overdueTasks)), h('span', { className: 'stat-label' }, 'In ritardo')) : null
			)
		),
		h(
			'div',
			{ className: 'project-actions' },
			isOwner()
				? h(
					React.Fragment,
					null,
					h('button', { className: 'btn btn-secondary', onClick: () => onProjectEdit(currentProject) }, 'Modifica Progetto'),
					h('button', { className: 'btn btn-primary', onClick: handleCreateTask }, 'Nuova Task')
				)
				: null
		)
	),
		h(
			'div',
			{ className: 'view-controls' },
		h(
				'div',
				{ className: 'view-mode-toggle' },
			h('button', { className: `btn ${viewMode === ViewMode.LIST ? 'btn-active' : 'btn-secondary'}`, onClick: () => setViewMode(ViewMode.LIST) }, 'Vista Lista'),
			h('button', { className: `btn ${viewMode === ViewMode.GANTT ? 'btn-active' : 'btn-secondary'}`, onClick: () => setViewMode(ViewMode.GANTT) }, 'Vista Gantt')
			)
		),
		h(
			'main',
			{ className: 'project-content' },
			viewMode === ViewMode.LIST
				? h(TaskList, { project: currentProject, onTaskStatusUpdate: handleTaskStatusUpdate, onTaskEdit: handleEditTask, onDelayAction: handleDelayAction, isOwner: isOwner() })
				: h(GanttView, { project: currentProject, onTaskUpdate: handleTaskStatusUpdate, isOwner: isOwner() })
		),
		currentProject.notes ? h('aside', { className: 'project-notes' }, h('h3', null, 'Note del Progetto'), h('div', { className: 'notes-content' }, currentProject.notes)) : null,
		isTaskFormOpen ? h(TaskForm, { task: isCreatingTask ? null : selectedTask, project: currentProject, onSave: handleTaskSaved, onCancel: handleTaskFormClose }) : null
	);
};

export default ProjectDetail;

 

