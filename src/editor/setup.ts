/**
 * CodeMirror 6 Editor Setup for Luau
 * 
 * Uses CodeMirror 6 with Lua legacy mode (or @fazelstudio/codemirror-lang-luau if available)
 * for syntax highlighting, plus custom autocomplete, bracket matching, and more.
 */

import { EditorState, type Extension, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, 
         highlightSpecialChars, drawSelection, rectangularSelection,
         crosshairCursor, highlightActiveLineGutter, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, 
         foldGutter, foldKeymap, HighlightStyle, syntaxHighlighting,
         defaultHighlightStyle } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches, search } from '@codemirror/search';
import { autocompletion, completionKeymap, type CompletionContext, type Completion } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { luau } from '@fazelstudio/codemirror-lang-luau';
import { tags } from '@lezer/highlight';
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
  type CompletionItem,
} from './completions';
import {
  robloxTokenHighlighter,
  colorPreviewPlugin,
  robloxHoverTooltips,
} from './roblox-highlighter';
import { formatLuauCode } from './formatter';
import {
  handleLuauEnter,
  luauAutoCorrectExtension,
  LUAU_AUTOCORRECT_MAP,
} from './autoclose';

// ===== Code Formatter Command =====
export function formatCodeCommand(view: EditorView): boolean {
  const doc = view.state.doc.toString();
  const formatted = formatLuauCode(doc);
  if (doc !== formatted) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: formatted },
    });
  }
  return true;
}

// Theme compartment for dynamic switching
export const themeCompartment = new Compartment();

// ===== Dark Theme =====
export const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
    height: '100%',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
  '.cm-content': {
    caretColor: '#f5e0dc',
    padding: '4px 0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#f5e0dc !important',
    borderLeftWidth: '2.5px !important',
    boxShadow: '0 0 8px rgba(245, 224, 220, 0.85)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#45475a !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(49, 50, 68, 0.75) !important',
    borderLeft: '2px solid #89b4fa',
  },
  '.cm-gutters': {
    backgroundColor: '#181825',
    color: '#6c7086',
    border: 'none',
    borderRight: '1px solid #313244',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#313244',
    color: '#89b4fa !important',
    fontWeight: 'bold',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#45475a',
    color: '#a6adc8',
    border: 'none',
  },
  '.cm-tooltip': {
    backgroundColor: '#1e1e2e',
    border: '1px solid #45475a',
    color: '#cdd6f4',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li': {
      padding: '2px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#45475a',
      color: '#cdd6f4',
    },
  },
  '.cm-tooltip.cm-tooltip-hover': {
    backgroundColor: '#1e1e2e',
    border: '1px solid #585b70',
    padding: '4px 8px',
  },
  '.cm-searchMatch': {
    backgroundColor: '#f9e2af40',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#f9e2af80',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(137, 180, 250, 0.3) !important',
    outline: '1px solid #89b4fa',
    boxShadow: '0 0 8px rgba(137, 180, 250, 0.6)',
  },
  '.cm-panels': {
    backgroundColor: '#181825',
    color: '#cdd6f4',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid #313244',
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: '1px solid #313244',
  },
  '.cm-panel.cm-search': {
    backgroundColor: '#181825',
  },
  '.cm-panel.cm-search input': {
    backgroundColor: '#313244',
    color: '#cdd6f4',
    border: '1px solid #45475a',
    borderRadius: '4px',
    padding: '2px 6px',
  },
  '.cm-panel.cm-search button': {
    backgroundColor: '#45475a',
    color: '#cdd6f4',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 8px',
    cursor: 'pointer',
  },
  '.cm-panel.cm-search label': {
    color: '#a6adc8',
  },
  // Custom Semantic Roblox Highlighting (Dark Theme)
  '.cm-roblox-global': {
    color: '#f5c2e7 !important',
    fontWeight: '600',
    textShadow: '0 0 8px rgba(245, 194, 231, 0.3)',
  },
  '.cm-roblox-service': {
    color: '#89dceb !important',
    fontWeight: '600',
    textShadow: '0 0 8px rgba(137, 220, 235, 0.3)',
  },
  '.cm-roblox-method': {
    color: '#89b4fa !important',
  },
  '.cm-roblox-builtin': {
    color: '#b4befe !important',
  },
  '.cm-roblox-task': {
    color: '#f9e2af !important',
    fontWeight: '500',
  },
  '.cm-roblox-bool': {
    color: '#fab387 !important',
    fontWeight: 'bold',
  },
  '.cm-roblox-self': {
    color: '#f38ba8 !important',
    fontWeight: 'bold',
  },
  '.cm-roblox-event': {
    color: '#a6e3a1 !important',
  },
  '.cm-roblox-prop': {
    color: '#cba6f7 !important',
  },
  // Dedicated Roblox Studio Purple for 'end' and Control Keywords
  '.cm-roblox-end': {
    color: '#cba6f7 !important',
    fontWeight: '700',
    textShadow: '0 0 8px rgba(203, 166, 247, 0.45)',
  },
  '.cm-roblox-keyword': {
    color: '#cba6f7 !important',
    fontWeight: '700',
  },
  // Alive Word Matches & Active Line
  '.cm-selectionMatch': {
    backgroundColor: 'rgba(137, 180, 250, 0.22) !important',
    borderRadius: '3px',
    outline: '1px solid rgba(137, 180, 250, 0.45)',
    boxShadow: '0 0 5px rgba(137, 180, 250, 0.25)',
  },
  '.cm-selectionMatch-main': {
    backgroundColor: 'rgba(203, 166, 247, 0.32) !important',
    borderRadius: '3px',
    outline: '1px solid rgba(203, 166, 247, 0.75)',
    boxShadow: '0 0 8px rgba(203, 166, 247, 0.4)',
  },
  '.cm-color-swatch-widget': {
    display: 'inline-block',
    width: '11px',
    height: '11px',
    borderRadius: '3px',
    verticalAlign: 'middle',
    margin: '0 3px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
  },
}, { dark: true });

