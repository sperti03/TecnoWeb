import React, { useState, useEffect } from 'react';
import { Task, Project, TaskStatus } from './types';

interface TaskFormProps {
  task: Task | null;
  project: Project;
  onSave: (taskData: Partial<Task>, phaseId?: string) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  project,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    actors: [] as string[],
    phase: '',
    subphase: '',
    start: '',
    end: '',
    input: '',
    output: '',
    milestone: false,
    milestoneDate: '',
    dependencies: [] as string[],
    phaseId: ''
  });

  const [actorInput, setActorInput] = useState('');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Raccoglie tutte le task disponibili per le dipendenze
    const allTasks = project.phases.flatMap(p => p.tasks);
    setAvailableTasks(allTasks.filter(t => t._id !== task?._id));

    if (task) {
      // Modalità modifica
      setFormData({
        name: task.name,
        description: task.description,
        actors: task.actors,
        phase: task.phase,
        subphase: task.subphase,
        start: task.start,
        end: task.end,
        input: task.input,
        output: task.output,
        milestone: task.milestone,
        milestoneDate: task.milestoneDate || '',
        dependencies: task.dependencies,
        phaseId: '' // Non necessario per la modifica
      });
    } else {
      // Modalità creazione - preimposta le date
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      setFormData({
        name: '',
        description: '',
        actors: [],
        phase: '',
        subphase: '',
        start: today.toISOString().split('T')[0],
        end: nextWeek.toISOString().split('T')[0],
        input: '',
        output: '',
        milestone: false,
        milestoneDate: '',
        dependencies: [],
        phaseId: project.phases[0]?._id || ''
      });
    }
  }, [task, project]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddActor = () => {
    if (actorInput.trim() && !formData.actors.includes(actorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        actors: [...prev.actors, actorInput.trim()]
      }));
      setActorInput('');
    }
  };

  const handleRemoveActor = (actorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      actors: prev.actors.filter(actor => actor !== actorToRemove)
    }));
  };

  const handleDependencyToggle = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.includes(taskId)
        ? prev.dependencies.filter(id => id !== taskId)
        : [...prev.dependencies, taskId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Il nome della task è obbligatorio');
      return;
    }

    if (!formData.start || !formData.end) {
      alert('Le date di inizio e fine sono obbligatorie');
      return;
    }

    if (new Date(formData.start) >= new Date(formData.end)) {
      alert('La data di fine deve essere successiva alla data di inizio');
      return;
    }

    if (!task && !formData.phaseId) {
      alert('Seleziona una fase per la nuova task');
      return;
    }

    const taskData: Partial<Task> = {
      name: formData.name,
      description: formData.description,
      actors: formData.actors,
      phase: formData.phase,
      subphase: formData.subphase,
      start: formData.start,
      end: formData.end,
      input: formData.input,
      output: formData.output,
      milestone: formData.milestone,
      milestoneDate: formData.milestone ? formData.milestoneDate : undefined,
      dependencies: formData.dependencies
    };

    onSave(taskData, formData.phaseId);
  };

  const isEditing = !!task;

  return (
    <div className="task-form-overlay">
      <div className="task-form">
        <header className="form-header">
          <h2>{isEditing ? 'Modifica Task' : 'Nuova Task'}</h2>
          <button className="btn-close" onClick={onCancel}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-section">
            <h3>Informazioni Generali</h3>
            
            <div className="form-group">
              <label htmlFor="task-name">Nome Task *</label>
              <input
                id="task-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Inserisci il nome della task"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-description">Descrizione</label>
              <textarea
                id="task-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrivi la task"
                rows={3}
              />
            </div>

            {!isEditing && (
              <div className="form-group">
                <label htmlFor="task-phase">Fase *</label>
                <select
                  id="task-phase"
                  value={formData.phaseId}
                  onChange={(e) => handleInputChange('phaseId', e.target.value)}
                  required
                >
                  <option value="">Seleziona una fase</option>
                  {project.phases.map((phase) => (
                    <option key={phase._id} value={phase._id}>
                      {phase.name || `Fase ${project.phases.indexOf(phase) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-phase-name">Nome Fase</label>
                <input
                  id="task-phase-name"
                  type="text"
                  value={formData.phase}
                  onChange={(e) => handleInputChange('phase', e.target.value)}
                  placeholder="Nome della fase"
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-subphase">Sottofase</label>
                <input
                  id="task-subphase"
                  type="text"
                  value={formData.subphase}
                  onChange={(e) => handleInputChange('subphase', e.target.value)}
                  placeholder="Nome della sottofase"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Date</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-start">Data Inizio *</label>
                <input
                  id="task-start"
                  type="date"
                  value={formData.start}
                  onChange={(e) => handleInputChange('start', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-end">Data Fine *</label>
                <input
                  id="task-end"
                  type="date"
                  value={formData.end}
                  onChange={(e) => handleInputChange('end', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.milestone}
                  onChange={(e) => handleInputChange('milestone', e.target.checked)}
                />
                Questa è una milestone
              </label>
            </div>

            {formData.milestone && (
              <div className="form-group">
                <label htmlFor="milestone-date">Data Milestone</label>
                <input
                  id="milestone-date"
                  type="date"
                  value={formData.milestoneDate}
                  onChange={(e) => handleInputChange('milestoneDate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Attori</h3>
            
            <div className="actors-input">
              <input
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                placeholder="Inserisci email o ID utente"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActor())}
              />
              <button type="button" onClick={handleAddActor} className="btn btn-secondary">
                Aggiungi
              </button>
            </div>

            {formData.actors.length > 0 && (
              <div className="actors-list">
                {formData.actors.map((actor) => (
                  <div key={actor} className="actor-item">
                    <span>{actor}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveActor(actor)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Input e Output</h3>
            
            <div className="form-group">
              <label htmlFor="task-input">Input</label>
              <textarea
                id="task-input"
                value={formData.input}
                onChange={(e) => handleInputChange('input', e.target.value)}
                placeholder="Descrivi l'input necessario per questa task"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-output">Output Atteso</label>
              <textarea
                id="task-output"
                value={formData.output}
                onChange={(e) => handleInputChange('output', e.target.value)}
                placeholder="Descrivi l'output atteso da questa task"
                rows={3}
              />
            </div>
          </div>

          {availableTasks.length > 0 && (
            <div className="form-section">
              <h3>Dipendenze</h3>
              
              <div className="dependencies-list">
                {availableTasks.map((availableTask) => (
                  <label key={availableTask._id} className="dependency-item">
                    <input
                      type="checkbox"
                      checked={formData.dependencies.includes(availableTask._id!)}
                      onChange={() => handleDependencyToggle(availableTask._id!)}
                    />
                    <span className="dependency-name">{availableTask.name}</span>
                    <small className="dependency-phase">({availableTask.phase})</small>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Salva Modifiche' : 'Crea Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 