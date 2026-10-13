import type { ConsoleMessage, ScriptFile, ExplorerNode } from '../types';
import { generateRobloxPreamble } from './roblox-preamble';

export interface EngineCallbacks {
  onOutput: (msg: ConsoleMessage) => void;
  onComplete: (success: boolean, duration: number) => void;
  onError: (error: string) => void;
  onTreeSync?: (tree: ExplorerNode) => void;
}

interface LuauWebModuleType {
  LuauState: {
    createAsync: (globals?: Record<string, unknown>) => Promise<{
      stateIdx: number;
      loadstring: (source: string, chunkname?: string, throwOnCompilationError?: boolean) => (...args: unknown[]) => Promise<unknown[]>;
      destroy: () => void;
    }>;
  };
  InternalLuauWasmModule: {
    states: Array<unknown>;
    options: Map<string, boolean>;
  };
}

let luauWebModule: LuauWebModuleType | null = null;
let luauLoadAttempted = false;
let luauLoadError: string | null = null;

let isExecuting = false;
let currentAbortController: AbortController | null = null;

/**
 * Initialize the Luau WASM module
 */
export async function initLuauEngine(): Promise<boolean> {
  if (luauWebModule) return true;
  if (luauLoadAttempted) return false;
  luauLoadAttempted = true;

  try {
    const mod = await import('luau-web');
    luauWebModule = mod as unknown as LuauWebModuleType;
    return true;
  } catch (e) {
    luauLoadError = e instanceof Error ? e.message : String(e);
    console.error('Failed to load luau-web WASM:', e);
    return false;
  }
}

export function isEngineReady(): boolean {
  return luauWebModule !== null;
}

export function getEngineError(): string | null {
  return luauLoadError;
}

export function isScriptRunning(): boolean {
  return isExecuting;
}

export function stopExecution(): void {
  if (currentAbortController) {
    currentAbortController.abort();
  }
}

/**
 * Recursively converts a LuauTable or proxy object from luau-web into native JS objects and arrays
 */
export function luauTableToJs(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;

  if (Array.isArray(val)) {
    return val.map((v) => luauTableToJs(v));
  }

  // Handle iterable LuauTable / Map proxy from luau-web
  if (typeof (val as Record<symbol, unknown>)[Symbol.iterator] === 'function') {
    try {
      const entries = Array.from(val as Iterable<[unknown, unknown]>);
      const isArray = entries.length === 0 || entries.every(([k]) => typeof k === 'number');
      if (isArray) {
        return entries.map(([, v]) => luauTableToJs(v));
      }
      const obj: Record<string, unknown> = {};
      for (const [k, v] of entries) {
        obj[String(k)] = luauTableToJs(v);
      }
      return obj;
    } catch {
      // Fallback below
    }
  }

  try {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      obj[k] = luauTableToJs(v);
    }
    return obj;
  } catch {
    return val;
  }
}

/**
 * Sanitizes and guarantees that an ExplorerNode is a safe native JS object
 * with children guaranteed to be a native JS Array.
 */
export function sanitizeExplorerNode(raw: unknown): ExplorerNode {
  let converted: Record<string, unknown>;

  if (typeof raw === 'string') {
    try {
      converted = JSON.parse(raw);
    } catch {
      converted = {};
    }
  } else if (raw && typeof raw === 'object') {
    converted = (luauTableToJs(raw) as Record<string, unknown>) || {};
  } else {
    converted = {};
  }

  const rawChildren = converted.children;
  let children: ExplorerNode[] = [];
  if (Array.isArray(rawChildren)) {
    children = rawChildren.map((c) => sanitizeExplorerNode(c));
  } else if (rawChildren && typeof rawChildren === 'object') {
    children = Object.values(rawChildren).map((c) => sanitizeExplorerNode(c));
  }

  let properties: Record<string, unknown> = {};
  if (converted.properties && typeof converted.properties === 'object' && !Array.isArray(converted.properties)) {
    properties = converted.properties as Record<string, unknown>;
  }

  return {
    name: String(converted.name || 'Instance'),
    className: String(converted.className || 'Instance'),
    path: String(converted.path || ''),
    children,
    properties,
  };
}

/**
 * Preprocesses user code to handle common mobile auto-capitalization errors
 * and common Lua typos like 'while ture do'.
 */
