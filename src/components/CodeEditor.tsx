import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faServer, 
  faDesktop, 
  faPuzzlePiece, 
  faMagnifyingGlass,
  faKeyboard
} from '@fortawesome/free-solid-svg-icons';
import type { ScriptType } from '../types';
import { 
  createEditorState, 
  themeCompartment, 
  darkTheme, 
  lightTheme, 
  darkHighlightStyle, 
  lightHighlightStyle 
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
    </div>
  );
};

export default CodeEditor;
