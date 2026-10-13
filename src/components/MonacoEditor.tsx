import React, { useRef, useState, useCallback, useEffect } from 'react';
import Editor, { loader, type OnMount, type BeforeMount, type Monaco } from '@monaco-editor/react';
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
import { formatLuauCode } from '../editor/formatter';
import { useDialog } from '../context/DialogContext';
import {
  LUAU_KEYWORDS,
  GLOBAL_FUNCTIONS,
  GAME_API,
  SERVICES,
  INSTANCE_METHODS,
  INSTANCE_PROPERTIES,
  INSTANCE_EVENTS,
  INSTANCE_CLASSES,
  TASK_API,
  SIGNAL_METHODS,
  REMOTE_EVENT_API,
  MATH_API,
  STRING_API,
  TABLE_API,
  VECTOR3_API,
  CFRAME_API,
  COLOR3_API,
  UDIM2_API,
  UDIM_API,
  BRICKCOLOR_API,
  TWEENINFO_API,
  TWEENSERVICE_API,
  HTTPSERVICE_API,
  DATASTORE_API,
  COLLECTIONSERVICE_API,
  DEBRIS_API,
  USERINPUTSERVICE_API,
  MARKETPLACESERVICE_API,
  ENUM_API,
  BASEPART_API,
  PLAYERS_API,
  HUMANOID_API,
  CODE_SNIPPETS,
} from '../editor/completions';
import { LUAU_AUTOCORRECT_MAP } from '../editor/autoclose';
import { ROBLOX_DOCS } from '../editor/roblox-highlighter';
import './CodeEditor.css';

interface MonacoEditorProps {
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

let isMonacoLanguagesConfigured = false;

export function setupMonacoThemes(monaco: Monaco) {
  // Define custom Catppuccin Mocha / Roblox Studio Dark Theme
  monaco.editor.defineTheme('roblox-studio-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'cba6f7', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'cba6f7', fontStyle: 'bold' },
      { token: 'string', foreground: 'a6e3a1' },
      { token: 'number', foreground: 'fab387' },
      { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
      { token: 'delimiter', foreground: '9399b2' },
      { token: 'identifier', foreground: 'cdd6f4' },
      { token: 'type', foreground: 'f9e2af' },
    ],
    colors: {
      'editor.background': '#1e1e2e',
      'editor.foreground': '#cdd6f4',
      'editorCursor.foreground': '#f5e0dc',
      'editor.lineHighlightBackground': '#31324470',
      'editorLineNumber.foreground': '#6c7086',
      'editorLineNumber.activeForeground': '#89b4fa',
      'editor.selectionBackground': '#45475a80',
    },
  });

  // Define custom Catppuccin Latte / Roblox Studio Light Theme
  monaco.editor.defineTheme('roblox-studio-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '8839ef', fontStyle: 'bold' },
      { token: 'string', foreground: '40a02b' },
      { token: 'number', foreground: 'fe640b' },
      { token: 'comment', foreground: '8c8fa1', fontStyle: 'italic' },
      { token: 'delimiter', foreground: '6c6f85' },
      { token: 'identifier', foreground: '4c4f69' },
    ],
    colors: {
      'editor.background': '#eff1f5',
      'editor.foreground': '#4c4f69',
      'editorCursor.foreground': '#dc8a78',
      'editor.lineHighlightBackground': '#ccd0da40',
      'editorLineNumber.foreground': '#8c8fa1',
      'editorLineNumber.activeForeground': '#1e66f5',
      'editor.selectionBackground': '#acb0be80',
    },
  });
}

// Pre-register themes eagerly as soon as the module loads
loader.init().then((monaco) => {
  setupMonacoThemes(monaco);
}).catch(() => {});

