import React, { useState } from 'react';
import { Project, SortBy } from './types';
import ProjectCard from './ProjectCard';
import './ProjectHome.css';
import './ProjectList.css';

interface ProjectListProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onProjectSelect,
  onProjectEdit,
  onProjectDelete
}) => {
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.DATE);
  const [filterText, setFilterText] = useState('');
  const [showOnlyMyProjects, setShowOnlyMyProjects] = useState(false);

  // Funzione per ottenere l'userId corrente (assumendo che sia salvato in localStorage)
  const getCurrentUserId = () => {
    // Questa funzione dovrebbe essere implementata in base al sistema di auth
    // Per ora usiamo un placeholder
    return localStorage.getItem('userId') || '';
  };

  // Filtra i progetti in base ai criteri di ricerca
  const filteredProjects = projects.filter(project => {
    const matchesText = project.name.toLowerCase().includes(filterText.toLowerCase()) ||
                       project.description.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesOwnership = !showOnlyMyProjects || project.owner === getCurrentUserId();
    
    return matchesText && matchesOwnership;
  });

  // Ordina i progetti in base al criterio selezionato
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case SortBy.DATE:
        return new Date(b.updatedAt || b.createdAt || '').getTime() - 
               new Date(a.updatedAt || a.createdAt || '').getTime();
      
      case SortBy.ACTOR:
        // Ordina per numero di attori coinvolti
        const aActors = new Set(a.phases.flatMap(p => p.tasks.flatMap(t => t.actors))).size;
        const bActors = new Set(b.phases.flatMap(p => p.tasks.flatMap(t => t.actors))).size;
        return bActors - aActors;
      
      case SortBy.PHASE:
        return a.phases.length - b.phases.length;
      
      case SortBy.STATUS:
        // Ordina per progresso (progetti con più task completate in cima)
        const aProgress = calculateProjectProgress(a);
        const bProgress = calculateProjectProgress(b);
        return bProgress - aProgress;
      
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const calculateProjectProgress = (project: Project): number => {
    const allTasks = project.phases.flatMap(p => p.tasks);
    if (allTasks.length === 0) return 0;
    
    const completedTasks = allTasks.filter(t => t.status === 'Conclusa').length;
    return (completedTasks / allTasks.length) * 100;
  };

  const getProjectStats = (project: Project) => {
    const allTasks = project.phases.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Conclusa').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'Attiva').length;
    const overdueTasks = allTasks.filter(t => t.status === 'In ritardo').length;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks,
      progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  };

  if (projects.length === 0) {
    return (
      <div className="project-list-empty">
        <h2>Nessun progetto trovato</h2>
        <p>Inizia creando il tuo primo progetto!</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      <div className="project-list-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca progetti..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="sort-select"
          >
            <option value={SortBy.DATE}>Data aggiornamento</option>
            <option value={SortBy.ACTOR}>Numero attori</option>
            <option value={SortBy.PHASE}>Numero fasi</option>
            <option value={SortBy.STATUS}>Progresso</option>
          </select>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showOnlyMyProjects}
              onChange={(e) => setShowOnlyMyProjects(e.target.checked)}
            />
            Solo i miei progetti
          </label>
        </div>
      </div>

      <div className="project-grid">
        {sortedProjects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            stats={getProjectStats(project)}
            onSelect={() => onProjectSelect(project)}
            onEdit={() => onProjectEdit(project)}
            onDelete={() => project._id && onProjectDelete(project._id)}
            isOwner={project.owner === getCurrentUserId()}
          />
        ))}
      </div>

      <div className="project-list-summary">
        <p>Mostrando {sortedProjects.length} di {projects.length} progetti</p>
      </div>
    </div>
  );
};

export default ProjectList; 