import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { undo, redo, toggleComment } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faServer, 
  faDesktop, 
  faPuzzlePiece, 
  faMagnifyingGlass,
  faKeyboard,
  faRotateLeft,
  faRotateRight,
  faCommentDots,
  faWandMagicSparkles,
  faCopy,
  faTrashCan,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import type { ScriptType } from '../types';
import { 
  createEditorState, 
  themeCompartment, 
  darkTheme, 
  lightTheme, 
  darkHighlightStyle, 
  lightHighlightStyle,
  formatCodeCommand
} from '../editor/setup';
import './CodeEditor.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  isDark: boolean;
  fontSize?: number;
  isRunning?: boolean;
  scriptType?: ScriptType;
  scriptName?: string;
}

const CONTEXT_ICONS: Record<ScriptType, typeof faCode> = {
  Script: faCode,
  ServerScript: faServer,
  LocalScript: faDesktop,
  ModuleScript: faPuzzlePiece,
};

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  onRun, 
  isDark, 
  fontSize = 14,
  isRunning = false,
  scriptType = 'Script',
  scriptName = 'Script'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const currentValueRef = useRef(value);

  // Alive Editor state indicators
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [docStats, setDocStats] = useState({ lines: 1, chars: value.length });
  const [matchInfo, setMatchInfo] = useState<{ word: string; count: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 1800);
  }, []);

  const handleUndo = useCallback(() => {
    if (viewRef.current) {
      undo(viewRef.current);
      viewRef.current.focus();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (viewRef.current) {
      redo(viewRef.current);
      viewRef.current.focus();
    }
  }, []);

  const handleFind = useCallback(() => {
    if (viewRef.current) {
      openSearchPanel(viewRef.current);
      viewRef.current.focus();
    }
  }, []);

  const handleToggleComment = useCallback(() => {
    if (viewRef.current) {
      toggleComment(viewRef.current);
      viewRef.current.focus();
    }
  }, []);

  const handleFormat = useCallback(() => {
    if (viewRef.current) {
      const prev = viewRef.current.state.doc.toString();
      formatCodeCommand(viewRef.current);
      const after = viewRef.current.state.doc.toString();
      viewRef.current.focus();
      if (prev !== after) {
        showToast('✨ Formatted Luau code!');
      } else {
        showToast('✨ Code is already clean!');
      }
    }
  }, [showToast]);

  const handleCopyAll = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        showToast('📋 Copied to clipboard!');
      }).catch(() => {
        showToast('❌ Copy failed');
      });
    } else {
      showToast('⚠️ Editor is empty');
    }
  }, [value, showToast]);

  const handleClear = useCallback(() => {
    if (!value.trim()) return;
    if (window.confirm('Clear all code in this script?')) {
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' },
        });
        viewRef.current.focus();
      }
      onChange('');
      showToast('🧹 Script cleared');
    }
  }, [value, onChange, showToast]);

  const handleUpdate = useCallback(
    (content: string) => {
      currentValueRef.current = content;
      onChange(content);
    },
    [onChange]
  );

  // Analyze cursor and occurrences of the word under cursor
  const updateCursorAndMatches = useCallback((view: EditorView) => {
    try {
      const head = view.state.selection.main.head;
      const line = view.state.doc.lineAt(head);
      const ln = line.number;
      const col = head - line.from + 1;
      const totalLines = view.state.doc.lines;
      const totalChars = view.state.doc.length;

      setCursorPos({ line: ln, col });
      setDocStats({ lines: totalLines, chars: totalChars });

      // Check word around cursor for match count
      const lineText = line.text;
      const posInLine = head - line.from;
      let start = posInLine;
      let end = posInLine;
      while (start > 0 && /\w/.test(lineText[start - 1])) start--;
      while (end < lineText.length && /\w/.test(lineText[end])) end++;
      const word = lineText.slice(start, end);

      if (word && word.length >= 2 && !/^\d+$/.test(word)) {
        const docText = view.state.doc.toString();
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches = (docText.match(new RegExp(`\\b${escaped}\\b`, 'g')) || []).length;
        if (matches > 1) {
          setMatchInfo({ word, count: matches });
        } else {
          setMatchInfo(null);
        }
      } else {
        setMatchInfo(null);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    const state = createEditorState(
      value, 
      isDark, 
      handleUpdate, 
      fontSize, 
      onRun,
      updateCursorAndMatches
    );
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Initial stats
    updateCursorAndMatches(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content when value changes externally (tab switching)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (value !== currentValueRef.current) {
      currentValueRef.current = value;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
      updateCursorAndMatches(view);
    }
  }, [value, updateCursorAndMatches]);

  // Update theme
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: themeCompartment.reconfigure([
        isDark ? darkTheme : lightTheme,
        syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle),
      ]),
    });
  }, [isDark]);

  // Update font size
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.setProperty('--editor-font-size', `${fontSize}px`);
    }
  }, [fontSize]);

  const contextIcon = CONTEXT_ICONS[scriptType] || faCode;

  return (
    <div className={`code-editor-wrapper ${isDark ? 'dark' : 'light'} ${isRunning ? 'is-running' : ''}`}>
      {/* Dynamic Animated Shimmer Line when Luau Engine is executing */}
      {isRunning && <div className="running-shimmer-bar" />}

      {/* Editor Quick Action Toolbar */}
      <div className={`editor-quick-actions ${isDark ? 'dark' : 'light'}`}>
        <div className="quick-actions-left">
          <button 
            type="button" 
            className="quick-action-btn" 
            onClick={handleUndo} 
            title="Undo (Ctrl+Z)"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
            <span className="btn-label">Undo</span>
          </button>
          <button 
            type="button" 
            className="quick-action-btn" 
            onClick={handleRedo} 
            title="Redo (Ctrl+Y)"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            <span className="btn-label">Redo</span>
          </button>
          <div className="quick-action-sep" />
          <button 
            type="button" 
            className="quick-action-btn" 
            onClick={handleFind} 
            title="Find & Replace (Ctrl+F)"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span className="btn-label">Find</span>
          </button>
          <button 
            type="button" 
            className="quick-action-btn" 
            onClick={handleToggleComment} 
            title="Toggle Comment (Ctrl+/)"
          >
            <FontAwesomeIcon icon={faCommentDots} />
            <span className="btn-label">Comment</span>
          </button>
          <button 
            type="button" 
            className="quick-action-btn highlight-action" 
            onClick={handleFormat} 
            title="Format & Indent Code (Alt+Shift+F)"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            <span className="btn-label">Format</span>
          </button>
        </div>

        <div className="quick-actions-right">
          {toastMessage && (
            <div className="editor-toast-banner" role="status">
              <span>{toastMessage}</span>
            </div>
          )}
          <button 
            type="button" 
            className="quick-action-btn" 
            onClick={handleCopyAll} 
            title="Copy All Code"
          >
            <FontAwesomeIcon icon={faCopy} />
            <span className="btn-label">Copy</span>
          </button>
          <button 
            type="button" 
            className="quick-action-btn danger-hover" 
            onClick={handleClear} 
            title="Clear Editor"
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
          <button 
            type="button" 
            className="quick-action-btn shortcut-btn" 
            onClick={() => setShowShortcutsModal(true)} 
            title="Keyboard Shortcuts Cheat Sheet"
          >
            <FontAwesomeIcon icon={faKeyboard} />
          </button>
        </div>
      </div>

      {/* CodeMirror 6 Mounting View */}
      <div className="code-editor-container" ref={editorRef} />

      {/* Alive Status Bar with Live Cursor, Occurrences, and VM State */}
      <footer className={`editor-status-bar ${isDark ? 'dark' : 'light'}`}>
        <div className="status-group left">
          <span className="status-item font-mono" title="Cursor Line and Column position">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="status-sep">•</span>
          <span className="status-item font-mono" title="Document line and character count">
            {docStats.lines} lines, {docStats.chars} chars
          </span>
          {matchInfo && (
            <>
              <span className="status-sep">•</span>
              <span className="status-item status-match-pill" title={`All occurrences of "${matchInfo.word}" across this script`}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className="match-icon" />
                <span className="match-count">{matchInfo.count} matches</span>
                <span className="match-word font-mono">"{matchInfo.word}"</span>
              </span>
            </>
          )}
        </div>

        <div className="status-group right">
          <span className={`status-item status-type-badge type-${scriptType}`} title={`Execution context: "${scriptName}" (${scriptType})`}>
            <FontAwesomeIcon icon={contextIcon} />
            <span>{scriptType}</span>
          </span>

          <span className={`status-item status-vm ${isRunning ? 'running' : 'ready'}`}>
            <span className={`vm-dot ${isRunning ? 'pulse' : 'steady'}`} />
            <span>{isRunning ? 'VM Executing...' : 'VM Ready'}</span>
          </span>

          <span className="status-item status-hint" title="Keyboard shortcut to execute active script">
            <FontAwesomeIcon icon={faKeyboard} />
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
          </span>
        </div>
      </footer>

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      {showShortcutsModal && (
        <div className="shortcuts-modal-overlay" onClick={() => setShowShortcutsModal(false)}>
          <div 
            className={`shortcuts-modal-card ${isDark ? 'dark' : 'light'}`} 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="shortcuts-modal-header">
              <div className="modal-title-group">
                <FontAwesomeIcon icon={faKeyboard} className="modal-title-icon" />
                <h3>Keyboard Shortcuts & Cheatsheet</h3>
              </div>
              <button 
                type="button" 
                className="shortcuts-close-btn" 
                onClick={() => setShowShortcutsModal(false)}
                title="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="shortcuts-modal-content">
              <div className="shortcut-category">
                <h4>Execution & Running</h4>
                <div className="shortcut-row">
                  <span>Run / Execute Active Script</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>Enter</kbd></div>
                </div>
              </div>

              <div className="shortcut-category">
                <h4>Code Editing & Formatting</h4>
                <div className="shortcut-row">
                  <span>Auto-Format & Indent Code</span>
                  <div className="keys"><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Toggle Line Comment</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>/</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Undo</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>Z</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Redo</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Indent / Unindent Selection</span>
                  <div className="keys"><kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd></div>
                </div>
              </div>

              <div className="shortcut-category">
                <h4>Search & Navigation</h4>
                <div className="shortcut-row">
                  <span>Find & Replace in File</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>F</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Close Search / Popups</span>
                  <div className="keys"><kbd>Esc</kbd></div>
                </div>
              </div>

              <div className="shortcut-category">
                <h4>Roblox IntelliSense & Luau</h4>
                <div className="shortcut-row">
                  <span>Trigger Autocomplete</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>Space</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Hover Documentation</span>
                  <span className="feature-tag">Hover any Roblox API / Service</span>
                </div>
                <div className="shortcut-row">
                  <span>Live Color Swatches</span>
                  <span className="feature-tag">Color3.fromRGB, fromHex</span>
                </div>
              </div>
            </div>

            <div className="shortcuts-modal-footer">
              <span className="shortcuts-hint">Press <kbd>Esc</kbd> or click outside to dismiss</span>
              <button 
                type="button" 
                className="btn-primary-close" 
                onClick={() => setShowShortcutsModal(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
