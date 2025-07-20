import React, { useState, useEffect } from 'react';
import { Project, ViewMode } from './types';
import ProjectService from './ProjectService';
import ProjectList from './ProjectList';
import ProjectDetail from './ProjectDetail';
import ProjectForm from './ProjectForm';
import './ProjectHome.css';

const ProjectHome: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'form'>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('detail');
  };

  const handleCreateProject = () => {
    setIsCreating(true);
    setSelectedProject(null);
    setCurrentView('form');
  };

  const handleEditProject = (project: Project) => {
    setIsCreating(false);
    setSelectedProject(project);
    setCurrentView('form');
  };

  const handleProjectSaved = async (projectData: Partial<Project>) => {
    try {
      if (isCreating) {
        await ProjectService.createProject(projectData as Omit<Project, '_id' | 'owner' | 'createdAt' | 'updatedAt'>);
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

  const handleProjectDeleted = async (projectId: string) => {
    try {
      await ProjectService.deleteProject(projectId);
      await loadProjects();
      setCurrentView('list');
      setSelectedProject(null);
    } catch (err) {
      setError('Errore nell\'eliminazione del progetto');
      console.error(err);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedProject(null);
  };

  if (loading) {
    return (
      <div className="project-home">
        <div className="loading">Caricamento progetti...</div>
      </div>
    );
  }

  return (
    <div className="project-home">
      <header className="project-header">
        <h1>Gestione Progetti</h1>
        {currentView === 'list' && (
          <button 
            className="btn btn-primary"
            onClick={handleCreateProject}
          >
            Nuovo Progetto
          </button>
        )}
        {currentView !== 'list' && (
          <button 
            className="btn btn-secondary"
            onClick={handleBackToList}
          >
            Torna alla Lista
          </button>
        )}
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="project-content">
        {currentView === 'list' && (
          <ProjectList 
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onProjectEdit={handleEditProject}
            onProjectDelete={handleProjectDeleted}
          />
        )}

        {currentView === 'detail' && selectedProject && (
          <ProjectDetail 
            project={selectedProject}
            onProjectUpdate={loadProjects}
            onProjectEdit={handleEditProject}
          />
        )}

        {currentView === 'form' && (
          <ProjectForm 
            project={isCreating ? null : selectedProject}
            onSave={handleProjectSaved}
            onCancel={handleBackToList}
          />
        )}
      </main>
    </div>
  );
};

export default ProjectHome; 