export function preprocessUserCode(code: string): { processed: string; notices: string[] } {
  const notices: string[] = [];
  let processed = code;

  // 1. Detect common typo 'ture' -> 'true'
  if (/\bture\b/.test(processed)) {
    notices.push("Typo notice: 'ture' detected in script; aliased to 'true' for execution.");
  }

  // 2. Detect common typo 'flase' -> 'false'
  if (/\bflase\b/.test(processed)) {
    notices.push("Typo notice: 'flase' detected in script; aliased to 'false' for execution.");
  }

  // 3. Preprocess mobile auto-capitalized keywords at the start of statements/lines
  const mobileKeywords = [
    { cap: 'Local', lower: 'local' },
    { cap: 'While', lower: 'while' },
    { cap: 'Function', lower: 'function' },
    { cap: 'Repeat', lower: 'repeat' },
    { cap: 'Until', lower: 'until' },
    { cap: 'Return', lower: 'return' },
    { cap: 'If', lower: 'if' },
    { cap: 'Elseif', lower: 'elseif' },
    { cap: 'Else', lower: 'else' },
    { cap: 'For', lower: 'for' },
    { cap: 'Do', lower: 'do' },
  ];

  let autocorrectedAny = false;
  for (const { cap, lower } of mobileKeywords) {
    const lineStartRegex = new RegExp(`^(\\s*)${cap}\\b`, 'gm');
    if (lineStartRegex.test(processed)) {
      processed = processed.replace(lineStartRegex, `$1${lower}`);
      autocorrectedAny = true;
    }
  }

  if (autocorrectedAny) {
    notices.push("Mobile keyboard notice: Auto-corrected line-start capitalized keywords (e.g. 'Local' -> 'local').");
  }

  return { processed, notices };
}

/**
 * Executes a Luau script using the authentic luau-web WebAssembly VM
 */