// ===== Dark Syntax Highlighting =====
export const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#cba6f7', fontWeight: 'bold' },
  { tag: tags.controlKeyword, color: '#cba6f7', fontWeight: 'bold' },
  { tag: tags.operator, color: '#89dceb' },
  { tag: tags.variableName, color: '#cdd6f4' },
  { tag: tags.function(tags.variableName), color: '#89b4fa' },
  { tag: tags.definition(tags.variableName), color: '#89b4fa' },
  { tag: tags.string, color: '#a6e3a1' },
  { tag: tags.number, color: '#fab387' },
  { tag: tags.bool, color: '#fab387' },
  { tag: tags.null, color: '#fab387' },
  { tag: tags.comment, color: '#6c7086', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#6c7086', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#6c7086', fontStyle: 'italic' },
  { tag: tags.typeName, color: '#f9e2af' },
  { tag: tags.className, color: '#f9e2af' },
  { tag: tags.propertyName, color: '#b4befe' },
  { tag: tags.meta, color: '#f38ba8' },
  { tag: tags.punctuation, color: '#9399b2' },
  { tag: tags.bracket, color: '#9399b2' },
  { tag: tags.special(tags.variableName), color: '#f5c2e7' },
  { tag: tags.self, color: '#f38ba8' },
  { tag: tags.atom, color: '#fab387' },
]);

