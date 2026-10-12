import type { ScriptFile, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEYS = {
  SCRIPTS: 'luau-runner-scripts-v2',
  SETTINGS: 'luau-runner-settings-v2',
  ACTIVE_SCRIPT_ID: 'luau-runner-active-script-id-v2',
} as const;

export function saveScripts(scripts: ScriptFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCRIPTS, JSON.stringify(scripts));
  } catch (e) {
    console.error('Failed to save scripts to localStorage:', e);
  }
}

export function loadScripts(): ScriptFile[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCRIPTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as ScriptFile[];
      }
    }
  } catch (e) {
    console.error('Failed to load scripts from localStorage:', e);
  }
  return null;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveActiveScriptId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SCRIPT_ID, id);
  } catch (e) {
    console.error('Failed to save active script id:', e);
  }
}

export function loadActiveScriptId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCRIPT_ID);
  } catch {
    return null;
  }
}
