import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSliders, 
  faXmark,
  faSun,
  faMoon,
  faFont,
  faClock,
  faRotateLeft,
  faPalette,
  faGear,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import './Modal.css';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'general'>('appearance');

  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onUpdateSettings({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container modal-md ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={faSliders} className="modal-title-icon" />
            <span>Preferences & Settings</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Settings Tab Navigation */}
        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <FontAwesomeIcon icon={faPalette} />
            <span>Appearance</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FontAwesomeIcon icon={faGear} />
            <span>General</span>
          </button>
        </div>

        <div className="modal-body settings-body">
          {activeTab === 'appearance' ? (
            <>
              {/* Editor Engine (CodeMirror 6 vs Monaco Editor) */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">
                    <FontAwesomeIcon icon={faCode} /> Editor Engine
                  </span>
                  <span className="setting-desc">
                    By default: CodeMirror 6. Switch to Monaco for VS Code & Roblox Studio engine.
                  </span>
                </div>
                <div className="engine-toggle-group">
                  <button
                    type="button"
                    className={`engine-btn ${settings.editorEngine !== 'monaco' ? 'active' : ''}`}
                    onClick={() => handleChange('editorEngine', 'codemirror')}
                    title="CodeMirror 6 (Default) - Ultra-fast & lightweight"
                  >
                    CodeMirror (Default)
                  </button>
                  <button
                    type="button"
                    className={`engine-btn ${settings.editorEngine === 'monaco' ? 'active' : ''}`}
                    onClick={() => handleChange('editorEngine', 'monaco')}
                    title="Monaco Editor - Full VS Code / Roblox Studio Engine with IntelliSense"
                  >
                    Monaco
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">Color Theme</span>
                  <span className="setting-desc">Switch between Catppuccin Mocha Dark and Latte Light</span>
                </div>
                <div className="theme-toggle-group">
                  <button
                    type="button"
                    className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleChange('theme', 'dark')}
                  >
                    <FontAwesomeIcon icon={faMoon} /> Dark
                  </button>
                  <button
                    type="button"
                    className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleChange('theme', 'light')}
                  >
                    <FontAwesomeIcon icon={faSun} /> Light
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">
                    <FontAwesomeIcon icon={faFont} /> Font Size
                  </span>
                  <span className="setting-desc">Editor text size in pixels (11px - 22px)</span>
                </div>
                <div className="settings-control">
                  <input
                    type="range"
                    min="11"
                    max="22"
                    value={settings.fontSize}
                    onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                    className="range-input"
                  />
                  <span className="range-value">{settings.fontSize}px</span>
                </div>
              </div>

              {/* Tab Size */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">Tab Size</span>
                  <span className="setting-desc">Number of spaces for indentation</span>
                </div>
                <div className="settings-control">
                  <select
                    className="select-input"
                    value={settings.tabSize}
                    onChange={(e) => handleChange('tabSize', Number(e.target.value))}
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                  </select>
                </div>
              </div>

              {/* Line Numbers */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">Line Numbers</span>
                  <span className="setting-desc">Show gutter with line numbers in code editor</span>
                </div>
                <div className="settings-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.showLineNumbers}
                      onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Execution Timeout */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">
                    <FontAwesomeIcon icon={faClock} /> Execution Timeout
                  </span>
                  <span className="setting-desc">Maximum execution duration before cancelling infinite loops</span>
                </div>
                <div className="settings-control">
                  <select
                    className="select-input"
                    value={settings.executionTimeout}
                    onChange={(e) => handleChange('executionTimeout', Number(e.target.value))}
                  >
                    <option value={5000}>5 seconds</option>
                    <option value={10000}>10 seconds (Default)</option>
                    <option value={20000}>20 seconds</option>
                    <option value={30000}>30 seconds</option>
                  </select>
                </div>
              </div>

              {/* Auto Save */}
              <div className="settings-row">
                <div className="settings-label">
                  <span className="setting-name">Auto Save Scripts</span>
                  <span className="setting-desc">Persist all edits to browser LocalStorage automatically</span>
                </div>
                <div className="settings-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => handleChange('autoSave', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleReset}>
            <FontAwesomeIcon icon={faRotateLeft} /> Reset to Defaults
          </button>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
