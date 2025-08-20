import React, { useState } from 'react';
import { SortBy } from './types.js';
import ProjectCard from './ProjectCard.js';
import './ProjectHome.css';
import './ProjectList.css';

const h = React.createElement;

const ProjectList = ({ projects, onProjectSelect, onProjectEdit, onProjectDelete }) => {
	const [sortBy, setSortBy] = useState(SortBy.DATE);
	const [filterText, setFilterText] = useState('');
	const [showOnlyMyProjects, setShowOnlyMyProjects] = useState(false);

	const getCurrentUserId = () => localStorage.getItem('userId') || '';

	const filteredProjects = projects.filter((project) => {
		const matchesText = project.name.toLowerCase().includes(filterText.toLowerCase()) ||
			project.description.toLowerCase().includes(filterText.toLowerCase());
		const matchesOwnership = !showOnlyMyProjects || project.owner === getCurrentUserId();
		return matchesText && matchesOwnership;
	});

	const sortedProjects = [...filteredProjects].sort((a, b) => {
		switch (sortBy) {
			case SortBy.DATE:
				return new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime();
			case SortBy.ACTOR: {
				const aActors = new Set(a.phases.flatMap((p) => p.tasks.flatMap((t) => t.actors))).size;
				const bActors = new Set(b.phases.flatMap((p) => p.tasks.flatMap((t) => t.actors))).size;
				return bActors - aActors;
			}
			case SortBy.PHASE:
				return a.phases.length - b.phases.length;
			case SortBy.STATUS: {
				const aProgress = calculateProjectProgress(a);
				const bProgress = calculateProjectProgress(b);
				return bProgress - aProgress;
			}
			default:
				return a.name.localeCompare(b.name);
		}
	});

	const calculateProjectProgress = (project) => {
		const allTasks = project.phases.flatMap((p) => p.tasks);
		if (allTasks.length === 0) return 0;
		const completedTasks = allTasks.filter((t) => t.status === 'Conclusa').length;
		return (completedTasks / allTasks.length) * 100;
	};

	const getProjectStats = (project) => {
		const allTasks = project.phases.flatMap((p) => p.tasks);
		const totalTasks = allTasks.length;
		const completedTasks = allTasks.filter((t) => t.status === 'Conclusa').length;
		const inProgressTasks = allTasks.filter((t) => t.status === 'Attiva').length;
		const overdueTasks = allTasks.filter((t) => t.status === 'In ritardo').length;
		return { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks, overdue: overdueTasks, progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0 };
	};

	if (projects.length === 0) {
		return h(
			'div',
			{ className: 'project-list-empty' },
			h('h2', null, 'Nessun progetto trovato'),
			h('p', null, 'Inizia creando il tuo primo progetto!')
		);
	}

	return h(
		'div',
		{ className: 'project-list' },
		h(
			'div',
			{ className: 'project-list-controls' },
			h(
				'div',
				{ className: 'search-bar' },
				h('input', {
					type: 'text',
					placeholder: 'Cerca progetti...',
					value: filterText,
					onChange: (e) => setFilterText(e.target.value),
					className: 'search-input',
				})
			),
			h(
				'div',
				{ className: 'filter-controls' },
				h(
					'select',
					{ value: sortBy, onChange: (e) => setSortBy(e.target.value), className: 'sort-select' },
					h('option', { value: SortBy.DATE }, 'Data aggiornamento'),
					h('option', { value: SortBy.ACTOR }, 'Numero attori'),
					h('option', { value: SortBy.PHASE }, 'Numero fasi'),
					h('option', { value: SortBy.STATUS }, 'Progresso')
				),
				h(
					'label',
					{ className: 'checkbox-label' },
					h('input', {
						type: 'checkbox',
						checked: showOnlyMyProjects,
						onChange: (e) => setShowOnlyMyProjects(e.target.checked),
					}),
					'Solo i miei progetti'
				)
			)
		),
		h(
			'div',
			{ className: 'project-grid' },
			...sortedProjects.map((project) =>
				h(ProjectCard, {
					key: project._id,
					project,
					stats: getProjectStats(project),
					onSelect: () => onProjectSelect(project),
					onEdit: () => onProjectEdit(project),
					onDelete: () => project._id && onProjectDelete(project._id),
					isOwner: project.owner === getCurrentUserId(),
				})
			)
		),
		h(
			'div',
			{ className: 'project-list-summary' },
			h('p', null, `Mostrando ${sortedProjects.length} di ${projects.length} progetti`)
		)
	);
};

export default ProjectList;

 