// ===== Light Theme =====
export const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#eff1f5',
    color: '#4c4f69',
    height: '100%',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
  '.cm-content': {
    caretColor: '#dc8a78',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#dc8a78 !important',
    borderLeftWidth: '2.5px !important',
    boxShadow: '0 0 6px rgba(220, 138, 120, 0.7)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#acb0be !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(230, 233, 239, 0.9) !important',
    borderLeft: '2px solid #1e66f5',
  },
  '.cm-gutters': {
    backgroundColor: '#dce0e8',
    color: '#8c8fa1',
    border: 'none',
    borderRight: '1px solid #ccd0da',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#dce0e8',
    color: '#1e66f5 !important',
    fontWeight: 'bold',
  },
  '.cm-tooltip': {
    backgroundColor: '#eff1f5',
    border: '1px solid #ccd0da',
    color: '#4c4f69',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#ccd0da',
      color: '#4c4f69',
    },
  },
  '.cm-searchMatch': {
    backgroundColor: '#df8e1d40',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(30, 102, 245, 0.2) !important',
    outline: '1px solid #1e66f5',
    boxShadow: '0 0 6px rgba(30, 102, 245, 0.4)',
  },
  '.cm-panels': {
    backgroundColor: '#dce0e8',
    color: '#4c4f69',
  },
  '.cm-panel.cm-search input': {
    backgroundColor: '#eff1f5',
    color: '#4c4f69',
    border: '1px solid #ccd0da',
    borderRadius: '4px',
  },
  '.cm-panel.cm-search button': {
    backgroundColor: '#ccd0da',
    color: '#4c4f69',
    border: 'none',
    borderRadius: '4px',
  },
  // Custom Semantic Roblox Highlighting (Light Theme)
  '.cm-roblox-global': {
    color: '#8839ef !important',
    fontWeight: '600',
  },
  '.cm-roblox-service': {
    color: '#04a5e5 !important',
    fontWeight: '600',
  },
  '.cm-roblox-method': {
    color: '#1e66f5 !important',
  },
  '.cm-roblox-builtin': {
    color: '#7287fd !important',
  },
  '.cm-roblox-task': {
    color: '#df8e1d !important',
    fontWeight: '500',
  },
  '.cm-roblox-bool': {
    color: '#fe640b !important',
    fontWeight: 'bold',
  },
  '.cm-roblox-self': {
    color: '#d20f39 !important',
    fontWeight: 'bold',
  },
  '.cm-roblox-event': {
    color: '#40a02b !important',
  },
  '.cm-roblox-prop': {
    color: '#8839ef !important',
  },
  // Dedicated Roblox Studio Purple for 'end' and Control Keywords
  '.cm-roblox-end': {
    color: '#8839ef !important',
    fontWeight: '700',
  },
  '.cm-roblox-keyword': {
    color: '#8839ef !important',
    fontWeight: '700',
  },
  // Alive Word Matches & Active Line
  '.cm-selectionMatch': {
    backgroundColor: 'rgba(30, 102, 245, 0.16) !important',
    borderRadius: '3px',
    outline: '1px solid rgba(30, 102, 245, 0.4)',
    boxShadow: '0 0 5px rgba(30, 102, 245, 0.2)',
  },
  '.cm-selectionMatch-main': {
    backgroundColor: 'rgba(136, 57, 239, 0.22) !important',
    borderRadius: '3px',
    outline: '1px solid rgba(136, 57, 239, 0.65)',
    boxShadow: '0 0 6px rgba(136, 57, 239, 0.3)',
  },
  '.cm-color-swatch-widget': {
    display: 'inline-block',
    width: '11px',
    height: '11px',
    borderRadius: '3px',
    verticalAlign: 'middle',
    margin: '0 3px',
    border: '1px solid rgba(0, 0, 0, 0.25)',
    boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
  },
}, { dark: false });

// ===== Light Syntax Highlighting =====
export const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#8839ef', fontWeight: 'bold' },
  { tag: tags.controlKeyword, color: '#8839ef', fontWeight: 'bold' },
  { tag: tags.operator, color: '#04a5e5' },
  { tag: tags.variableName, color: '#4c4f69' },
  { tag: tags.function(tags.variableName), color: '#1e66f5' },
  { tag: tags.definition(tags.variableName), color: '#1e66f5' },
  { tag: tags.string, color: '#40a02b' },
  { tag: tags.number, color: '#fe640b' },
  { tag: tags.bool, color: '#fe640b' },
  { tag: tags.null, color: '#fe640b' },
  { tag: tags.comment, color: '#8c8fa1', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#8c8fa1', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#8c8fa1', fontStyle: 'italic' },
  { tag: tags.typeName, color: '#df8e1d' },
  { tag: tags.className, color: '#df8e1d' },
  { tag: tags.propertyName, color: '#7287fd' },
  { tag: tags.meta, color: '#d20f39' },
  { tag: tags.punctuation, color: '#6c6f85' },
  { tag: tags.bracket, color: '#6c6f85' },
  { tag: tags.special(tags.variableName), color: '#ea76cb' },
  { tag: tags.self, color: '#d20f39' },
]);

