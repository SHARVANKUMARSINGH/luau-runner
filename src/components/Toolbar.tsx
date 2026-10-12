import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faStop, 
  faGlobe, 
  faTerminal, 
  faSun, 
  faMoon, 
  faSliders, 
  faPlus, 
  faBookOpen, 
  faCircleQuestion, 
  faDownload,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import type { ThemeMode } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  isExplorerOpen: boolean;
  onToggleExplorer: () => void;
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenNewScript: () => void;
  onOpenExamples: () => void;
  onOpenDocs: () => void;
  onDownloadZip: () => void;
}

const BRAND_ICON_URL = "https://photos.fife.usercontent.google.com/pw/AP1GczPth8vlKlqZOws4DhUfFhjQI3hXQEj9E3Jw1izEdXuhJCFEniM1icwGsA=w1024-h1024-s-no-gm?authuser=0";

const Toolbar: React.FC<ToolbarProps> = ({
  isRunning,
  onRun,
  onStop,
  isExplorerOpen,
  onToggleExplorer,
  isConsoleOpen,
  onToggleConsole,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenNewScript,
  onOpenExamples,
  onOpenDocs,
  onDownloadZip,
}) => {
  const isDark = theme === 'dark';
  const [imgError, setImgError] = useState(false);

  return (
    <header className={`app-toolbar ${isDark ? 'dark' : 'light'}`}>
      {/* Brand & Logo */}
      <div className="toolbar-brand">
        {!imgError ? (
          <img 
            src={BRAND_ICON_URL} 
            alt="Luau Runner Logo" 
            className="brand-logo" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="brand-logo-fallback">
            <FontAwesomeIcon icon={faBolt} />
          </div>
        )}
        <div className="brand-info">
          <span className="brand-title">LUAU RUNNER</span>
          <span className="brand-sub">Roblox Engine</span>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Primary Actions: Run & Stop */}
      <div className="toolbar-section primary-actions">
        {!isRunning ? (
          <button 
            className="toolbar-btn btn-run" 
            onClick={onRun} 
            title="Run active script (Ctrl + Enter)"
          >
            <FontAwesomeIcon icon={faPlay} />
            <span className="btn-text">Run</span>
          </button>
        ) : (
          <button 
            className="toolbar-btn btn-stop" 
            onClick={onStop} 
            title="Stop execution"
          >
            <FontAwesomeIcon icon={faStop} />
            <span className="btn-text">Stop</span>
          </button>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Editor & View Tools */}
      <div className="toolbar-section">
        {/* SMALL GLOBE/EARTH ICON TOGGLES EXPLORER */}
        <button 
          className={`toolbar-btn ${isExplorerOpen ? 'active' : ''}`}
          onClick={onToggleExplorer}
          title="Toggle Explorer hierarchy (Font Awesome Globe)"
        >
          <FontAwesomeIcon icon={faGlobe} />
          <span className="btn-text">Explorer</span>
        </button>

        {/* Toggle Console */}
        <button 
          className={`toolbar-btn ${isConsoleOpen ? 'active' : ''}`}
          onClick={onToggleConsole}
          title="Toggle Output Console"
        >
          <FontAwesomeIcon icon={faTerminal} />
          <span className="btn-text">Console</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Scripts & File Management */}
      <div className="toolbar-section">
        <button 
          className="toolbar-btn" 
          onClick={onOpenNewScript}
          title="Create new script (choose from 4 types)"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="btn-text">New Script</span>
        </button>

        <button 
          className="toolbar-btn" 
          onClick={onOpenExamples}
          title="Load working example scripts"
        >
          <FontAwesomeIcon icon={faBookOpen} />
          <span className="btn-text">Examples</span>
        </button>
      </div>

      <div className="toolbar-spacer" />

      {/* Right-side Utilities */}
      <div className="toolbar-section right-actions">
        <button 
          className="toolbar-btn" 
          onClick={onOpenDocs}
          title="Luau & Roblox API Documentation"
        >
          <FontAwesomeIcon icon={faCircleQuestion} />
          <span className="btn-text">Docs</span>
        </button>

        <button 
          className="toolbar-btn" 
          onClick={onDownloadZip}
          title="Download complete project ZIP file"
        >
          <FontAwesomeIcon icon={faDownload} />
          <span className="btn-text">Export ZIP</span>
        </button>

        <button 
          className="toolbar-btn" 
          onClick={onOpenSettings}
          title="Editor & Runner Settings"
        >
          <FontAwesomeIcon icon={faSliders} />
        </button>

        <button 
          className="toolbar-btn theme-toggle" 
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
