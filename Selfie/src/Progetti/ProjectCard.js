import React from 'react';

const h = React.createElement;

const ProjectCard = ({ project, stats, onSelect, onEdit, onDelete, isOwner }) => {
	const formatDate = (dateString) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('it-IT');
	};

	const getProgressBarColor = (progress) => {
		if (progress < 30) return 'var(--progress-low)';
		if (progress < 70) return 'var(--progress-medium)';
		return 'var(--progress-high)';
	};

	const handleEdit = (e) => {
		e.stopPropagation();
		onEdit();
	};

	const handleDelete = (e) => {
		e.stopPropagation();
		if (window.confirm('Sei sicuro di voler eliminare questo progetto?')) {
			onDelete();
		}
	};

	const actions = isOwner
		? h(
			'div',
			{ className: 'project-actions' },
			h('button', { className: 'btn-icon btn-edit', onClick: handleEdit, title: 'Modifica progetto' }, '✏️'),
			h('button', { className: 'btn-icon btn-delete', onClick: handleDelete, title: 'Elimina progetto' }, '🗑️')
		)
		: null;

	return h(
		'div',
		{ className: 'project-card', onClick: onSelect },
		h(
			'div',
			{ className: 'project-card-header' },
			h('h3', { className: 'project-title' }, project.name),
			actions
		),
		h(
			'div',
			{ className: 'project-description' },
			project.description && project.description.length > 100
				? `${project.description.substring(0, 100)}...`
				: project.description || 'Nessuna descrizione'
		),
		h(
			'div',
			{ className: 'project-progress' },
			h(
				'div',
				{ className: 'progress-info' },
				h('span', null, `Progresso: ${stats.progress.toFixed(1)}%`),
				h('span', null, `${stats.completed}/${stats.total} task`)
			),
			h(
				'div',
				{ className: 'progress-bar' },
				h('div', {
					className: 'progress-fill',
					style: { width: `${stats.progress}%`, backgroundColor: getProgressBarColor(stats.progress) },
				})
			)
		),
		h(
			'div',
			{ className: 'project-stats' },
			h(
				'div',
				{ className: 'stat-item' },
				h('span', { className: 'stat-label' }, 'Fasi:'),
				h('span', { className: 'stat-value' }, String(project.phases.length))
			),
			h(
				'div',
				{ className: 'stat-item' },
				h('span', { className: 'stat-label' }, 'In corso:'),
				h('span', { className: 'stat-value stat-progress' }, String(stats.inProgress))
			),
			stats.overdue > 0
				? h(
					'div',
					{ className: 'stat-item' },
					h('span', { className: 'stat-label' }, 'In ritardo:'),
					h('span', { className: 'stat-value stat-overdue' }, String(stats.overdue))
				)
				: null
		),
		h(
			'div',
			{ className: 'project-meta' },
			h(
				'div',
				{ className: 'project-dates' },
				h('small', null, `Creato: ${formatDate(project.createdAt)}`),
				h('small', null, `Aggiornato: ${formatDate(project.updatedAt)}`)
			),
			!isOwner ? h('div', { className: 'project-role' }, h('span', { className: 'role-badge' }, 'Partecipante')) : null
		),
		project.notes
			? h('div', { className: 'project-notes' }, h('small', null, `Note: ${project.notes.length > 50 ? `${project.notes.substring(0, 50)}...` : project.notes}`))
			: null
	);
};

export default ProjectCard;

 