// ===== Autocomplete Provider (Fuzzy, Typo-Tolerant & Roblox IntelliSense) =====
function luauCompletions(context: CompletionContext) {
  // Get the word before the cursor
  const word = context.matchBefore(/[\w.:]*/);
  if (!word) return null;

  const text = word.text;

  // Don't autocomplete empty strings without explicit activation
  if (text.length === 0 && !context.explicit) return null;

  let completions: Completion[] = [];

  // Determine context based on what's before the cursor
  if (text.includes(':') || text.includes('.')) {
    const lastSep = Math.max(text.lastIndexOf('.'), text.lastIndexOf(':'));
    const separator = text[lastSep];
    const prefixFull = text.slice(0, lastSep);
    const parts = prefixFull.split(/[.:]/);
    const lastToken = parts[parts.length - 1].toLowerCase();
    const query = text.slice(lastSep + 1).toLowerCase();

    if (lastToken === 'game' && separator === ':') {
      completions = GAME_API.filter((c) => c.type === 'method').map(toCompletion);
    } else if (lastToken === 'game' && separator === '.') {
      completions = GAME_API.map(toCompletion);
    } else if (lastToken === 'task') {
      completions = TASK_API.map(toCompletion);
    } else if (lastToken === 'math') {
      completions = MATH_API.map(toCompletion);
    } else if (lastToken === 'string') {
      completions = STRING_API.map(toCompletion);
    } else if (lastToken === 'table') {
      completions = TABLE_API.map(toCompletion);
    } else if (lastToken === 'vector3') {
      completions = VECTOR3_API.map(toCompletion);
    } else if (lastToken === 'cframe') {
      completions = CFRAME_API.map(toCompletion);
    } else if (lastToken === 'color3') {
      completions = COLOR3_API.map(toCompletion);
    } else if (lastToken === 'udim2') {
      completions = UDIM2_API.map(toCompletion);
    } else if (lastToken === 'udim') {
      completions = UDIM_API.map(toCompletion);
    } else if (lastToken === 'brickcolor') {
      completions = BRICKCOLOR_API.map(toCompletion);
    } else if (lastToken === 'tweeninfo') {
      completions = TWEENINFO_API.map(toCompletion);
    } else if (lastToken === 'tweenservice') {
      completions = TWEENSERVICE_API.map(toCompletion);
    } else if (lastToken === 'httpservice') {
      completions = HTTPSERVICE_API.map(toCompletion);
    } else if (lastToken === 'datastoreservice') {
      completions = DATASTORE_API.map(toCompletion);
    } else if (lastToken === 'collectionservice') {
      completions = COLLECTIONSERVICE_API.map(toCompletion);
    } else if (lastToken === 'debris') {
      completions = DEBRIS_API.map(toCompletion);
    } else if (lastToken === 'userinputservice') {
      completions = USERINPUTSERVICE_API.map(toCompletion);
    } else if (lastToken === 'marketplaceservice') {
      completions = MARKETPLACESERVICE_API.map(toCompletion);
    } else if (lastToken === 'enum') {
      completions = ENUM_API.map(toCompletion);
    } else if (lastToken === 'players') {
      completions = PLAYERS_API.map(toCompletion);
    } else if (lastToken === 'workspace') {
      completions = [
        ...BASEPART_API.map(toCompletion),
        ...INSTANCE_METHODS.map(toCompletion),
        ...INSTANCE_PROPERTIES.map(toCompletion),
      ];
    } else if (lastToken === 'instance' && separator === '.') {
      completions = [
        { label: 'new', type: 'function', detail: '(className, parent?) → Instance', info: 'Creates a new Instance' },
      ];
    } else {
      // Generic instance / signal methods & properties
      completions = [
        ...INSTANCE_METHODS.map(toCompletion),
        ...INSTANCE_PROPERTIES.map(toCompletion),
        ...INSTANCE_EVENTS.map(toCompletion),
        ...SIGNAL_METHODS.map(toCompletion),
        ...REMOTE_EVENT_API.map(toCompletion),
        ...BASEPART_API.map(toCompletion),
        ...HUMANOID_API.map(toCompletion),
      ];
    }

    if (query.length > 0) {
      completions = completions.filter((c) =>
        c.label.toLowerCase().includes(query)
      );
    }

    return {
      from: word.from + lastSep + 1,
      options: completions,
      validFor: /^\w*$/,
    };
  }

  // Check if we're in GetService("...") or Instance.new("...")
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text.slice(0, context.pos - line.from);

  if (lineText.match(/GetService\s*\(\s*"?\s*$/)) {
    completions = SERVICES.map(toCompletion);
    return { from: word.from, options: completions, validFor: /^"?\w*$/ };
  }

  if (lineText.match(/Instance\.new\s*\(\s*"?\s*$/)) {
    completions = INSTANCE_CLASSES.map(toCompletion);
    return { from: word.from, options: completions, validFor: /^"?\w*$/ };
  }

  // General completions
  completions = [
    ...LUAU_KEYWORDS.map(toCompletion),
    ...GLOBAL_FUNCTIONS.map(toCompletion),
    ...GAME_API.filter((c) => c.type === 'variable').map(toCompletion),
    ...CODE_SNIPPETS.map((s) => ({
      label: s.label,
      type: 'text' as const,
      detail: s.detail,
      apply: s.snippet.replace(/\$\{\d+:([^}]*)}/g, '$1'),
      boost: -1,
    })),
  ];

  // Smart Typo Auto-Correct and Fuzzy Ranking
  const lower = text.toLowerCase();
  const correctedTypo = LUAU_AUTOCORRECT_MAP[text] || LUAU_AUTOCORRECT_MAP[lower];
  const results: Completion[] = [];

  if (correctedTypo) {
    results.push({
      label: correctedTypo,
      type: 'keyword',
      detail: `✨ Auto-correct: ${correctedTypo}`,
      info: `Suggested replacement for "${text}"`,
      boost: 100,
    });
  }

  for (const item of completions) {
    const itemLower = item.label.toLowerCase();
    if (itemLower === lower) {
      results.push({ ...item, boost: (item.boost || 0) + 50 });
    } else if (itemLower.startsWith(lower)) {
      results.push({ ...item, boost: (item.boost || 0) + 20 });
    } else if (itemLower.includes(lower)) {
      results.push({ ...item, boost: (item.boost || 0) + 5 });
    } else if (text.length >= 3 && isFuzzyMatch(lower, itemLower)) {
      results.push({ ...item, boost: (item.boost || 0) + 1 });
    }
  }

  return {
    from: word.from,
    options: results,
    validFor: /^\w*$/,
  };
}

function isFuzzyMatch(pattern: string, target: string): boolean {
  let patternIdx = 0;
  for (let i = 0; i < target.length && patternIdx < pattern.length; i++) {
    if (target[i] === pattern[patternIdx]) {
      patternIdx++;
    }
  }
  return patternIdx === pattern.length;
}

function toCompletion(item: CompletionItem): Completion {
  return {
    label: item.label,
    type: item.type,
    detail: item.detail,
    info: item.info,
    boost: item.boost,
  };
}

// ===== Auto-close Brackets Config =====
const closeBrackets = EditorView.inputHandler.of((view, from, to, text) => {
  const pairs: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
  };

  if (text in pairs && from === to) {
    const close = pairs[text];
    view.dispatch({
      changes: { from, to, insert: text + close },
      selection: { anchor: from + 1 },
    });
    return true;
  }

  // If typing a closing bracket and it's already there, skip it
  const closing = [')', ']', '}', '"', "'"];
  if (closing.includes(text)) {
    const nextChar = view.state.doc.sliceString(from, from + 1);
    if (nextChar === text) {
      view.dispatch({
        selection: { anchor: from + 1 },
      });
      return true;
    }
  }

  return false;
});

// ===== Create Editor State =====
export function createEditorState(
  doc: string,
  isDark: boolean,
  onUpdate?: (content: string) => void,
  fontSize?: number,
  onRun?: () => void,
  onCursorActivity?: (view: EditorView) => void
): EditorState {
  const customKeymaps = [
    {
      key: 'Enter',
      run: handleLuauEnter,
    },
    {
      key: 'Alt-Shift-f',
      run: formatCodeCommand,
    },
    {
      key: 'Shift-Alt-F',
      run: formatCodeCommand,
    },
  ];
  if (onRun) {
    customKeymaps.push({
      key: 'Mod-Enter',
      run: () => {
        onRun();
        return true;
      },
    });
  }

  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches({
      highlightWordAroundCursor: true,
      minSelectionLength: 2,
      wholeWords: true,
    }),
    search(),
    placeholder('-- Write your Luau code here...'),
    closeBrackets,
    luauAutoCorrectExtension,

    // Custom Semantic Roblox Highlighting, Color Swatches, and Hover Documentation
    robloxTokenHighlighter,
    colorPreviewPlugin,
    robloxHoverTooltips,

    // Keymaps
    keymap.of([
      ...customKeymaps,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      ...completionKeymap,
      ...foldKeymap,
      ...lintKeymap,
      indentWithTab,
    ]),

    // Tab size
    EditorState.tabSize.of(2),

    // Luau language support (using @fazelstudio/codemirror-lang-luau)
    luau(),

    // Theme
    themeCompartment.of([
      isDark ? darkTheme : lightTheme,
      syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle),
    ]),

    // Autocomplete
    autocompletion({
      override: [luauCompletions],
      activateOnTyping: true,
      maxRenderedOptions: 30,
    }),

    // Update listener
    EditorView.updateListener.of((update) => {
      if (update.docChanged && onUpdate) {
        onUpdate(update.state.doc.toString());
      }
      if ((update.docChanged || update.selectionSet) && onCursorActivity) {
        onCursorActivity(update.view);
      }
    }),
  ];

  if (fontSize) {
    extensions.push(
      EditorView.theme({
        '&': { fontSize: `${fontSize}px` },
      })
    );
  }

  return EditorState.create({
    doc,
    extensions,
  });
}
