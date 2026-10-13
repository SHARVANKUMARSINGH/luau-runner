// ===== Script Types =====
export type ScriptType = 'Script' | 'ServerScript' | 'LocalScript' | 'ModuleScript';

export interface ScriptFile {
  id: string;
  name: string;
  type: ScriptType;
  content: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ===== Console Types =====
export type ConsoleMessageType = 'output' | 'warn' | 'error' | 'info' | 'system';

export interface ConsoleMessage {
  id: string;
  type: ConsoleMessageType;
  text: string;
  timestamp: number;
  source?: string;
  line?: number;
}

// ===== Explorer Types =====
export interface ExplorerNode {
  name: string;
  className: string;
  children: ExplorerNode[];
  properties: Record<string, unknown>;
  expanded?: boolean;
  path: string;
}

// ===== Theme Types =====
export type ThemeMode = 'dark' | 'light';

// ===== Execution Types =====
export interface ExecutionResult {
  success: boolean;
  output: ConsoleMessage[];
  error?: string;
  duration: number;
}

export interface ExecutionState {
  running: boolean;
  scriptId: string | null;
  startTime: number | null;
}

// ===== Settings Types =====
export type EditorEngine = 'codemirror' | 'monaco';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  executionTimeout: number;
  showLineNumbers: boolean;
  autoSave: boolean;
  editorEngine: EditorEngine;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  executionTimeout: 10000,
  showLineNumbers: true,
  autoSave: true,
  editorEngine: 'codemirror',
};

// ===== Script Templates =====
export interface ScriptTemplate {
  id: string;
  name: string;
  type: ScriptType;
  description: string;
  content: string;
}
