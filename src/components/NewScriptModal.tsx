import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faServer, 
  faDesktop, 
  faPuzzlePiece, 
  faXmark,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import type { ScriptType } from '../types';
import './Modal.css';

interface NewScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: ScriptType) => void;
  isDark: boolean;
}

const SCRIPT_TYPE_OPTIONS: Array<{
  type: ScriptType;
  label: string;
  icon: typeof faCode;
  description: string;
}> = [
  {
    type: 'Script',
    label: 'Script (Standard)',
    icon: faCode,
    description: 'Runs in a neutral/standard context. Ideal for algorithms and general Luau scripts.',
  },
  {
    type: 'ServerScript',
    label: 'Server Script',
    icon: faServer,
    description: 'Runs in the simulated Server context. Has access to ServerStorage and ServerScriptService.',
  },
  {
    type: 'LocalScript',
    label: 'Local Script',
    icon: faDesktop,
    description: 'Runs in simulated Client context. Has access to Players.LocalPlayer and StarterGui.',
  },
  {
    type: 'ModuleScript',
    label: 'Module Script',
    icon: faPuzzlePiece,
    description: 'Returns a table or function that can be required by other scripts using require().',
  },
];

const NewScriptModal: React.FC<NewScriptModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isDark,
}) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ScriptType>('Script');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a script name');
      return;
    }
    onCreate(trimmed, selectedType);
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={faPlus} className="modal-title-icon" />
            <span>Create New Script</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Script Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. CombatController, MathLib, PlayerHandler"
              autoFocus
            />
            {error && <span className="form-error">{error}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Script Type (Select one of the 4 types)</label>
            <div className="script-type-grid">
              {SCRIPT_TYPE_OPTIONS.map((opt) => (
                <div
                  key={opt.type}
                  className={`type-option-card ${selectedType === opt.type ? 'selected' : ''}`}
                  onClick={() => setSelectedType(opt.type)}
                >
                  <div className="type-card-header">
                    <FontAwesomeIcon icon={opt.icon} className={`type-card-icon type-${opt.type}`} />
                    <span className="type-card-label">{opt.label}</span>
                  </div>
                  <p className="type-card-desc">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Script
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewScriptModal;