function setupMonacoLanguages(monaco: Monaco) {
  setupMonacoThemes(monaco);
  if (isMonacoLanguagesConfigured) return;
  isMonacoLanguagesConfigured = true;

  // 1. Language Configuration (Auto-Closing & On-Enter Rules)
  monaco.languages.setLanguageConfiguration('lua', {
    comments: {
      lineComment: '--',
      blockComment: ['--[[', ']]'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    onEnterRules: [
      {
        // while do, for do, if then, function()
        beforeText: /\b(do|then|function(\s+[\w.:]+)?\s*\([^\)]*\))\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '\nend' },
      },
      {
        // Connect(function(...) or task.spawn(function(...)
        beforeText: /:[A-Za-z0-9_]+\s*\(\s*function\s*\([^\)]*\)\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '\nend)' },
      },
      {
        // repeat
        beforeText: /\brepeat\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '\nuntil ' },
      },
    ],
  });

  // 3. Document Formatting Provider
  monaco.languages.registerDocumentFormattingEditProvider('lua', {
    provideDocumentFormattingEdits(model: any) {
      const text = model.getValue();
      const formatted = formatLuauCode(text);
      return [
        {
          range: model.getFullModelRange(),
          text: formatted,
        },
      ];
    },
  });

  // 4. Hover Documentation Provider
  monaco.languages.registerHoverProvider('lua', {
    provideHover(model: any, position: any) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const doc = ROBLOX_DOCS[word.word];
      if (!doc) return null;

      const contents = [
        { value: `**${doc.signature || word.word}** *(${doc.type})*` },
        { value: doc.summary },
      ];
      if (doc.example) {
        contents.push({ value: `\`\`\`lua\n${doc.example}\n\`\`\`` });
      }

      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents,
      };
    },
  });

  // 5. Full Roblox & Luau IntelliSense Completion Provider
  monaco.languages.registerCompletionItemProvider('lua', {
    triggerCharacters: ['.', ':', '"', '('],
    provideCompletionItems(model: any, position: any) {
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );

      const lineContent = model.getLineContent(position.lineNumber);
      const beforeCursor = lineContent.slice(0, position.column - 1);

      const suggestions: any[] = [];

      // Check if inside GetService("...") or Instance.new("...")
      if (/GetService\s*\(\s*"?$/.test(beforeCursor)) {
        SERVICES.forEach((s) => {
          suggestions.push({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: s.detail,
            documentation: s.info,
            insertText: s.label,
            range,
          });
        });
        return { suggestions };
      }

      if (/Instance\.new\s*\(\s*"?$/.test(beforeCursor)) {
        INSTANCE_CLASSES.forEach((c) => {
          suggestions.push({
            label: c.label,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: c.detail,
            documentation: c.info,
            insertText: c.label,
            range,
          });
        });
        return { suggestions };
      }

      // Check member access (dot or colon)
      const lastDot = beforeCursor.lastIndexOf('.');
      const lastColon = beforeCursor.lastIndexOf(':');
      const lastSep = Math.max(lastDot, lastColon);

      if (lastSep !== -1) {
        const prefix = beforeCursor.slice(0, lastSep).trim().split(/[.:]/).pop()?.toLowerCase();
        const sep = beforeCursor[lastSep];

        if (prefix === 'game' && sep === ':') {
          GAME_API.filter((c) => c.type === 'method').forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'game' && sep === '.') {
          GAME_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'task') {
          TASK_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'math') {
          MATH_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'string') {
          STRING_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'table') {
          TABLE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'vector3') {
          VECTOR3_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'cframe') {
          CFRAME_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'color3') {
          COLOR3_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'udim2') {
          UDIM2_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'udim') {
          UDIM_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'brickcolor') {
          BRICKCOLOR_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'tweeninfo') {
          TWEENINFO_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: c.detail,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'tweenservice') {
          TWEENSERVICE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'httpservice') {
          HTTPSERVICE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'datastoreservice') {
          DATASTORE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'collectionservice') {
          COLLECTIONSERVICE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'debris') {
          DEBRIS_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'userinputservice') {
          USERINPUTSERVICE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: c.type === 'method' ? monaco.languages.CompletionItemKind.Method : monaco.languages.CompletionItemKind.Property,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'marketplaceservice') {
          MARKETPLACESERVICE_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: c.type === 'method' ? monaco.languages.CompletionItemKind.Method : monaco.languages.CompletionItemKind.Property,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'enum') {
          ENUM_API.forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: monaco.languages.CompletionItemKind.Enum,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        } else if (prefix === 'instance' && sep === '.') {
          suggestions.push({
            label: 'new',
            kind: monaco.languages.CompletionItemKind.Function,
            detail: '(className, parent?) → Instance',
            insertText: 'new("${1:Part}")',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        } else {
          // Instance methods, properties, and signals
          [
            ...INSTANCE_METHODS,
            ...INSTANCE_PROPERTIES,
            ...INSTANCE_EVENTS,
            ...SIGNAL_METHODS,
            ...REMOTE_EVENT_API,
            ...BASEPART_API,
            ...PLAYERS_API,
            ...HUMANOID_API,
          ].forEach((c) => {
            suggestions.push({
              label: c.label,
              kind: c.type === 'method' 
                ? monaco.languages.CompletionItemKind.Method 
                : monaco.languages.CompletionItemKind.Property,
              detail: c.detail,
              documentation: c.info,
              insertText: c.label,
              range,
            });
          });
        }

        return { suggestions };
      }

      // Check Typo Auto-correct
      const currentWord = word.word;
      if (currentWord && LUAU_AUTOCORRECT_MAP[currentWord]) {
        const fixed = LUAU_AUTOCORRECT_MAP[currentWord];
        suggestions.push({
          label: fixed,
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: `✨ Auto-correct: ${fixed}`,
          insertText: fixed,
          sortText: '0000',
          range,
        });
      }

      // Keywords
      LUAU_KEYWORDS.forEach((c) => {
        suggestions.push({
          label: c.label,
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: c.detail,
          insertText: c.label,
          range,
        });
      });

      // Global functions
      GLOBAL_FUNCTIONS.forEach((c) => {
        suggestions.push({
          label: c.label,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: c.detail,
          documentation: c.info,
          insertText: c.label,
          range,
        });
      });

      // Globals & Datatypes
      [
        { label: 'game', detail: 'DataModel' },
        { label: 'workspace', detail: 'Workspace' },
        { label: 'script', detail: 'LuaSourceContainer' },
        { label: 'task', detail: 'Task Scheduler' },
        { label: 'Vector3', detail: '3D Vector' },
        { label: 'CFrame', detail: 'Coordinate Frame' },
        { label: 'Color3', detail: 'RGB Color' },
        { label: 'UDim2', detail: '2D UI Dimension' },
        { label: 'Enum', detail: 'Roblox Enums' },
        { label: 'Instance', detail: 'Roblox Instance' },
      ].forEach((g) => {
        suggestions.push({
          label: g.label,
          kind: monaco.languages.CompletionItemKind.Class,
          detail: g.detail,
          insertText: g.label,
          range,
        });
      });

      // Snippets
      CODE_SNIPPETS.forEach((s) => {
        suggestions.push({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: s.detail,
          insertText: s.snippet.replace(/\$\{\d+:([^}]*)}/g, '$1'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      });

      return { suggestions };
    },
  });
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  onRun,
  isDark,
  fontSize = 14,
  isRunning = false,
  scriptType = 'Script',
  scriptName = 'Script',
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [docStats, setDocStats] = useState({ lines: 1, chars: value.length });
  const [matchInfo, setMatchInfo] = useState<{ word: string; count: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { showConfirm } = useDialog();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 1800);
  }, []);

  // Sync theme whenever isDark toggles
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'roblox-studio-dark' : 'roblox-studio-light');
    }
  }, [isDark]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    setupMonacoThemes(monaco);
    setupMonacoLanguages(monaco);
    monaco.editor.setTheme(isDark ? 'roblox-studio-dark' : 'roblox-studio-light');
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupMonacoThemes(monaco);
    setupMonacoLanguages(monaco);
    monaco.editor.setTheme(isDark ? 'roblox-studio-dark' : 'roblox-studio-light');

    // Bind Ctrl+Enter for running script
    if (onRun) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun();
      });
    }

    // Cursor position and live stats listener
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
      const model = editor.getModel();
      if (!model) return;

      setDocStats({ lines: model.getLineCount(), chars: model.getValueLength() });

      // Match info for current word
      const wordObj = model.getWordAtPosition(e.position);
      if (wordObj && wordObj.word.length >= 2 && !/^\d+$/.test(wordObj.word)) {
        const matches = model.findMatches(
          `\\b${wordObj.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          false,
          true,
          false,
          null,
          false
        );
        if (matches.length > 1) {
          setMatchInfo({ word: wordObj.word, count: matches.length });
        } else {
          setMatchInfo(null);
        }
      } else {
        setMatchInfo(null);
      }
    });

    // Initial stats
    const model = editor.getModel();
    if (model) {
      setDocStats({ lines: model.getLineCount(), chars: model.getValueLength() });
    }

    // 2.6s Desktop Hover listener
    let monacoHoverTimer: any = null;
    let lastMonacoLine: number | null = null;
    editor.onMouseMove((e: any) => {
      if (monacoHoverTimer) clearTimeout(monacoHoverTimer);
      if (e.target?.position) {
        const ln = e.target.position.lineNumber;
        lastMonacoLine = ln;
        monacoHoverTimer = setTimeout(() => {
          if (lastMonacoLine === ln) {
            window.dispatchEvent(
              new CustomEvent('open-end-block-inspector', {
                detail: { line: ln, x: e.event.posx, y: e.event.posy },
              })
            );
          }
        }, 2600);
      }
    });

    editor.onMouseLeave(() => {
      if (monacoHoverTimer) clearTimeout(monacoHoverTimer);
    });
  };

  // Global listeners for line queries, jumping, and unfolding
  useEffect(() => {
    const handleQueryLine = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number; line: number | null }>;
      if (editorRef.current && customEvent.detail) {
        const { x, y } = customEvent.detail;
        const target = editorRef.current.getTargetAtClientPoint(x, y);
        if (target?.position) {
          customEvent.detail.line = target.position.lineNumber;
        }
      }
    };

    const handleJumpToLine = (e: Event) => {
      const customEvent = e as CustomEvent<{ lineNumber: number }>;
      if (editorRef.current && customEvent.detail?.lineNumber) {
        const ln = customEvent.detail.lineNumber;
        editorRef.current.revealLineInCenter(ln);
        editorRef.current.setPosition({ lineNumber: ln, column: 1 });
        editorRef.current.focus();
      }
    };

    const handleUnfoldBlock = (e: Event) => {
      const customEvent = e as CustomEvent<{ lineNumber: number }>;
      if (editorRef.current && customEvent.detail?.lineNumber) {
        editorRef.current.getAction('editor.unfold')?.run();
        editorRef.current.revealLineInCenter(customEvent.detail.lineNumber);
      }
    };

    window.addEventListener('query-editor-line-at-coords', handleQueryLine);
    window.addEventListener('editor-jump-to-line', handleJumpToLine);
    window.addEventListener('editor-unfold-block', handleUnfoldBlock);

    return () => {
      window.removeEventListener('query-editor-line-at-coords', handleQueryLine);
      window.removeEventListener('editor-jump-to-line', handleJumpToLine);
      window.removeEventListener('editor-unfold-block', handleUnfoldBlock);
    };
  }, []);

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'undo', null);
    editorRef.current?.focus();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'redo', null);
    editorRef.current?.focus();
  }, []);

  const handleFind = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'actions.find', null);
    editorRef.current?.focus();
  }, []);

  const handleToggleComment = useCallback(() => {
    editorRef.current?.trigger('toolbar', 'editor.action.commentLine', null);
    editorRef.current?.focus();
  }, []);

  const handleFormat = useCallback(() => {
    if (editorRef.current) {
      const prev = editorRef.current.getValue();
      const formatted = formatLuauCode(prev);
      if (prev !== formatted) {
        editorRef.current.setValue(formatted);
        onChange(formatted);
        showToast('✨ Formatted Luau code!');
      } else {
        showToast('✨ Code is already clean!');
      }
      editorRef.current.focus();
    }
  }, [onChange, showToast]);

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

  const handleClear = useCallback(async () => {
    if (!value.trim()) return;
    const confirmed = await showConfirm({
      title: 'Clear Script',
      message: 'Clear all code in this script? This action cannot be undone.',
      confirmText: 'Clear Script',
      danger: true,
    });
    if (confirmed) {
      editorRef.current?.setValue('');
      onChange('');
      showToast('🧹 Script cleared');
    }
  }, [value, onChange, showToast, showConfirm]);

  const contextIcon = CONTEXT_ICONS[scriptType] || faCode;

  return (
    <div className={`code-editor-wrapper ${isDark ? 'dark' : 'light'} ${isRunning ? 'is-running' : ''}`}>
      {/* Execution Shimmer Line */}
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
          <span className="editor-engine-pill" title="Engine: Monaco Editor">
            Monaco
          </span>
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

      {/* Monaco Mounting Container */}
      <div className="code-editor-container">
        <Editor
          height="100%"
          language="lua"
          theme={isDark ? 'roblox-studio-dark' : 'roblox-studio-light'}
          value={value}
          onChange={(val) => onChange(val || '')}
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          loading={
            <div 
              className={`monaco-loading-placeholder ${isDark ? 'dark' : 'light'}`}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: isDark ? '#1e1e2e' : '#eff1f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#a6adc8' : '#6c6f85',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              <span>Loading Luau Editor...</span>
            </div>
          }
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'off',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: false, strings: false },
          }}
        />
      </div>

      {/* Status Bar */}
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
                <h3>Keyboard Shortcuts (Monaco Engine)</h3>
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
                  <span>Undo / Redo</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd></div>
                </div>
              </div>

              <div className="shortcut-category">
                <h4>Search & Navigation</h4>
                <div className="shortcut-row">
                  <span>Find & Replace in File</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>F</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Multi-Cursor Selection</span>
                  <div className="keys"><kbd>Ctrl</kbd> + <kbd>D</kbd></div>
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

export default MonacoEditor;
