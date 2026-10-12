/**
 * Luau / Roblox Code Formatter & Beautifier
 * 
 * Automatically formats code with proper indentation, standardizes 
 * block nesting (function, if/then, while/do, for/do, repeat/until, tables),
 * and cleans up trailing whitespace.
 */

export function formatLuauCode(source: string, indentSize = 2): string {
  const lines = source.split(/\r?\n/);
  const indentStr = ' '.repeat(indentSize);
  let currentIndent = 0;
  const formattedLines: string[] = [];

  // Patterns that decrease indent before line
  const dedentBefore = /^\s*(end|until|else|elseif|\})/i;
  // Patterns that only dedent for that line (like else, elseif)
  const dedentMiddle = /^\s*(else|elseif)\b/i;
  // Patterns that increase indent after line
  const indentAfter = /\b(then|do|repeat|function\s*\(|function\s+[\w.:]+\s*\()(\s*--.*)?$|(\{|\[)\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    if (!rawLine) {
      formattedLines.push('');
      continue;
    }

    // Pure comment line: keep current indent and do not parse for keywords
    if (rawLine.startsWith('--')) {
      formattedLines.push(indentStr.repeat(currentIndent) + rawLine);
      continue;
    }

    // Check if this line closes a block
    if (dedentBefore.test(rawLine)) {
      currentIndent = Math.max(0, currentIndent - 1);
    }

    // Indent current line
    const formatted = indentStr.repeat(currentIndent) + rawLine;
    formattedLines.push(formatted);

    // If it was else or elseif, re-increase indent for its body
    if (dedentMiddle.test(rawLine)) {
      currentIndent++;
    }

    // Check if this line opens a block
    if (indentAfter.test(rawLine)) {
      currentIndent++;
    } else {
      // Check block openings like "local function ...", "function ...", "while ... do", "if ... then"
      const opens = (rawLine.match(/\b(function|then|do|repeat)\b/g) || []).length;
      const closes = (rawLine.match(/\b(end|until)\b/g) || []).length;
      const openBrackets = (rawLine.match(/[{[]/g) || []).length;
      const closeBrackets = (rawLine.match(/[}\]]/g) || []).length;

      // Adjust if multiple on same line (e.g. inline function)
      const diff = (opens + openBrackets) - (closes + closeBrackets);
      if (diff > 0 && !indentAfter.test(rawLine)) {
        currentIndent += diff;
      }
    }
  }

  return formattedLines.join('\n');
}
