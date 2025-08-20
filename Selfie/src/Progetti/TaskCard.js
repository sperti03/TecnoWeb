import React, { useState } from 'react';
import { TaskStatus } from './types.js';

const h = React.createElement;

const TaskCard = ({ task, onStatusUpdate, onEdit, onDelayAction, isOwner }) => {
	const [showOutputForm, setShowOutputForm] = useState(false);
	const [outputText, setOutputText] = useState(task.output || '');

	const getCurrentUserId = () => localStorage.getItem('userId') || '';
	const isTaskActor = () => task.actors.includes(getCurrentUserId());
	const canUpdateStatus = () => isTaskActor() || isOwner;

	const getStatusColor = () => {
		switch (task.status) {
			case TaskStatus.NON_ATTIVABILE: return '#6c757d';
			case TaskStatus.ATTIVABILE: return '#007bff';
			case TaskStatus.ATTIVA: return '#28a745';
			case TaskStatus.CONCLUSA: return '#20c997';
			case TaskStatus.RIATTIVATA: return '#fd7e14';
			case TaskStatus.IN_RITARDO: return '#dc3545';
			case TaskStatus.ABBANDONATA: return '#6f42c1';
			default: return '#6c757d';
		}
	};

	const formatDate = (dateString) => new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
	const getDaysUntilDeadline = () => Math.ceil((new Date(task.end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	const getDeadlineStatus = () => {
		const days = getDaysUntilDeadline();
		if (days < 0) return { text: `${Math.abs(days)} giorni fa`, class: 'overdue' };
		if (days === 0) return { text: 'Oggi', class: 'today' };
		if (days <= 3) return { text: `${days} giorni`, class: 'urgent' };
		return { text: `${days} giorni`, class: 'normal' };
	};

	const handleStatusChange = (newStatus) => {
		if (newStatus === TaskStatus.CONCLUSA) setShowOutputForm(true);
		else onStatusUpdate(task._id, newStatus);
	};

	const handleOutputSubmit = () => {
		onStatusUpdate(task._id, TaskStatus.CONCLUSA, outputText);
		setShowOutputForm(false);
	};

	const deadlineStatus = getDeadlineStatus();

	return h(
		'div',
		{ className: `task-card ${task.milestone ? 'milestone' : ''}` },
		h(
			'div',
			{ className: 'task-header' },
			h(
				'div',
				{ className: 'task-title-section' },
				h('h4', { className: 'task-name' }, task.name),
				task.milestone ? h('span', { className: 'milestone-badge' }, '🎯 Milestone') : null
			),
			h(
				'div',
				{ className: 'task-actions' },
				isOwner ? h('button', { className: 'btn-icon btn-edit', onClick: onEdit, title: 'Modifica task' }, '✏️') : null
			)
		),
		h(
			'div',
			{ className: 'task-content' },
			h('div', { className: 'task-status', style: { backgroundColor: getStatusColor() } }, task.status),
			task.description ? h('p', { className: 'task-description' }, task.description) : null,
			h(
				'div',
				{ className: 'task-details' },
			h(
				'div',
				{ className: 'task-dates' },
				h('div', { className: 'date-item' }, h('span', { className: 'date-label' }, 'Inizio:'), h('span', { className: 'date-value' }, formatDate(task.start))),
				h('div', { className: 'date-item' }, h('span', { className: 'date-label' }, 'Fine:'), h('span', { className: 'date-value' }, formatDate(task.end))),
				h('div', { className: `deadline-status ${deadlineStatus.class}` }, deadlineStatus.text)
			),
			task.actors.length > 0
				? h(
					'div',
					{ className: 'task-actors' },
					h('span', { className: 'actors-label' }, 'Attori:'),
					h('div', { className: 'actors-list' }, ...task.actors.map((actor, i) => h('span', { key: i, className: 'actor-badge' }, actor)))
				)
				: null,
			task.dependencies.length > 0
				? h(
					'div',
					{ className: 'task-dependencies' },
					h('span', { className: 'dependencies-label' }, 'Dipendenze:'),
					h('span', { className: 'dependencies-count' }, String(task.dependencies.length) + ' task')
				)
				: null
		),
		task.input ? h('div', { className: 'task-input' }, h('strong', null, 'Input:'), h('p', null, task.input)) : null,
		task.output ? h('div', { className: 'task-output' }, h('strong', null, 'Output:'), h('p', null, task.output)) : null,
		task.milestone && task.milestoneDate ? h('div', { className: 'milestone-date' }, h('strong', null, 'Data Milestone:'), h('span', null, formatDate(task.milestoneDate))) : null
	),
	canUpdateStatus()
		? h(
			'div',
			{ className: 'task-status-controls' },
			h('h5', null, 'Aggiorna Status:'),
			h(
				'div',
				{ className: 'status-buttons' },
				task.status === TaskStatus.ATTIVABILE ? h('button', { className: 'btn btn-success btn-small', onClick: () => handleStatusChange(TaskStatus.ATTIVA) }, 'Inizia') : null,
				task.status === TaskStatus.ATTIVA ? h('button', { className: 'btn btn-primary btn-small', onClick: () => handleStatusChange(TaskStatus.CONCLUSA) }, 'Completa') : null,
				(task.status === TaskStatus.CONCLUSA || task.status === TaskStatus.RIATTIVATA) && isOwner ? h('button', { className: 'btn btn-warning btn-small', onClick: () => handleStatusChange(TaskStatus.RIATTIVATA) }, 'Richiedi Revisione') : null
			)
		)
		: null,
		task.status === TaskStatus.IN_RITARDO && isOwner
			? h(
				'div',
				{ className: 'delay-actions' },
				h('h5', null, 'Gestione Ritardo:'),
				h(
					'div',
					{ className: 'delay-buttons' },
					h('button', { className: 'btn btn-warning btn-small', onClick: () => onDelayAction(task._id, 'translate') }, 'Trasla Dipendenti'),
					h('button', { className: 'btn btn-danger btn-small', onClick: () => onDelayAction(task._id, 'compress') }, 'Comprimi Dipendenti')
				)
			)
			: null,
		showOutputForm
			? h(
				'div',
				{ className: 'output-form-overlay' },
				h(
					'div',
					{ className: 'output-form' },
					h('h4', null, 'Completa Task'),
					h('textarea', { value: outputText, onChange: (e) => setOutputText(e.target.value), placeholder: "Descrivi l'output della task...", rows: 4 }),
					h(
						'div',
						{ className: 'form-actions' },
						h('button', { className: 'btn btn-secondary', onClick: () => setShowOutputForm(false) }, 'Annulla'),
						h('button', { className: 'btn btn-primary', onClick: handleOutputSubmit }, 'Completa Task')
					)
				)
			)
			: null
	);
};

export default TaskCard;

 

