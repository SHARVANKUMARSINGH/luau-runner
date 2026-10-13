import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faXmark, 
  faKey, 
  faArrowRight, 
  faCode, 
  faCopy, 
  faFileCirclePlus, 
  faRotateRight, 
  faCircleCheck, 
  faTriangleExclamation, 
  faWandMagicSparkles 
} from '@fortawesome/free-solid-svg-icons';
import type { ScriptFile, ScriptType } from '../types';
import { useDialog } from '../context/DialogContext';
import './AiAgentModal.css';

interface AiAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScript: ScriptFile | null;
  onUpdateActiveScriptContent: (newContent: string) => void;
  onCreateNewScript: (name: string, type: ScriptType, initialContent?: string) => void;
  isDark: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
}

const STORAGE_KEYS = {
  API_KEY: 'luau_openrouter_api_key',
  SELECTED_MODEL: 'luau_openrouter_model',
};

// Fallback high-performance and free models in case of network latency before fetch
const DEFAULT_MODELS: OpenRouterModel[] = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)', context_length: 1048576 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B Instruct (Free)', context_length: 131072 },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (V3)', context_length: 64000 },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', context_length: 200000 },
  { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o', context_length: 128000 },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini', context_length: 128000 },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B Instruct', context_length: 32768 },
];

