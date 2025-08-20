import React, { useState, useEffect } from 'react';
import ProjectService from './ProjectService.js';
import ProjectList from './ProjectList.js';
import ProjectDetail from './ProjectDetail.js';
import ProjectForm from './ProjectForm.js';
import './ProjectHome.css';

const h = React.createElement;

const ProjectHome = () => {
	const [projects, setProjects] = useState([]);
	const [selectedProject, setSelectedProject] = useState(null);
	const [currentView, setCurrentView] = useState('list');
	const [isCreating, setIsCreating] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadProjects();
	}, []);

	const loadProjects = async () => {
		try {
			setLoading(true);
			const projectsData = await ProjectService.getProjects();
			setProjects(projectsData);
			setError(null);
		} catch (err) {
			setError('Errore nel caricamento dei progetti');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleProjectSelect = (project) => {
		setSelectedProject(project);
		setCurrentView('detail');
	};

	const handleCreateProject = () => {
		setIsCreating(true);
		setSelectedProject(null);
		setCurrentView('form');
	};

	const handleEditProject = (project) => {
		setIsCreating(false);
		setSelectedProject(project);
		setCurrentView('form');
	};

	const handleProjectSaved = async (projectData) => {
		try {
			if (isCreating) {
				await ProjectService.createProject(projectData);
			} else if (selectedProject?._id) {
				await ProjectService.updateProject(selectedProject._id, projectData);
			}
			await loadProjects();
			setCurrentView('list');
			setSelectedProject(null);
		} catch (err) {
			setError('Errore nel salvataggio del progetto');
			console.error(err);
		}
	};

	const handleProjectDeleted = async (projectId) => {
		try {
			await ProjectService.deleteProject(projectId);
			await loadProjects();
			setCurrentView('list');
			setSelectedProject(null);
		} catch (err) {
			setError("Errore nell'eliminazione del progetto");
			console.error(err);
		}
	};

	const handleBackToList = () => {
		setCurrentView('list');
		setSelectedProject(null);
	};

	if (loading) {
		return h(
			'div',
			{ className: 'project-home' },
			h('div', { className: 'loading' }, 'Caricamento progetti...')
		);
	}

	const header = h(
		'header',
		{ className: 'project-header' },
		h('h1', null, 'Gestione Progetti'),
		currentView === 'list'
			? h(
				'button',
				{ className: 'btn btn-primary', onClick: handleCreateProject },
				'Nuovo Progetto'
			)
			: h(
				'button',
				{ className: 'btn btn-secondary', onClick: handleBackToList },
				'Torna alla Lista'
			)
	);

	const errorBanner = error
		? h(
			'div',
			{ className: 'error-message' },
			error,
			h('button', { onClick: () => setError(null) }, '×')
		)
		: null;

	const mainContent = h(
		'main',
		{ className: 'project-content' },
		currentView === 'list'
			? h(ProjectList, {
				projects,
				onProjectSelect: handleProjectSelect,
				onProjectEdit: handleEditProject,
				onProjectDelete: handleProjectDeleted,
			})
			: currentView === 'detail' && selectedProject
				? h(ProjectDetail, {
					project: selectedProject,
					onProjectUpdate: loadProjects,
					onProjectEdit: handleEditProject,
				})
				: h(ProjectForm, {
					project: isCreating ? null : selectedProject,
					onSave: handleProjectSaved,
					onCancel: handleBackToList,
				})
	);

	return h('div', { className: 'project-home' }, header, errorBanner, mainContent);
};

export default ProjectHome;

 

