import React, { useState, useEffect } from 'react';
import { TaskStatus } from './types.js';
import './ProjectHome.css';
import './GanttView.css';

const h = React.createElement;

const GanttView = ({ project, onTaskUpdate, isOwner }) => {
	const [ganttData, setGanttData] = useState([]);
	const [timelineStart, setTimelineStart] = useState(new Date());
	const [timelineEnd, setTimelineEnd] = useState(new Date());
	const [scale, setScale] = useState('weeks');

	useEffect(() => { generateGanttData(); }, [project]);

	const generateGanttData = () => {
		const rows = [];
		let minDate = new Date();
		let maxDate = new Date();
		const allDates = [];
		project.phases.forEach((phase, phaseIndex) => {
			if (phase.tasks.length > 0) {
				phase.tasks.forEach((task) => { allDates.push(new Date(task.start)); allDates.push(new Date(task.end)); });
				const phaseStart = new Date(Math.min(...phase.tasks.map((t) => new Date(t.start).getTime())));
				const phaseEnd = new Date(Math.max(...phase.tasks.map((t) => new Date(t.end).getTime())));
				allDates.push(phaseStart); allDates.push(phaseEnd);
				rows.push({ id: `phase-${phase._id}`, name: phase.name || `Fase ${phaseIndex + 1}`, start: phaseStart, end: phaseEnd, type: 'phase', progress: calculatePhaseProgress(phase), level: 0 });
				phase.tasks.forEach((task) => { rows.push({ id: task._id, name: task.name, start: new Date(task.start), end: new Date(task.end), type: task.milestone ? 'milestone' : 'task', status: task.status, progress: calculateTaskProgress(task), level: 1, actors: task.actors }); });
			}
		});
		if (allDates.length > 0) {
			minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
			maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
			minDate.setDate(minDate.getDate() - 7);
			maxDate.setDate(maxDate.getDate() + 7);
		}
		setGanttData(rows);
		setTimelineStart(minDate);
		setTimelineEnd(maxDate);
	};

	const calculatePhaseProgress = (phase) => {
		if (phase.tasks.length === 0) return 0;
		const completedTasks = phase.tasks.filter((t) => t.status === TaskStatus.CONCLUSA).length;
		return (completedTasks / phase.tasks.length) * 100;
	};

	const calculateTaskProgress = (task) => {
		switch (task.status) {
			case TaskStatus.CONCLUSA: return 100;
			case TaskStatus.ATTIVA: return 50;
			case TaskStatus.RIATTIVATA: return 75;
			default: return 0;
		}
	};

	const getTimelineDays = () => { const days = []; const current = new Date(timelineStart); while (current <= timelineEnd) { days.push(new Date(current)); current.setDate(current.getDate() + 1); } return days; };
	const getTimelineWeeks = () => { const weeks = []; const current = new Date(timelineStart); const dayOfWeek = current.getDay(); const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; current.setDate(current.getDate() + mondayOffset); while (current <= timelineEnd) { weeks.push(new Date(current)); current.setDate(current.getDate() + 7); } return weeks; };
	const getTimelineMonths = () => { const months = []; const current = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1); while (current <= timelineEnd) { months.push(new Date(current)); current.setMonth(current.getMonth() + 1); } return months; };
	const getTimelineUnits = () => (scale === 'days' ? getTimelineDays() : scale === 'months' ? getTimelineMonths() : getTimelineWeeks());
	const getUnitWidth = () => { const units = getTimelineUnits(); return units.length > 0 ? Math.max(40, 800 / units.length) : 40; };
	const getBarPosition = (start, end) => { const total = timelineEnd.getTime() - timelineStart.getTime(); const startOffset = start.getTime() - timelineStart.getTime(); const duration = end.getTime() - start.getTime(); const left = (startOffset / total) * 100; const width = (duration / total) * 100; return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` }; };
	const getStatusColor = (type, status) => { if (type === 'phase') return '#6c757d'; if (type === 'milestone') return '#ffc107'; switch (status) { case TaskStatus.NON_ATTIVABILE: return '#6c757d'; case TaskStatus.ATTIVABILE: return '#007bff'; case TaskStatus.ATTIVA: return '#28a745'; case TaskStatus.CONCLUSA: return '#20c997'; case TaskStatus.RIATTIVATA: return '#fd7e14'; case TaskStatus.IN_RITARDO: return '#dc3545'; case TaskStatus.ABBANDONATA: return '#6f42c1'; default: return '#6c757d'; } };
	const formatTimelineLabel = (date) => (scale === 'days' ? date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : scale === 'months' ? date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }) : `S${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('it-IT', { month: 'short' })}`);
	const handleTaskClick = (rowId) => { if (rowId.startsWith('phase-')) return; const task = project.phases.flatMap((p) => p.tasks).find((t) => t._id === rowId); if (task && task.status === TaskStatus.ATTIVABILE) onTaskUpdate(rowId, TaskStatus.ATTIVA); };

	if (ganttData.length === 0) return h('div', { className: 'gantt-view' }, h('div', { className: 'gantt-empty' }, h('p', null, 'Nessuna task da visualizzare nel diagramma di Gantt')));

	return h(
		'div',
		{ className: 'gantt-view' },
		h(
			'div',
			{ className: 'gantt-controls' },
		h(
				'div',
				{ className: 'scale-controls' },
			h('button', { className: `btn ${scale === 'days' ? 'btn-active' : 'btn-secondary'}`, onClick: () => setScale('days') }, 'Giorni'),
			h('button', { className: `btn ${scale === 'weeks' ? 'btn-active' : 'btn-secondary'}`, onClick: () => setScale('weeks') }, 'Settimane'),
			h('button', { className: `btn ${scale === 'months' ? 'btn-active' : 'btn-secondary'}`, onClick: () => setScale('months') }, 'Mesi')
			)
		),
		h(
			'div',
			{ className: 'gantt-container' },
		h(
				'div',
				{ className: 'gantt-sidebar' },
			h('div', { className: 'gantt-header' }, 'Task'),
			...ganttData.map((row) =>
				h(
					'div',
					{ key: row.id, className: `gantt-row-label level-${row.level} ${row.type}` },
				h('div', { className: 'row-name' }, row.name),
				row.actors && row.actors.length > 0
					? h(
						'div',
						{ className: 'row-actors' },
						...row.actors.slice(0, 2).map((actor, index) => h('span', { key: index, className: 'actor-badge' }, actor.split('@')[0])),
						row.actors.length > 2 ? h('span', { className: 'actor-more' }, `+${row.actors.length - 2}`) : null
					)
					: null
			)
		)
	),
		h(
			'div',
			{ className: 'gantt-timeline' },
		h(
				'div',
				{ className: 'gantt-timeline-header' },
				...getTimelineUnits().map((unit, index) => h('div', { key: index, className: 'timeline-unit', style: { width: getUnitWidth() } }, formatTimelineLabel(unit)))
			),
		h(
				'div',
				{ className: 'gantt-chart' },
				...ganttData.map((row) => {
					const position = getBarPosition(row.start, row.end);
					const color = getStatusColor(row.type, row.status);
					return h(
						'div',
						{ key: row.id, className: `gantt-row ${row.type}` },
						h(
							'div',
							{
								className: 'gantt-bar',
								style: { ...position, backgroundColor: color, cursor: row.type === 'task' ? 'pointer' : 'default' },
								onClick: () => handleTaskClick(row.id),
								title: `${row.name} (${row.start.toLocaleDateString()} - ${row.end.toLocaleDateString()})`,
							},
							row.progress > 0 ? h('div', { className: 'progress-bar', style: { width: `${row.progress}%` } }) : null,
							row.type === 'milestone' ? h('div', { className: 'milestone-marker' }, '♦') : null
						)
					);
				}),
			h('div', { className: 'current-time-line', style: { left: getBarPosition(new Date(), new Date()).left } })
			)
		)
	),
		h(
			'div',
			{ className: 'gantt-legend' },
		h('div', { className: 'legend-item' }, h('div', { className: 'legend-color phase' }), h('span', null, 'Fasi')),
		h('div', { className: 'legend-item' }, h('div', { className: 'legend-color task' }), h('span', null, 'Task')),
		h('div', { className: 'legend-item' }, h('div', { className: 'legend-color milestone' }), h('span', null, 'Milestones')),
		h('div', { className: 'legend-item' }, h('div', { className: 'legend-line current-time' }), h('span', null, 'Oggi'))
		)
	);
};

export default GanttView;

 
 