export const AiAgentModal: React.FC<AiAgentModalProps> = ({
  isOpen,
  onClose,
  activeScript,
  onUpdateActiveScriptContent,
  onCreateNewScript,
  isDark,
}) => {
  const { showAlert } = useDialog();

  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.API_KEY) || '');
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(!apiKey);

  // Models State
  const [models, setModels] = useState<OpenRouterModel[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'google/gemini-2.0-flash-exp:free'
  );
  const [modelSearch, setModelSearch] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Prompt & Generation State
  const [prompt, setPrompt] = useState('');
  const [includeActiveScript, setIncludeActiveScript] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);

  // Fetch live list of models from OpenRouter
  const fetchLiveModels = useCallback(async (keyToUse?: string) => {
    setIsLoadingModels(true);
    try {
      const headers: Record<string, string> = {
        'HTTP-Referer': window.location.origin || 'https://luau-runner.dev',
        'X-Title': 'Luau Runner Roblox Engine',
      };
      const key = keyToUse || apiKey;
      if (key) {
        headers['Authorization'] = `Bearer ${key.trim()}`;
      }

      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const mapped: OpenRouterModel[] = json.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            context_length: m.context_length,
          }));
          setModels(mapped);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live OpenRouter models:', err);
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiKey]);

  // Initial load or when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLiveModels();
    }
  }, [isOpen, fetchLiveModels]);

  // Save API Key
  const handleSaveApiKey = () => {
    const trimmed = tempKeyInput.trim();
    if (!trimmed) {
      showAlert({
        title: 'API Key Required',
        message: 'Please enter a valid OpenRouter API key (sk-or-v1-...).',
        type: 'warning',
      });
      return;
    }
    setApiKey(trimmed);
    localStorage.setItem(STORAGE_KEYS.API_KEY, trimmed);
    setIsEditingKey(false);
    setTempKeyInput('');
    fetchLiveModels(trimmed);
  };

  const handleDisconnectKey = () => {
    setApiKey('');
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    setIsEditingKey(true);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  };

  // Filter models
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models;
    const q = modelSearch.toLowerCase();
    return models.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [models, modelSearch]);

  // Quick Preset Prompts
  const handleSelectPreset = (presetText: string) => {
    setPrompt(presetText);
  };

  // Extract Luau code snippet from Markdown response
  const extractedCode = useMemo(() => {
    if (!responseOutput) return null;
    const match = responseOutput.match(/```(?:luau|lua)?\n([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    // If output is pure code without backticks
    if (
      responseOutput.includes('local ') ||
      responseOutput.includes('function ') ||
      responseOutput.includes('task.wait')
    ) {
      return responseOutput.trim();
    }
    return null;
  }, [responseOutput]);

  // Call OpenRouter API
  const handleGenerate = async () => {
    if (!apiKey) {
      showAlert({
        title: 'Connect API Key',
        message: 'Please connect your OpenRouter API key above before generating or editing code.',
        type: 'warning',
      });
      return;
    }

    if (!prompt.trim()) {
      showAlert({
        title: 'Prompt Empty',
        message: 'Please enter instructions or what you would like the AI Agent to build, fix, or optimize.',
        type: 'info',
      });
      return;
    }

    setIsGenerating(true);
    setResponseOutput(null);

    const systemPrompt = `You are a world-class expert Luau and Roblox Engine game programmer.
You write modern, robust, production-ready Luau code following best practices:
- Use Roblox types (e.g., Vector3.new, CFrame.new, Color3.fromRGB, task.wait, task.spawn, TweenService, Players, Workspace, ReplicatedStorage).
- Write clean Luau code enclosed in standard markdown code blocks: \`\`\`luau ... \`\`\`.
- Keep explanations crisp, practical, and directly applicable.`;

    const userMessageContent = `
Task / Instructions:
${prompt.trim()}

${
  includeActiveScript && activeScript
    ? `Active Script Context:
Name: ${activeScript.name}
Type: ${activeScript.type}
Code:
\`\`\`luau
${activeScript.content}
\`\`\``
    : ''
}
`.trim();

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': window.location.origin || 'https://luau-runner.dev',
          'X-Title': 'Luau Runner Roblox Engine',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageContent },
          ],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter API error (${res.status}): ${errorText}`);
      }

      const json = await res.json();
      const answer = json.choices?.[0]?.message?.content;
      if (answer) {
        setResponseOutput(answer);
      } else {
        throw new Error('Received empty response from OpenRouter.');
      }
    } catch (err: any) {
      showAlert({
        title: 'AI Generation Failed',
        message: err.message || 'Could not communicate with OpenRouter API.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 1-Click Code Actions
  const handleReplaceScript = () => {
    if (!extractedCode) return;
    onUpdateActiveScriptContent(extractedCode);
    showAlert({
      title: 'Script Updated',
      message: `Active script "${activeScript?.name || 'Script'}" was successfully replaced with AI generated code!`,
      type: 'success',
    });
    onClose();
  };

  const handleAppendScript = () => {
    if (!extractedCode || !activeScript) return;
    const updated = `${activeScript.content.trimEnd()}\n\n-- [[ AI Generated ]] --\n${extractedCode}\n`;
    onUpdateActiveScriptContent(updated);
    showAlert({
      title: 'Code Appended',
      message: 'Generated Luau code was appended to the bottom of the active script.',
      type: 'success',
    });
    onClose();
  };

  const handleCreateNew = () => {
    if (!extractedCode) return;
    const name = `AI_${activeScript?.name || 'Script'}_${Math.floor(Math.random() * 900 + 100)}`;
    onCreateNewScript(name, activeScript?.type || 'Script', extractedCode);
    showAlert({
      title: 'New Script Created',
      message: `Created and opened new script "${name}".`,
      type: 'success',
    });
    onClose();
  };

  const handleCopyCode = async () => {
    const textToCopy = extractedCode || responseOutput;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showAlert({
        title: 'Copied',
        message: 'Code copied to clipboard!',
        type: 'success',
      });
    } catch {
      showAlert({
        title: 'Copy Failed',
        message: 'Unable to write to clipboard.',
        type: 'error',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`ai-modal-container ${isDark ? 'dark' : 'light'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-title">
            <FontAwesomeIcon icon={faRobot} />
            <span>Luau AI Agent</span>
            <span className="ai-modal-badge">OpenRouter Powered</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close AI Agent">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Body */}
        <div className="ai-modal-body">
          {/* OpenRouter Key Connection */}
          <div className="ai-key-section">
            <div className="ai-key-header">
              <span>
                <FontAwesomeIcon icon={faKey} style={{ marginRight: '6px' }} />
                OpenRouter API Connection
              </span>
              <span className={`ai-key-status ${apiKey ? 'connected' : 'disconnected'}`}>
                <FontAwesomeIcon icon={apiKey ? faCircleCheck : faTriangleExclamation} />
                <span>{apiKey ? 'Key Connected' : 'Not Connected'}</span>
              </span>
            </div>

            {isEditingKey ? (
              <div className="ai-key-input-row">
                <input
                  type="password"
                  className="ai-key-input"
                  placeholder="Paste your OpenRouter API Key (sk-or-v1-...)"
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                />
                <button type="button" className="btn-primary" onClick={handleSaveApiKey}>
                  Connect
                </button>
                {apiKey && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditingKey(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="ai-key-input-row" style={{ alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#a6adc8' }}>
                  sk-or-v1-••••••••••••••••••••••••{apiKey.slice(-4)}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingKey(true)}
                  style={{ marginLeft: 'auto' }}
                >
                  Change Key
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDisconnectKey}
                  style={{ color: '#f38ba8' }}
                >
                  Disconnect
                </button>
              </div>
            )}

            <div>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="ai-key-link"
              >
                Get a free OpenRouter API key at openrouter.ai →
              </a>
            </div>
          </div>

          {/* Model Selector Section */}
          <div className="ai-model-section">
            <div className="ai-model-label-row">
              <span>Select Model ({models.length} live models available)</span>
              {isLoadingModels && (
                <span style={{ fontSize: '0.75rem', color: '#cba6f7' }}>
                  <FontAwesomeIcon icon={faRotateRight} className="ai-spinner" style={{ marginRight: '4px' }} />
                  Fetching live models...
                </span>
              )}
            </div>

            <div className="ai-model-selector-group">
              <input
                type="text"
                className="ai-model-search-input"
                placeholder="Filter models (e.g. free, gemini, claude, llama, gpt)..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
              />
              <select
                className="ai-model-select"
                value={selectedModel}
                onChange={(e) => handleSelectModel(e.target.value)}
              >
                {filteredModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id} {m.context_length ? `(${(m.context_length / 1000).toFixed(0)}k)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Script Context Display */}
          {activeScript && (
            <div className="ai-script-context-card">
              <div className="ai-script-context-info">
                <FontAwesomeIcon icon={faCode} />
                <span>
                  Active: {activeScript.name} ({activeScript.type}) • {activeScript.content.split('\n').length} lines
                </span>
              </div>
              <label className="ai-script-context-toggle">
                <input
                  type="checkbox"
                  checked={includeActiveScript}
                  onChange={(e) => setIncludeActiveScript(e.target.checked)}
                />
                <span>Include script in AI context</span>
              </label>
            </div>
          )}

          {/* Prompt Presets */}
          <div className="ai-preset-chips">
            <button
              type="button"
              className="ai-chip-btn"
              onClick={() => handleSelectPreset('Fix any bugs, infinite loops, and optimize performance.')}
            >
              ⚡ Fix & Optimize
            </button>
            <button
              type="button"
              className="ai-chip-btn"
              onClick={() => handleSelectPreset('Create a complete Roblox Leaderstats system with Gold, Level, and saving.')}
            >
              🏆 Leaderstats System
            </button>
            <button
              type="button"
              className="ai-chip-btn"
              onClick={() => handleSelectPreset('Add full Luau type annotations and strict safety to this script.')}
            >
              🛡️ Add Luau Types
            </button>
            <button
              type="button"
              className="ai-chip-btn"
              onClick={() => handleSelectPreset('Convert this code into a clean, reusable Luau ModuleScript.')}
            >
              📦 Convert to ModuleScript
            </button>
            <button
              type="button"
              className="ai-chip-btn"
              onClick={() => handleSelectPreset('Explain how this script works and detail any potential memory leaks.')}
            >
              💡 Explain Script
            </button>
          </div>

          {/* Prompt Input */}
          <div className="ai-prompt-area">
            <textarea
              className="ai-prompt-textarea"
              placeholder="What do you want the AI Agent to build, edit, or fix in your Luau script? (e.g. Create a smooth tween door, fix while true loop, add sound effects...)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleGenerate();
                }
              }}
            />
            <div className="ai-actions-row">
              <button
                type="button"
                className="ai-btn-generate"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <FontAwesomeIcon icon={faRotateRight} className="ai-spinner" />
                    <span>Generating Luau Code...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWandMagicSparkles} />
                    <span>Generate / Edit Code (Ctrl+Enter)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Output & Apply Actions */}
          {responseOutput && (
            <div className="ai-response-card">
              <div className="ai-response-header">
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: '#cba6f7', marginRight: '6px' }} />
                  AI Agent Output
                </span>
                <div className="ai-response-actions">
                  {extractedCode && (
                    <>
                      <button
                        type="button"
                        className="ai-apply-btn replace"
                        onClick={handleReplaceScript}
                        title="Replace active script content with generated code"
                      >
                        <FontAwesomeIcon icon={faCode} />
                        <span>Replace Active Script</span>
                      </button>
                      <button
                        type="button"
                        className="ai-apply-btn append"
                        onClick={handleAppendScript}
                        title="Append code to the end of active script"
                      >
                        <FontAwesomeIcon icon={faArrowRight} />
                        <span>Append Code</span>
                      </button>
                      <button
                        type="button"
                        className="ai-apply-btn new-script"
                        onClick={handleCreateNew}
                        title="Create a new script tab with generated code"
                      >
                        <FontAwesomeIcon icon={faFileCirclePlus} />
                        <span>New Script Tab</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="ai-apply-btn copy"
                    onClick={handleCopyCode}
                    title="Copy response to clipboard"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <div className="ai-response-content">{responseOutput}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAgentModal;
