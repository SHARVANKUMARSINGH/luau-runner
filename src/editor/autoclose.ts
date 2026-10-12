/**
 * Luau / Roblox Smart Auto-Close, Auto-Indentation & Auto-Correction
 * 
 * Automatically closes blocks on Enter:
 *   - while ... do -> end
 *   - for ... do -> end
 *   - if ... then -> end
 *   - function(...) -> end
 *   - button.MouseButton1Click:Connect(function(...) -> end)
 *   - task.spawn(function(...) -> end)
 *   - repeat -> until 
 *   - { -> }
 * 
 * Also corrects common typos (e.g., While -> while, ture -> true, flase -> false, funtion -> function)
 * both on Enter and when pressing Space!
 */

import { EditorView } from '@codemirror/view';

// Common Luau typos and capitalized keywords mapping
export const LUAU_AUTOCORRECT_MAP: Record<string, string> = {
  // Boolean & Nil typos
  'ture': 'true',
  'Ture': 'true',
  'TRUE': 'true',
  'flase': 'false',
  'Flase': 'false',
  'FALSE': 'false',
  'nill': 'nil',
  'Nil': 'nil',
  'NIL': 'nil',

  // Keyword capitalizations
  'Local': 'local',
  'LOCAL': 'local',
  'Function': 'function',
  'FUNCTION': 'function',
  'While': 'while',
  'WHILE': 'while',
  'For': 'for',
  'FOR': 'for',
  'If': 'if',
  'IF': 'if',
  'Then': 'then',
  'THEN': 'then',
  'Else': 'else',
  'ELSE': 'else',
  'Elseif': 'elseif',
  'ELSEIF': 'elseif',
  'Do': 'do',
  'DO': 'do',
  'End': 'end',
  'END': 'end',
  'Repeat': 'repeat',
  'REPEAT': 'repeat',
  'Until': 'until',
  'UNTIL': 'until',
  'Return': 'return',
  'RETURN': 'return',
  'Break': 'break',
  'BREAK': 'break',
  'Continue': 'continue',
  'CONTINUE': 'continue',
  'And': 'and',
  'AND': 'and',
  'Or': 'or',
  'OR': 'or',
  'Not': 'not',
  'NOT': 'not',

  // Common spelling typos
  'whiel': 'while',
  'whle': 'while',
  'wihle': 'while',
  'funtion': 'function',
  'funciton': 'function',
  'fuction': 'function',
  'fucntion': 'function',
  'fnction': 'function',
  'locl': 'local',
  'loacl': 'local',
  'lcoal': 'local',
  'locall': 'local',
  'pritn': 'print',
  'prnt': 'print',
  'pirnt': 'print',
  'taks': 'task',
  'tsak': 'task',
  'reutrn': 'return',
  'retun': 'return',
  'retrun': 'return',
  'untill': 'until',
  'untl': 'until',
  'palyer': 'player',
  'plyer': 'player',
  'wokrspace': 'workspace',
  'workpsace': 'workspace',
};

/**
 * Checks whether a character index on a line is inside a string literal or comment.
 */
export function isInsideStringOrComment(lineText: string, col: number): boolean {
  let inString: string | null = null;
  for (let i = 0; i < col; i++) {
    const ch = lineText[i];
    if (inString) {
      if (ch === inString && lineText[i - 1] !== '\\') {
        inString = null;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inString = ch;
      } else if (ch === '-' && lineText[i + 1] === '-') {
        return true; // Rest of line is comment
      }
    }
  }
  return inString !== null;
}

/**
 * Autocorrects words in code outside of strings and comments.
 */
export function autocorrectCode(str: string): string {
  let result = '';
  let inString: string | null = null;
  let i = 0;

  while (i < str.length) {
    const ch = str[i];
    if (inString) {
      result += ch;
      if (ch === inString && str[i - 1] !== '\\') {
        inString = null;
      }
      i++;
    } else if (ch === '"' || ch === "'") {
      inString = ch;
      result += ch;
      i++;
    } else if (ch === '-' && str[i + 1] === '-') {
      result += str.slice(i);
      break;
    } else if (/[a-zA-Z0-9_]/.test(ch)) {
      let word = '';
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        word += str[i];
        i++;
      }
      if (LUAU_AUTOCORRECT_MAP[word]) {
        result += LUAU_AUTOCORRECT_MAP[word];
      } else {
        result += word;
      }
    } else {
      result += ch;
      i++;
    }
  }

  return result;
}

/**
 * Analyzes code before the cursor and returns the matching closer:
 * e.g., 'end', 'end)', 'until ', '}', etc.
 */
