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
  callbacks.onOutput(
    createMsg('system', `▶ Running ${activeScript.type} "${activeScript.name}" [${contextName} Context]`)
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
          callbacks.onTreeSync(treeData as ExplorerNode);
        }
      },
    };

    // Configure options in luau-web
    luauWebModule.InternalLuauWasmModule.options.set('LUA_NONSTRICT_READONLY', true);

    // Create state
    state = await luauWebModule.LuauState.createAsync(globals);

    // Synchronize state index 0 for C++ callbacks in luau-web v1.5.1
    luauWebModule.InternalLuauWasmModule.states[0] =
      luauWebModule.InternalLuauWasmModule.states[state.stateIdx];

    // Combine preamble + user script + tree sync call
    const fullCode = `${preamble}\n\n-- [[ User Script ]] --\n${activeScript.content}\n\n__sync_explorer_tree()\n`;

    // Compile script with Luau
    const fn = state.loadstring(fullCode, activeScript.name, true);

    // Timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Script execution timed out after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
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
