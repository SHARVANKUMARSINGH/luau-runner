import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  ScriptFile, 
  ScriptType, 
  ConsoleMessage, 
  ExplorerNode, 
  AppSettings, 
  ScriptTemplate 
} from './types';
import { 
  loadScripts, 
  saveScripts, 
  loadSettings, 
  saveSettings, 
  loadActiveScriptId, 
  saveActiveScriptId 
} from './utils/storage';
import { createDefaultScripts, createNewScript } from './utils/scripts';
import { executeLuauScript, stopExecution, initLuauEngine } from './engine/luau-engine';
import { DataModel } from './engine/roblox-sim';

import Toolbar from './components/Toolbar';
import ScriptTabBar from './components/ScriptTabBar';
import CodeEditor from './components/CodeEditor';
import Console from './components/Console';
import Explorer from './components/Explorer';
import NewScriptModal from './components/NewScriptModal';
import RenameModal from './components/RenameModal';
import SettingsModal from './components/SettingsModal';
import DocsModal from './components/DocsModal';
import ExamplesModal from './components/ExamplesModal';

import './App.css';

export const App: React.FC = () => {
  // Settings & Theme
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const isDark = settings.theme === 'dark';

  // Scripts
  const [scripts, setScripts] = useState<ScriptFile[]>(() => {
    const saved = loadScripts();
    if (saved && saved.length > 0) return saved;
    return createDefaultScripts();
  });

  const [activeScriptId, setActiveScriptId] = useState<string>(() => {
    const savedId = loadActiveScriptId();
    if (savedId && scripts.some((s) => s.id === savedId)) return savedId;
    return scripts[0]?.id || 'default_script';
  });

  // UI Panels
  // EXPLORER MUST BE HIDDEN BY DEFAULT AS PER USER REQUIREMENT
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Console Messages
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);

  // DataModel Hierarchy Tree for Explorer
  const [tree, setTree] = useState<ExplorerNode | null>(() => {
    try {
      const dm = new DataModel();
      return dm.toExplorerNode();
    } catch {
      return null;
    }
  });

  // Modals
  const [isNewScriptModalOpen, setIsNewScriptModalOpen] = useState(false);
  const [renamingScript, setRenamingScript] = useState<ScriptFile | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);

  // Active Script reference
  const activeScript = useMemo(() => {
    return scripts.find((s) => s.id === activeScriptId) || scripts[0];
  }, [scripts, activeScriptId]);

  // Initialize Luau engine in background
  useEffect(() => {
    initLuauEngine().then((success) => {
      if (success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_init_${Date.now()}`,
            type: 'system',
            text: '✨ Luau WebAssembly Runtime initialized and ready.',
            timestamp: Date.now(),
          },
        ]);
      }
    });
  }, []);

  // Persist scripts
  useEffect(() => {
    if (settings.autoSave) {
      saveScripts(scripts);
    }
  }, [scripts, settings.autoSave]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  // Persist active script
  useEffect(() => {
    saveActiveScriptId(activeScriptId);
  }, [activeScriptId]);

  // Update script content
  const handleContentChange = useCallback((newContent: string) => {
    setScripts((prev) =>
      prev.map((s) =>
        s.id === activeScriptId ? { ...s, content: newContent, updatedAt: Date.now() } : s
      )
    );
  }, [activeScriptId]);

  // Run script
  const handleRun = useCallback(async () => {
    if (!activeScript || isRunning) return;

    setIsRunning(true);
    setIsConsoleOpen(true);

    await executeLuauScript(
      activeScript,
      scripts,
      {
        onOutput: (msg) => {
          setMessages((prev) => [...prev, msg]);
        },
        onComplete: () => {
          setIsRunning(false);
        },
        onError: (errMsg) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_${Date.now()}`,
              type: 'error',
              text: errMsg,
              timestamp: Date.now(),
              source: activeScript.name,
            },
          ]);
          setIsRunning(false);
        },
        onTreeSync: (newTree) => {
          setTree(newTree);
        },
      },
      settings.executionTimeout
    );
  }, [activeScript, scripts, isRunning, settings.executionTimeout]);

  // Stop script
  const handleStop = useCallback(() => {
    stopExecution();
    setIsRunning(false);
  }, []);

  // Clear console
  const handleClearConsole = useCallback(() => {
    setMessages([]);
  }, []);

  // Reset DataModel hierarchy
  const handleResetHierarchy = useCallback(() => {
    try {
      const dm = new DataModel();
      setTree(dm.toExplorerNode());
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_reset_${Date.now()}`,
          type: 'system',
          text: '🔄 DataModel hierarchy reset to default state.',
          timestamp: Date.now(),
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Create new script
  const handleCreateScript = useCallback((name: string, type: ScriptType) => {
    const newScript = createNewScript(name, type);
    setScripts((prev) => [...prev, newScript]);
    setActiveScriptId(newScript.id);
  }, []);

  // Rename script
  const handleRenameScript = useCallback((scriptId: string, newName: string) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, name: newName, updatedAt: Date.now() } : s))
    );
  }, []);

  // Delete script
  const handleDeleteScript = useCallback((script: ScriptFile) => {
    if (confirm(`Are you sure you want to delete "${script.name}"?`)) {
      setScripts((prev) => {
        const filtered = prev.filter((s) => s.id !== script.id);
        if (filtered.length === 0) {
          // If all scripts are deleted, automatically create a fresh default script
          const freshScript = createNewScript('Script 1', 'Script', '-- New Script\nprint("Hello from Luau!")\n');
          setActiveScriptId(freshScript.id);
          return [freshScript];
        }
        if (activeScriptId === script.id) {
          setActiveScriptId(filtered[0]?.id || 'default_script');
        }
        return filtered;
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_del_${Date.now()}`,
          type: 'info',
          text: `🗑️ Deleted script "${script.name}"`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [activeScriptId]);

  // Delete current active script
  const handleDeleteActiveScript = useCallback(() => {
    if (activeScript) {
      handleDeleteScript(activeScript);
    }
  }, [activeScript, handleDeleteScript]);

  // Load example template
  const handleLoadTemplate = useCallback((tpl: ScriptTemplate) => {
    // Check if a script with this name already exists
    const existing = scripts.find((s) => s.name === tpl.name);
    if (existing) {
      setActiveScriptId(existing.id);
      return;
    }

    const newScript = createNewScript(tpl.name, tpl.type, tpl.content);
    setScripts((prev) => [...prev, newScript]);
    setActiveScriptId(newScript.id);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys_tpl_${Date.now()}`,
        type: 'info',
        text: `Loaded example: "${tpl.name}" (${tpl.type})`,
        timestamp: Date.now(),
      },
    ]);
  }, [scripts]);

  // Export / Download complete project ZIP
  const handleDownloadZip = useCallback(async () => {
    try {
      // Trigger download of the built project zip archive
      const response = await fetch('/luau-runner.zip');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'luau-runner.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: download current scripts as JSON bundle
        const exportData = {
          name: 'Luau Runner Project',
          exportedAt: new Date().toISOString(),
          scripts,
          settings,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'luau-scripts-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // JSON backup fallback
      const exportData = {
        name: 'Luau Runner Project',
        exportedAt: new Date().toISOString(),
        scripts,
        settings,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'luau-scripts-backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [scripts, settings]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveScripts(scripts);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_save_${Date.now()}`,
            type: 'system',
            text: '💾 Scripts saved to browser storage.',
            timestamp: Date.now(),
          },
        ]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, scripts]);

  return (
    <div className={`app-root ${isDark ? 'dark' : 'light'}`}>
      {/* Top Runner Toolbar with Real Font Awesome Icons */}
      <Toolbar
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        isExplorerOpen={isExplorerOpen}
        onToggleExplorer={() => setIsExplorerOpen((prev) => !prev)}
        isConsoleOpen={isConsoleOpen}
        onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
        theme={settings.theme}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenNewScript={() => setIsNewScriptModalOpen(true)}
        onDeleteActiveScript={handleDeleteActiveScript}
        onOpenExamples={() => setIsExamplesModalOpen(true)}
        onOpenDocs={() => setIsDocsModalOpen(true)}
        onDownloadZip={handleDownloadZip}
      />

      {/* Main Layout Area */}
      <div className="app-main-area">
        {/* Editor Area: occupies all available space when Explorer is closed */}
        <div className="editor-console-column">
          {/* Script Type Tab Bar (Script, Server Script, Local Script, Module Script) */}
          <ScriptTabBar
            scripts={scripts}
            activeScriptId={activeScriptId}
            onSelectScript={setActiveScriptId}
            onNewScript={() => setIsNewScriptModalOpen(true)}
            onRenameScript={(script) => setRenamingScript(script)}
            onDeleteScript={handleDeleteScript}
            isDark={isDark}
          />

          {/* CodeMirror 6 Code Editor */}
          {activeScript && (
            <CodeEditor
              key={activeScript.id}
              value={activeScript.content}
              onChange={handleContentChange}
              onRun={handleRun}
              isDark={isDark}
              fontSize={settings.fontSize}
              isRunning={isRunning}
              scriptType={activeScript.type}
              scriptName={activeScript.name}
            />
          )}

          {/* Collapsible Output Console */}
          <Console
            messages={messages}
            onClear={handleClearConsole}
            isOpen={isConsoleOpen}
            onToggle={() => setIsConsoleOpen((prev) => !prev)}
            isDark={isDark}
          />
        </div>

        {/* Explorer Drawer: HIDDEN BY DEFAULT, toggled by Globe icon in toolbar */}
        <Explorer
          tree={tree}
          isOpen={isExplorerOpen}
          onClose={() => setIsExplorerOpen(false)}
          onRefresh={handleResetHierarchy}
          isDark={isDark}
        />
      </div>

      {/* Modals */}
      <NewScriptModal
        isOpen={isNewScriptModalOpen}
        onClose={() => setIsNewScriptModalOpen(false)}
        onCreate={handleCreateScript}
        isDark={isDark}
      />

      <RenameModal
        isOpen={renamingScript !== null}
        script={renamingScript}
        onClose={() => setRenamingScript(null)}
        onRename={handleRenameScript}
        isDark={isDark}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onUpdateSettings={setSettings}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <DocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        isDark={isDark}
      />

      <ExamplesModal
        isOpen={isExamplesModalOpen}
        onClose={() => setIsExamplesModalOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        isDark={isDark}
      />
    </div>
  );
};

export default App;