export function analyzeBlockOpen(code: string): string | null {
  const trimmed = code.trim();
  // Strip trailing comments
  const stripped = trimmed.replace(/--.*$/, '').trim();
  if (!stripped) return null;

  // Count unclosed parentheses and braces
  let openParen = 0;
  let openBrace = 0;
  let inString: string | null = null;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inString) {
      if (ch === inString && stripped[i - 1] !== '\\') {
        inString = null;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inString = ch;
      } else if (ch === '(') {
        openParen++;
      } else if (ch === ')') {
        openParen--;
      } else if (ch === '{') {
        openBrace++;
      } else if (ch === '}') {
        openBrace--;
      }
    }
  }

  // Check function declarations (both standalone and callbacks)
  if (/\bfunction\b/i.test(stripped)) {
    if (openParen > 0) {
      // Callback inside parentheses: e.g. Connect(function() or task.spawn(function()
      return 'end' + '}'.repeat(Math.max(0, openBrace)) + ')'.repeat(openParen);
    }
    return 'end';
  }

  // Check while ... do, for ... do, if ... then, elseif ... then
  if (/\b(do|then)\b$/i.test(stripped)) {
    return 'end';
  }

  // Check repeat ... until
  if (/\brepeat\b$/i.test(stripped)) {
    return 'until ';
  }

  // Check opening table constructor
  if (/\{$/.test(stripped)) {
    return '}';
  }

  return null;
}

/**
 * Keymap handler for Enter key:
 * Autocorrects typos on the line, detects if a block was opened,
 * auto-indents the body line, and automatically inserts the matching closer!
 */
export function handleLuauEnter(view: EditorView): boolean {
  const { state } = view;
  const { selection } = state;
  if (!selection.main.empty) return false;

  const pos = selection.main.head;
  const line = state.doc.lineAt(pos);
  const lineText = line.text;
  const col = pos - line.from;
  const beforeCursor = lineText.slice(0, col);
  const afterCursor = lineText.slice(col);

  // If inside a string or comment, let default Enter handle it
  if (isInsideStringOrComment(lineText, col)) {
    return false;
  }

  // If there is code after cursor (not just whitespace or comment), let default Enter split
  if (afterCursor.trim() && !afterCursor.trim().startsWith('--')) {
    return false;
  }

  // Indentation calculation
  const indentMatch = lineText.match(/^(\s*)/);
  const currentIndent = indentMatch ? indentMatch[1] : '';
  const tabSize = state.tabSize || 2;
  const singleIndent = ' '.repeat(tabSize);
  const nextIndent = currentIndent + singleIndent;

  // Autocorrect beforeCursor
  const correctedBefore = autocorrectCode(beforeCursor);
  const closer = analyzeBlockOpen(correctedBefore);

  if (!closer) {
    // If not a block opener, check if typos were autocorrected
    if (correctedBefore !== beforeCursor) {
      view.dispatch({
        changes: [
          { from: line.from, to: pos, insert: correctedBefore },
          { from: pos, to: pos, insert: '\n' + currentIndent },
        ],
        selection: { anchor: line.from + correctedBefore.length + 1 + currentIndent.length },
      });
      return true;
    }
    return false;
  }

  // Check if subsequent non-empty line already has a matching closer
  let hasMatchingClose = false;
  const doc = state.doc;
  let nextLineNum = line.number + 1;
  while (nextLineNum <= doc.lines) {
    const nextLine = doc.line(nextLineNum);
    const trimmed = nextLine.text.trim();
    if (trimmed !== '') {
      if (
        trimmed === closer.trim() ||
        trimmed.startsWith('end') ||
        trimmed.startsWith('until') ||
        trimmed === '}'
      ) {
        hasMatchingClose = true;
      }
      break;
    }
    nextLineNum++;
  }

  if (hasMatchingClose) {
    // Just indent into the block without adding duplicate closer
    const changes = [];
    if (correctedBefore !== beforeCursor) {
      changes.push({ from: line.from, to: pos, insert: correctedBefore });
    }
    changes.push({ from: pos, to: pos, insert: '\n' + nextIndent });
    const newHead = (correctedBefore !== beforeCursor ? line.from + correctedBefore.length : pos) + 1 + nextIndent.length;

    view.dispatch({
      changes,
      selection: { anchor: newHead },
    });
    return true;
  }

  // Insert indented line AND closer line
  const newlineAndIndent = '\n' + nextIndent;
  const closerLine = '\n' + currentIndent + closer;
  const changes = [];
  if (correctedBefore !== beforeCursor) {
    changes.push({ from: line.from, to: pos, insert: correctedBefore });
  }
  changes.push({ from: pos, to: pos, insert: newlineAndIndent + closerLine });

  const cursorTarget = (correctedBefore !== beforeCursor ? line.from + correctedBefore.length : pos) + newlineAndIndent.length;

  view.dispatch({
    changes,
    selection: { anchor: cursorTarget },
  });
  return true;
}

/**
 * EditorView input handler:
 * Autocorrects typos immediately when typing Space or '('
 */
export const luauAutoCorrectExtension = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== ' ' && text !== '(' && text !== ':' && text !== '.') return false;
  if (from !== to) return false;

  const line = view.state.doc.lineAt(from);
  const lineText = line.text;
  const col = from - line.from;

  // Don't autocorrect inside strings or comments
  if (isInsideStringOrComment(lineText, col)) return false;

  // Find word immediately before cursor
  let start = col;
  while (start > 0 && /[a-zA-Z0-9_]/.test(lineText[start - 1])) {
    start--;
  }
  const word = lineText.slice(start, col);
  if (!word) return false;

  const corrected = LUAU_AUTOCORRECT_MAP[word];
  if (corrected && corrected !== word) {
    view.dispatch({
      changes: [
        { from: line.from + start, to: from, insert: corrected + text },
      ],
      selection: { anchor: line.from + start + corrected.length + text.length },
    });
    return true;
  }

  return false;
});
