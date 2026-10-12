import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faServer, 
  faDesktop, 
  faPuzzlePiece, 
  faPlus, 
  faXmark,
  faPen
} from '@fortawesome/free-solid-svg-icons';
import type { ScriptFile, ScriptType } from '../types';
import './ScriptTabBar.css';

interface ScriptTabBarProps {
  scripts: ScriptFile[];
  activeScriptId: string;
  onSelectScript: (id: string) => void;
  onNewScript: () => void;
  onRenameScript: (script: ScriptFile) => void;
  onDeleteScript: (script: ScriptFile) => void;
  isDark: boolean;
}

export const SCRIPT_TYPE_ICONS: Record<ScriptType, typeof faCode> = {
  Script: faCode,
  ServerScript: faServer,
  LocalScript: faDesktop,
  ModuleScript: faPuzzlePiece,
};

export const SCRIPT_TYPE_LABELS: Record<ScriptType, string> = {
  Script: 'Script',
  ServerScript: 'Server Script',
  LocalScript: 'Local Script',
  ModuleScript: 'Module Script',
};

const ScriptTabBar: React.FC<ScriptTabBarProps> = ({
  scripts,
  activeScriptId,
  onSelectScript,
  onNewScript,
  onRenameScript,
  onDeleteScript,
  isDark,
}) => {
  return (
    <div className={`script-tab-bar ${isDark ? 'dark' : 'light'}`}>
      <div className="tab-scroll-container">
        {scripts.map((script) => {
          const isActive = script.id === activeScriptId;
          const icon = SCRIPT_TYPE_ICONS[script.type] || faCode;

          return (
            <div
              key={script.id}
              className={`script-tab ${isActive ? 'active' : ''} type-${script.type}`}
              onClick={() => onSelectScript(script.id)}
              title={`${script.name} (${SCRIPT_TYPE_LABELS[script.type]})`}
            >
              <FontAwesomeIcon icon={icon} className="tab-icon" />
              <span className="tab-name">{script.name}</span>
              <span className="tab-type-badge">{script.type === 'ServerScript' ? 'Server' : script.type === 'LocalScript' ? 'Local' : script.type === 'ModuleScript' ? 'Module' : 'Standard'}</span>

              {/* Actions for non-default or custom files */}
              {!script.isDefault && (
                <div className="tab-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="tab-action-btn"
                    onClick={() => onRenameScript(script)}
                    title="Rename script"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button
                    className="tab-action-btn btn-delete"
                    onClick={() => onDeleteScript(script)}
                    title="Delete script"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Script Button */}
        <button
          className="new-tab-btn"
          onClick={onNewScript}
          title="Create a new script file"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );
};

export default ScriptTabBar;