export async function executeLuauScript(
  activeScript: ScriptFile,
  allScripts: ScriptFile[],
  callbacks: EngineCallbacks,
  timeoutMs = 10000
): Promise<void> {
  if (isExecuting) {
    callbacks.onError('A script is already running. Please wait or click Stop.');
    return;
  }

  const ready = await initLuauEngine();
  if (!ready || !luauWebModule) {
    callbacks.onError(`Luau WebAssembly runtime could not be loaded: ${luauLoadError || 'Unknown error'}`);
    return;
  }

  isExecuting = true;
  currentAbortController = new AbortController();
  const startTime = performance.now();
  const { signal } = currentAbortController;

  const now = () => Date.now();
  let msgCounter = 0;
  const createMsg = (
    type: ConsoleMessage['type'],
    text: string,
    source?: string,
    line?: number
  ): ConsoleMessage => ({
    id: `msg_${now()}_${++msgCounter}`,
    type,
    text,
    timestamp: now(),
    source,
    line,
  });

  const contextName = activeScript.type === 'LocalScript' ? 'Client' : 'Server';
  const timeoutText = timeoutMs <= 0 || !isFinite(timeoutMs) ? ' (Infinite Timeout)' : ` (${timeoutMs / 1000}s limit)`;
  callbacks.onOutput(
    createMsg('system', `▶ Running ${activeScript.type} "${activeScript.name}" [${contextName} Context]${timeoutText}`)
  );

  let state: {
    stateIdx: number;
    loadstring: (source: string, chunkname?: string, throwOnCompilationError?: boolean) => (...args: unknown[]) => Promise<unknown[]>;
    destroy: () => void;
  } | null = null;

  try {
    const preamble = generateRobloxPreamble(activeScript.type, allScripts);

    // Globals exposed to Luau
    const globals: Record<string, unknown> = {
      print: (...args: unknown[]) => {
        const text = args
          .map((a) => {
            if (a === null || a === undefined) return 'nil';
            if (typeof a === 'object') {
              try {
                return JSON.stringify(a);
              } catch {
                return String(a);
              }
            }
            return String(a);
          })
          .join('    ');
        callbacks.onOutput(createMsg('output', text, activeScript.name));
      },

      warn: (...args: unknown[]) => {
        const text = args
          .map((a) => (a === null || a === undefined ? 'nil' : String(a)))
          .join('    ');
        callbacks.onOutput(createMsg('warn', text, activeScript.name));
      },

      error: (msg: unknown) => {
        const text = String(msg ?? 'nil');
        callbacks.onOutput(createMsg('error', text, activeScript.name));
        throw new Error(text);
      },

      __task_wait_async: async (dur: number) => {
        if (signal.aborted) throw new Error('Execution aborted');
        const seconds = typeof dur === 'number' && dur > 0 ? dur : 1 / 30;
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, seconds * 1000);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Script execution cancelled'));
          });
        });
        return seconds;
      },

      __task_spawn_async: (fn: () => void) => {
        try {
          fn();
        } catch (e) {
          callbacks.onOutput(createMsg('error', `task.spawn error: ${e}`, activeScript.name));
        }
      },

      __bridge_on_tree_sync: (treeData: unknown) => {
        if (callbacks.onTreeSync && treeData) {
          try {
            const sanitizedTree = sanitizeExplorerNode(treeData);
            callbacks.onTreeSync(sanitizedTree);
          } catch (err) {
            console.warn('Failed to sanitize explorer tree:', err);
          }
        }
      },
    };

    // Configure options in luau-web
    luauWebModule.InternalLuauWasmModule.options.set('LUA_NONSTRICT_READONLY', true);
    luauWebModule.InternalLuauWasmModule.options.set('LUA_IMPLICIT_ARRAYS_TO_JS_ARRAYS', true);

    // Create state
    state = await luauWebModule.LuauState.createAsync(globals);

    // Synchronize state index 0 for C++ callbacks in luau-web v1.5.1
    luauWebModule.InternalLuauWasmModule.states[0] =
      luauWebModule.InternalLuauWasmModule.states[state.stateIdx];

    // Preprocess code for common mobile keyboard auto-capitalization and typos
    const { processed: processedCode, notices } = preprocessUserCode(activeScript.content);

    // Output helpful notices if any typos or mobile auto-caps were corrected
    for (const notice of notices) {
      callbacks.onOutput(createMsg('info', `ℹ️ ${notice}`, activeScript.name));
    }

    // Combine preamble + user script + tree sync call
    const fullCode = `${preamble}\n\n-- [[ User Script ]] --\n${processedCode}\n\n__sync_explorer_tree()\n`;

    // Compile script with Luau
    const fn = state.loadstring(fullCode, activeScript.name, true);

    // Timeout protection (Infinite when timeoutMs <= 0)
    const timeoutPromise = new Promise<never>((_, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      if (typeof timeoutMs === 'number' && timeoutMs > 0 && isFinite(timeoutMs)) {
        timer = setTimeout(() => {
          reject(new Error(`Script execution timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);
      }

      signal.addEventListener('abort', () => {
        if (timer) clearTimeout(timer);
        reject(new Error('Script execution cancelled'));
      });
    });

    // Execute script
    await Promise.race([fn(), timeoutPromise]);

    if (!signal.aborted) {
      const duration = performance.now() - startTime;
      callbacks.onOutput(
        createMsg('system', `✓ Execution finished in ${(duration / 1000).toFixed(3)}s`)
      );
      callbacks.onComplete(true, duration);
    }
  } catch (err: unknown) {
    const duration = performance.now() - startTime;
    let rawMsg = err instanceof Error ? err.message : String(err);

    if (signal.aborted || rawMsg.includes('cancelled') || rawMsg.includes('aborted')) {
      callbacks.onOutput(createMsg('system', '⏹ Execution stopped by user'));
    } else {
      // Calculate correct line number by subtracting preamble
      const lineMatch = rawMsg.match(/:(\d+):/);
      let scriptLine: number | undefined;

      if (lineMatch) {
        const rawLine = parseInt(lineMatch[1], 10);
        const preambleLines = generateRobloxPreamble(activeScript.type, allScripts).split('\n').length;
        if (rawLine > preambleLines) {
          scriptLine = rawLine - preambleLines - 1;
          rawMsg = rawMsg.replace(`:${rawLine}:`, `:${scriptLine}:`);
        }
      }

      callbacks.onOutput(createMsg('error', rawMsg, activeScript.name, scriptLine));
    }
    callbacks.onComplete(false, duration);
  } finally {
    if (state) {
      try {
        state.destroy();
      } catch {
        // Ignore destroy error
      }
    }
    isExecuting = false;
    currentAbortController = null;
  }
}
