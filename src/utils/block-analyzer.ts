/**
 * Luau Block Analyzer
 * 
 * Analyzes the block structure of a Luau / Roblox script to find enclosing blocks,
 * matching 'end' statements, block ranges, and missing closures.
 */

export interface LuauBlock {
  type: 'function' | 'if' | 'while' | 'for' | 'do' | 'repeat' | 'callback';
  typeLabel: string;
  startLine: number;
  startCode: string;
  endLine: number | null;
  endCode: string | null;
  isClosed: boolean;
  lineCount: number;
  innerCode: string;
  suggestedCloser: string;
  parentBlock?: LuauBlock | null;
}

interface RawToken {
  type: 'open' | 'close' | 'intermediate';
  blockType?: LuauBlock['type'];
  line: number;
  code: string;
  closerText?: string;
}

/**
 * Strips comments and strings from a line to avoid false positives in keywords.
 */
function sanitizeLine(line: string): string {
  // Strip single-line comments
  let clean = line.replace(/--.*$/, '');
  // Strip double-quoted strings
  clean = clean.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // Strip single-quoted strings
  clean = clean.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return clean;
}

/**
 * Checks if a line contains block openers or closers.
 */
function analyzeLineTokens(lineText: string, lineNumber: number): RawToken[] {
  const clean = sanitizeLine(lineText);
  const trimmed = clean.trim();
  if (!trimmed) return [];

  const tokens: RawToken[] = [];

  // Check closers first: 'end' or 'until'
  // Look for standalone 'end' or 'end)' or 'end}' or 'end;'
  const endMatches = clean.match(/\bend\b(?:\s*[\)\}\]\;\,]*)?/g);
  const untilMatches = clean.match(/\buntil\b/g);

  // Check openers:
  // 1. function
  const hasFunction = /\bfunction\b/g.test(clean);
  // 2. while ... do
  const hasWhile = /\bwhile\b.*\bdo\b/g.test(clean);
  // 3. for ... do
  const hasFor = /\bfor\b.*\bdo\b/g.test(clean);
  // 4. standalone do
  const hasDo = /^\s*do\b|\bdo\s*$/g.test(clean) && !hasWhile && !hasFor;
  // 5. if ... then (statement, not inline if expression)
  // An if-statement typically has 'then' at end of line or without an assignment before 'if'
  const hasIf = /\bif\b.*\bthen\b/g.test(clean) && !/=\s*if\b/.test(clean);
  // 6. repeat
  const hasRepeat = /\brepeat\b/g.test(clean);

  // Check callback functions like Connect(function() or task.spawn(function()
  const isCallback = hasFunction && /[\(\,]\s*function\b/i.test(clean);

  if (hasFunction) {
    tokens.push({
      type: 'open',
      blockType: isCallback ? 'callback' : 'function',
      line: lineNumber,
      code: lineText.trim(),
      closerText: isCallback && clean.includes('(') ? 'end)' : 'end',
    });
  } else if (hasWhile) {
    tokens.push({
      type: 'open',
      blockType: 'while',
      line: lineNumber,
      code: lineText.trim(),
      closerText: 'end',
    });
  } else if (hasFor) {
    tokens.push({
      type: 'open',
      blockType: 'for',
      line: lineNumber,
      code: lineText.trim(),
      closerText: 'end',
    });
  } else if (hasDo) {
    tokens.push({
      type: 'open',
      blockType: 'do',
      line: lineNumber,
      code: lineText.trim(),
      closerText: 'end',
    });
  } else if (hasIf) {
    tokens.push({
      type: 'open',
      blockType: 'if',
      line: lineNumber,
      code: lineText.trim(),
      closerText: 'end',
    });
  } else if (hasRepeat) {
    tokens.push({
      type: 'open',
      blockType: 'repeat',
      line: lineNumber,
      code: lineText.trim(),
      closerText: 'until ',
    });
  }

  // Handle single-line blocks (e.g. "if x then return 1 end")
  if (endMatches) {
    for (const em of endMatches) {
      tokens.push({
        type: 'close',
        line: lineNumber,
        code: lineText.trim(),
        closerText: em,
      });
    }
  }

  if (untilMatches) {
    for (const um of untilMatches) {
      tokens.push({
        type: 'close',
        line: lineNumber,
        code: lineText.trim(),
        closerText: um,
      });
    }
  }

  return tokens;
}

