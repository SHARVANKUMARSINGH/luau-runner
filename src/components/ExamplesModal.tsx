import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen, 
  faXmark, 
  faArrowRight,
  faCode,
  faServer,
  faDesktop,
  faPuzzlePiece
} from '@fortawesome/free-solid-svg-icons';
import type { ScriptTemplate, ScriptType } from '../types';
import { EXAMPLE_TEMPLATES } from '../utils/scripts';
import './Modal.css';

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: ScriptTemplate) => void;
  isDark: boolean;
}

const TYPE_ICONS: Record<ScriptType, typeof faCode> = {
  Script: faCode,
  ServerScript: faServer,
  LocalScript: faDesktop,
  ModuleScript: faPuzzlePiece,
};

const ExamplesModal: React.FC<ExamplesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container modal-md ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={faBookOpen} className="modal-title-icon" />
            <span>Working Luau Examples</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Choose an example script to load into your editor. You can run it immediately or customize it.
          </p>

          <div className="examples-list">
            {EXAMPLE_TEMPLATES.map((tpl) => (
              <div 
                key={tpl.id} 
                className="example-card"
                onClick={() => {
                  onLoadTemplate(tpl);
                  onClose();
                }}
              >
                <div className="example-header">
                  <div className="example-title-area">
                    <FontAwesomeIcon icon={TYPE_ICONS[tpl.type]} className={`example-icon type-${tpl.type}`} />
                    <span className="example-name">{tpl.name}</span>
                  </div>
                  <span className="example-badge">{tpl.type}</span>
                </div>
                <p className="example-desc">{tpl.description}</p>
                <div className="example-footer">
                  <span className="load-action">
                    Load into Editor <FontAwesomeIcon icon={faArrowRight} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamplesModal;
