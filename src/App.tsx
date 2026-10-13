import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import MonacoEditor from './components/MonacoEditor';
import Console from './components/Console';
import Explorer from './components/Explorer';
import NewScriptModal from './components/NewScriptModal';
import RenameModal from './components/RenameModal';
import SettingsModal from './components/SettingsModal';
import DocsModal from './components/DocsModal';
import ExamplesModal from './components/ExamplesModal';
import VirtualMouse from './components/VirtualMouse';
import AiAgentModal from './components/AiAgentModal';
import PlayViewport from './components/PlayViewport';
import { RobloxSimulationWorld } from './engine/roblox-3d/simulation';
import { RobloxWebGLEngine } from './engine/roblox-webgl/webgl-engine';
import type { PlayMode } from './engine/roblox-3d/simulation';
import { useDialog } from './context/DialogContext';

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

  // Execution & Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('solo');
  const world = useMemo(() => new RobloxSimulationWorld(), []);
  const webglEngineRef = useRef<RobloxWebGLEngine | null>(null);

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
  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);

  const { showConfirm } = useDialog();

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

  // Play 3D simulation with Roblox Avatar & Server/Client runtime
  const handlePlay = useCallback(
    async (selectedMode: PlayMode = 'solo') => {
      if (!activeScript || isRunning || isPlaying) return;

      world.mode = selectedMode;
      world.respawnCharacter();
      setIsPlaying(true);
      setIsRunning(true);
      setPlayMode(selectedMode);

      setMessages((prev) => [
        ...prev,
        {
          id: `sys_play_${Date.now()}`,
          type: 'system',
          text: `🎮 Launching 3D Roblox Studio ${selectedMode === 'solo' ? 'Play Solo' : 'Server Run'} with authentic client & server simulation...`,
          timestamp: Date.now(),
        },
      ]);

      await executeLuauScript(
        activeScript,
        scripts,
        {
          onOutput: (msg) => {
            setMessages((prev) => [...prev, msg]);
          },
          onComplete: () => {
            // Simulation keeps running in 3D viewport until user clicks Stop
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
          },
          onTreeSync: (newTree) => {
            setTree(newTree);
          },
          on3DSync: (partData) => {
            if (webglEngineRef.current) {
              webglEngineRef.current.syncPartFromLuau({
                id: partData.name,
                name: partData.name,
                position: partData.position,
                size: partData.size,
                color: partData.color,
                anchored: partData.anchored ?? true,
                transparency: partData.transparency ?? 0,
              });
            }
            world.syncPartFromLuau(
              partData.name,
              partData.position,
              partData.size,
              partData.color,
              partData.anchored,
              partData.transparency
            );
          },
          on3DRemovePart: (name) => {
            if (webglEngineRef.current) {
              webglEngineRef.current.removePart(name);
            }
            world.removePart(name);
          },
          onCharacterSync: (charData) => {
            if (webglEngineRef.current) {
              if (charData.walkSpeed !== undefined) {
                webglEngineRef.current.player.walkSpeed = charData.walkSpeed;
              }
              if (charData.health !== undefined) {
                webglEngineRef.current.player.health = charData.health;
                webglEngineRef.current.updateNameTag();
              }
              if (charData.maxHealth !== undefined) {
                webglEngineRef.current.player.maxHealth = charData.maxHealth;
                webglEngineRef.current.updateNameTag();
              }
            }
            if (charData.walkSpeed !== undefined) {
              world.character.walkSpeed = charData.walkSpeed;
            }
            if (charData.health !== undefined) {
              world.character.health = charData.health;
            }
            if (charData.maxHealth !== undefined) {
              world.character.maxHealth = charData.maxHealth;
            }
          },
        },
        settings.executionTimeout
      );
    },
    [activeScript, scripts, isRunning, isPlaying, world, settings.executionTimeout]
  );

  // Run script (server-only in background)
  const handleRun = useCallback(async () => {
    if (!activeScript || isRunning || isPlaying) return;

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
        on3DSync: (partData) => {
          if (webglEngineRef.current) {
            webglEngineRef.current.syncPartFromLuau({
              id: partData.name,
              name: partData.name,
              position: partData.position,
              size: partData.size,
              color: partData.color,
              anchored: partData.anchored ?? true,
              transparency: partData.transparency ?? 0,
            });
          }
          world.syncPartFromLuau(
            partData.name,
            partData.position,
            partData.size,
            partData.color,
            partData.anchored,
            partData.transparency
          );
        },
        on3DRemovePart: (name) => {
          if (webglEngineRef.current) {
            webglEngineRef.current.removePart(name);
          }
          world.removePart(name);
        },
        onCharacterSync: (charData) => {
          if (webglEngineRef.current) {
            if (charData.walkSpeed !== undefined) {
              webglEngineRef.current.player.walkSpeed = charData.walkSpeed;
            }
            if (charData.health !== undefined) {
              webglEngineRef.current.player.health = charData.health;
              webglEngineRef.current.updateNameTag();
            }
          }
          if (charData.walkSpeed !== undefined) {
            world.character.walkSpeed = charData.walkSpeed;
          }
          if (charData.health !== undefined) {
            world.character.health = charData.health;
          }
        },
      },
      settings.executionTimeout
    );
  }, [activeScript, scripts, isRunning, isPlaying, world, settings.executionTimeout]);

  // Stop script & 3D Play session
  const handleStop = useCallback(() => {
    stopExecution();
    setIsRunning(false);
    setIsPlaying(false);
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
  const handleDeleteScript = useCallback(async (script: ScriptFile) => {
    const confirmed = await showConfirm({
      title: 'Delete Script',
      message: `Are you sure you want to delete "${script.name}"? This action cannot be undone.`,
      confirmText: 'Delete Script',
      danger: true,
    });
    if (confirmed) {
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
  }, [activeScriptId, showConfirm]);

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
      if (e.key === 'F5') {
        e.preventDefault();
        if (e.shiftKey) {
          handleStop();
        } else {
          handlePlay('solo');
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePlay('solo');
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
  }, [handlePlay, handleRun, handleStop, scripts]);

  return (
    <div className={`app-root ${isDark ? 'dark' : 'light'}`}>
      {/* Top Runner Toolbar with Real Font Awesome Icons */}
      <Toolbar
        isRunning={isRunning}
        isPlaying={isPlaying}
        onPlay={() => handlePlay('solo')}
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
        onOpenAiAgent={() => setIsAiAgentModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="app-main-area">
        {/* Editor Area or 3D Play Viewport */}
        <div className="editor-console-column">
          {isPlaying ? (
            /* 3D Roblox Studio Play Simulation Viewport */
            <PlayViewport
              world={world}
              messages={messages}
              mode={playMode}
              onStop={handleStop}
              onToggleMode={(newMode) => {
                setPlayMode(newMode);
                world.mode = newMode;
                if (webglEngineRef.current) {
                  webglEngineRef.current.mode = newMode;
                }
              }}
              engineRefProp={webglEngineRef}
              onSendMessage={(text) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `chat_${Date.now()}`,
                    type: 'output',
                    text: `[Chat] Player1: ${text}`,
                    timestamp: Date.now(),
                    source: 'Chat',
                  },
                ]);
              }}
            />
          ) : (
            <>
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

              {/* Code Editor: CodeMirror 6 (Default) or Monaco Editor (Selectable in Appearance tab) */}
              {activeScript && (
                settings.editorEngine === 'monaco' ? (
                  <MonacoEditor
                    key={`monaco_${activeScript.id}`}
                    value={activeScript.content}
                    onChange={handleContentChange}
                    onRun={handleRun}
                    isDark={isDark}
                    fontSize={settings.fontSize}
                    isRunning={isRunning}
                    scriptType={activeScript.type}
                    scriptName={activeScript.name}
                  />
                ) : (
                  <CodeEditor
                    key={`cm_${activeScript.id}`}
                    value={activeScript.content}
                    onChange={handleContentChange}
                    onRun={handleRun}
                    isDark={isDark}
                    fontSize={settings.fontSize}
                    isRunning={isRunning}
                    scriptType={activeScript.type}
                    scriptName={activeScript.name}
                  />
                )
              )}
            </>
          )}

          {/* Dedicated Roblox Studio Docked Output Window - Always available across Play and Edit modes */}
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

      {/* Luau AI Agent Modal (OpenRouter integration) */}
      <AiAgentModal
        isOpen={isAiAgentModalOpen}
        onClose={() => setIsAiAgentModalOpen(false)}
        activeScript={activeScript}
        onUpdateActiveScriptContent={(newContent) => {
          if (activeScript) {
            handleContentChange(newContent);
          }
        }}
        onCreateNewScript={(name, type, initialContent) => {
          const newScript = createNewScript(name, type, initialContent);
          setScripts((prev) => [...prev, newScript]);
          setActiveScriptId(newScript.id);
        }}
        isDark={isDark}
      />

      {/* On-Screen Virtual Mouse (Touch-to-Drag PC Trackpad & Cursor) */}
      <VirtualMouse
        isEnabled={settings.virtualMouse ?? false}
        isDark={isDark}
      />
    </div>
  );
};

export default App;