/**
 * Parses all blocks from the script.
 */
export function parseScriptBlocks(code: string): LuauBlock[] {
  const lines = code.split('\n');
  const stack: {
    blockType: LuauBlock['type'];
    startLine: number;
    startCode: string;
    closerText: string;
  }[] = [];

  const completedBlocks: LuauBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const tokens = analyzeLineTokens(lines[i], lineNum);

    for (const token of tokens) {
      if (token.type === 'open') {
        stack.push({
          blockType: token.blockType || 'function',
          startLine: token.line,
          startCode: token.code,
          closerText: token.closerText || 'end',
        });
      } else if (token.type === 'close') {
        if (stack.length > 0) {
          const top = stack.pop()!;
          const innerLines = lines.slice(top.startLine, lineNum - 1);
          completedBlocks.push({
            type: top.blockType,
            typeLabel: getBlockTypeLabel(top.blockType),
            startLine: top.startLine,
            startCode: top.startCode,
            endLine: lineNum,
            endCode: lines[i].trim(),
            isClosed: true,
            lineCount: lineNum - top.startLine + 1,
            innerCode: innerLines.join('\n'),
            suggestedCloser: top.closerText,
          });
        }
      }
    }
  }

  // Any remaining unclosed blocks on the stack
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    const innerLines = lines.slice(unclosed.startLine);
    completedBlocks.push({
      type: unclosed.blockType,
      typeLabel: getBlockTypeLabel(unclosed.blockType),
      startLine: unclosed.startLine,
      startCode: unclosed.startCode,
      endLine: null,
      endCode: null,
      isClosed: false,
      lineCount: lines.length - unclosed.startLine + 1,
      innerCode: innerLines.join('\n'),
      suggestedCloser: unclosed.closerText,
    });
  }

  // Sort blocks by startLine ascending, then endLine descending (outermost first)
  completedBlocks.sort((a, b) => {
    if (a.startLine !== b.startLine) return a.startLine - b.startLine;
    return (b.endLine || 999999) - (a.endLine || 999999);
  });

  return completedBlocks;
}

/**
 * Human-readable block label
 */
export function getBlockTypeLabel(type: LuauBlock['type']): string {
  switch (type) {
    case 'function': return 'Function Block';
    case 'callback': return 'Callback / Event Block';
    case 'if': return 'If-Then Conditional Block';
    case 'while': return 'While-Do Loop Block';
    case 'for': return 'For-Do Loop Block';
    case 'do': return 'Do-End Block';
    case 'repeat': return 'Repeat-Until Loop Block';
    default: return 'Code Block';
  }
}

/**
 * Finds the innermost block that contains or matches the specified line.
 * If the line is exactly on the start or end line, it matches that block.
 */
export function findBlockAtLine(code: string, targetLine: number): LuauBlock | null {
  const allBlocks = parseScriptBlocks(code);
  if (allBlocks.length === 0) return null;

  // Filter blocks that contain targetLine
  const candidateBlocks = allBlocks.filter((b) => {
    const end = b.endLine || code.split('\n').length;
    return targetLine >= b.startLine && targetLine <= end;
  });

  if (candidateBlocks.length === 0) {
    // If target line is outside any block, return the nearest block
    let nearest: LuauBlock | null = null;
    let minDistance = Infinity;
    for (const b of allBlocks) {
      const dist = Math.min(
        Math.abs(b.startLine - targetLine),
        b.endLine ? Math.abs(b.endLine - targetLine) : Infinity
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = b;
      }
    }
    return nearest;
  }

  // Pick the most specific (innermost / smallest line count) block
  candidateBlocks.sort((a, b) => a.lineCount - b.lineCount);
  return candidateBlocks[0];
}
