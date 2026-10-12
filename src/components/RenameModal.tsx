import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { ScriptFile } from '../types';
import './Modal.css';

interface RenameModalProps {
  isOpen: boolean;
  script: ScriptFile | null;
  onClose: () => void;
  onRename: (scriptId: string, newName: string) => void;
  isDark: boolean;
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  script,
  onClose,
  onRename,
  isDark,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (script) {
      setName(script.name);
      setError('');
    }
  }, [script]);

  if (!isOpen || !script) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Script name cannot be empty');
      return;
    }
    onRename(script.id, trimmed);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container modal-sm ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={faPen} className="modal-title-icon" />
            <span>Rename Script</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">New Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <span className="form-error">{error}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
