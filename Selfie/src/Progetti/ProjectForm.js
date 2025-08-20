import React, { useState, useEffect } from 'react';

const h = React.createElement;

const ProjectForm = ({ project, onSave, onCancel }) => {
	const [formData, setFormData] = useState({ name: '', description: '', notes: '', phases: [] });

	useEffect(() => {
		if (project) {
			setFormData({ name: project.name, description: project.description, notes: project.notes, phases: project.phases });
		}
	}, [project]);

	const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

	const handleAddPhase = () => {
		const newPhase = { _id: Date.now().toString(), name: '', tasks: [] };
		setFormData((prev) => ({ ...prev, phases: [...prev.phases, newPhase] }));
	};

	const handlePhaseChange = (phaseIndex, field, value) => {
		setFormData((prev) => ({ ...prev, phases: prev.phases.map((phase, index) => (index === phaseIndex ? { ...phase, [field]: value } : phase)) }));
	};

	const handleRemovePhase = (phaseIndex) => setFormData((prev) => ({ ...prev, phases: prev.phases.filter((_, index) => index !== phaseIndex) }));

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!formData.name.trim()) return alert('Il nome del progetto è obbligatorio');
		onSave(formData);
	};

	const isEditing = !!project;

	const header = h(
		'header',
		{ className: 'form-header' },
		h('h2', null, isEditing ? 'Modifica Progetto' : 'Nuovo Progetto'),
		h('button', { className: 'btn-close', onClick: onCancel }, '×')
	);

	const generalSection = h(
		'div',
		{ className: 'form-section' },
		h('h3', null, 'Informazioni Generali'),
		h(
			'div',
			{ className: 'form-group' },
			h('label', { htmlFor: 'project-name' }, 'Nome Progetto *'),
			h('input', {
				id: 'project-name',
				type: 'text',
				value: formData.name,
				onChange: (e) => handleInputChange('name', e.target.value),
				placeholder: 'Inserisci il nome del progetto',
				required: true,
			})
		),
		h(
			'div',
			{ className: 'form-group' },
			h('label', { htmlFor: 'project-description' }, 'Descrizione'),
			h('textarea', {
				id: 'project-description',
				value: formData.description,
				onChange: (e) => handleInputChange('description', e.target.value),
				placeholder: 'Descrivi brevemente il progetto',
				rows: 3,
			})
		),
		h(
			'div',
			{ className: 'form-group' },
			h('label', { htmlFor: 'project-notes' }, 'Note'),
			h('textarea', {
				id: 'project-notes',
				value: formData.notes,
				onChange: (e) => handleInputChange('notes', e.target.value),
				placeholder: 'Note aggiuntive sul progetto',
				rows: 4,
			})
		)
	);

	const phasesSection = h(
		'div',
		{ className: 'form-section' },
		h(
			'div',
			{ className: 'section-header' },
			h('h3', null, 'Fasi del Progetto'),
			h('button', { type: 'button', className: 'btn btn-secondary', onClick: handleAddPhase }, 'Aggiungi Fase')
		),
		formData.phases.length === 0
			? h('p', { className: 'no-phases' }, 'Nessuna fase aggiunta. Clicca "Aggiungi Fase" per iniziare.')
			: h(
				'div',
				{ className: 'phases-list' },
				...formData.phases.map((phase, index) =>
					h(
						'div',
						{ key: phase._id, className: 'phase-item' },
						h(
							'div',
							{ className: 'phase-header' },
							h('input', {
								type: 'text',
								value: phase.name,
								onChange: (e) => handlePhaseChange(index, 'name', e.target.value),
								placeholder: `Nome fase ${index + 1}`,
								className: 'phase-name-input',
							}),
							h(
								'button',
								{ type: 'button', className: 'btn-remove', onClick: () => handleRemovePhase(index), title: 'Rimuovi fase' },
								'🗑️'
							)
						),
						phase.tasks.length > 0
							? h('div', { className: 'phase-tasks-summary' }, h('small', null, `${phase.tasks.length} task in questa fase`))
							: null
					)
				)
		)
	);

	const form = h(
		'form',
		{ onSubmit: handleSubmit, className: 'form-content' },
		generalSection,
		phasesSection,
		h(
			'div',
			{ className: 'form-actions' },
			h('button', { type: 'button', className: 'btn btn-secondary', onClick: onCancel }, 'Annulla'),
			h('button', { type: 'submit', className: 'btn btn-primary' }, isEditing ? 'Salva Modifiche' : 'Crea Progetto')
		)
	);

	return h(
		'div',
		{ className: 'project-form-overlay' },
		h(
			'div',
			{ className: 'project-form' },
			header,
			form
		)
	);
};

export default ProjectForm;

 

