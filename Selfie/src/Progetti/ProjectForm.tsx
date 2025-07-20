import React, { useState, useEffect } from 'react';
import { Project, Phase, Task } from './types';

interface ProjectFormProps {
  project: Project | null;
  onSave: (projectData: Partial<Project>) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    phases: [] as Phase[]
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        notes: project.notes,
        phases: project.phases
      });
    }
  }, [project]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPhase = () => {
    const newPhase: Phase = {
      _id: Date.now().toString(),
      name: '',
      tasks: []
    };
    
    setFormData(prev => ({
      ...prev,
      phases: [...prev.phases, newPhase]
    }));
  };

  const handlePhaseChange = (phaseIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      phases: prev.phases.map((phase, index) => 
        index === phaseIndex 
          ? { ...phase, [field]: value }
          : phase
      )
    }));
  };

  const handleRemovePhase = (phaseIndex: number) => {
    setFormData(prev => ({
      ...prev,
      phases: prev.phases.filter((_, index) => index !== phaseIndex)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Il nome del progetto è obbligatorio');
      return;
    }

    onSave(formData);
  };

  const isEditing = !!project;

  return (
    <div className="project-form-overlay">
      <div className="project-form">
        <header className="form-header">
          <h2>{isEditing ? 'Modifica Progetto' : 'Nuovo Progetto'}</h2>
          <button className="btn-close" onClick={onCancel}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-section">
            <h3>Informazioni Generali</h3>
            
            <div className="form-group">
              <label htmlFor="project-name">Nome Progetto *</label>
              <input
                id="project-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Inserisci il nome del progetto"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="project-description">Descrizione</label>
              <textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrivi brevemente il progetto"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="project-notes">Note</label>
              <textarea
                id="project-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Note aggiuntive sul progetto"
                rows={4}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Fasi del Progetto</h3>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleAddPhase}
              >
                Aggiungi Fase
              </button>
            </div>

            {formData.phases.length === 0 ? (
              <p className="no-phases">
                Nessuna fase aggiunta. Clicca "Aggiungi Fase" per iniziare.
              </p>
            ) : (
              <div className="phases-list">
                {formData.phases.map((phase, index) => (
                  <div key={phase._id} className="phase-item">
                    <div className="phase-header">
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                        placeholder={`Nome fase ${index + 1}`}
                        className="phase-name-input"
                      />
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemovePhase(index)}
                        title="Rimuovi fase"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    {phase.tasks.length > 0 && (
                      <div className="phase-tasks-summary">
                        <small>{phase.tasks.length} task in questa fase</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Salva Modifiche' : 'Crea Progetto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm; 