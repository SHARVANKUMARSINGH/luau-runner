/**
 * Roblox & Luau Custom Highlighting, Color Swatches, and Hover Documentation
 * 
 * Provides:
 * 1. Semantic highlighting for Roblox globals, services, methods, builtins, booleans, etc.
 * 2. Inline color preview swatches for Color3.fromRGB, Color3.new, Color3.fromHex
 * 3. Rich interactive hover documentation tooltips for Roblox APIs
 */

import { MatchDecorator, ViewPlugin, Decoration, type DecorationSet, WidgetType, hoverTooltip } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

// ===== 1. Custom Roblox Semantic Token Highlighting =====
const ROBLOX_TOKENS_REGEX = new RegExp(
  '\\b(' +
  // Roblox Globals & Datatypes
  'game|workspace|script|task|Instance|Vector3|Vector2|CFrame|Color3|UDim2|UDim|TweenInfo|Enum|' +
  'RaycastParams|ColorSequence|ColorSequenceKeypoint|NumberSequence|NumberSequenceKeypoint|' +
  'NumberRange|Rect|PhysicalProperties|Random|DateTime|Axes|Faces|' +
  // Core Services
  'Workspace|Players|Lighting|ReplicatedStorage|ServerStorage|ServerScriptService|' +
  'StarterGui|StarterPlayer|StarterPack|SoundService|TweenService|RunService|' +
  'UserInputService|HttpService|ContextActionService|Debris|BadgeService|MarketplaceService|' +
  // Common Instance Methods
  'GetService|WaitForChild|FindFirstChild|FindFirstChildOfClass|FindFirstChildWhichIsA|' +
  'GetChildren|GetDescendants|IsA|GetFullName|Clone|Destroy|ClearAllChildren|' +
  // Events & Signals
  'Connect|Disconnect|Fire|Wait|FireServer|FireClient|FireAllClients|InvokeServer|InvokeClient|' +
  // Global Functions
  'print|warn|error|require|typeof|pcall|xpcall|setmetatable|getmetatable|rawget|rawset|' +
  'rawequal|rawlen|tostring|tonumber|assert|newproxy|select|unpack|ipairs|pairs|' +
  // Task library methods
  'spawn|delay|defer|cancel|' +
  // Common properties
  'Parent|Name|ClassName|Position|Size|Anchored|CanCollide|Transparency|Color|Material|Value|Text|Enabled|UserId|' +
  // Common Signals
  'Changed|ChildAdded|ChildRemoved|Destroying|OnServerEvent|OnClientEvent|Event|' +
  // Control keywords & end (Roblox Studio Purple)
  'end|then|do|while|repeat|until|if|else|elseif|for|function|local|return|break|continue|' +
  // Literals & booleans (including common typos)
  'true|false|nil|ture|flase|self' +
  ')\\b',
  'g'
);

const robloxDecorator = new MatchDecorator({
  regexp: ROBLOX_TOKENS_REGEX,
  decoration: (match) => {
    const word = match[1];

    // Dedicated Roblox Studio purple for 'end'
    if (word === 'end') {
      return Decoration.mark({ class: 'cm-roblox-end' });
    }

    // Control flow keywords in Roblox Studio purple
    if (
      word === 'then' || word === 'do' || word === 'while' || word === 'repeat' ||
      word === 'until' || word === 'if' || word === 'else' || word === 'elseif' ||
      word === 'for' || word === 'function' || word === 'local' || word === 'return' ||
      word === 'break' || word === 'continue'
    ) {
      return Decoration.mark({ class: 'cm-roblox-keyword' });
    }

    // Booleans & nil
    if (word === 'true' || word === 'false' || word === 'nil' || word === 'ture' || word === 'flase') {
      return Decoration.mark({ class: 'cm-roblox-bool' });
    }

    // Self
    if (word === 'self') {
      return Decoration.mark({ class: 'cm-roblox-self' });
    }

    // Core Globals & Datatypes
    if (
      word === 'game' || word === 'workspace' || word === 'script' || word === 'task' ||
      word === 'Instance' || word === 'Vector3' || word === 'Vector2' || word === 'CFrame' ||
      word === 'Color3' || word === 'UDim2' || word === 'UDim' || word === 'TweenInfo' ||
      word === 'Enum' || word === 'RaycastParams' || word === 'ColorSequence' ||
      word === 'NumberSequence' || word === 'NumberRange' || word === 'Rect' ||
      word === 'DateTime' || word === 'Random'
    ) {
      return Decoration.mark({ class: 'cm-roblox-global' });
    }

    // Services
    if (
      word === 'Workspace' || word === 'Players' || word === 'Lighting' ||
      word === 'ReplicatedStorage' || word === 'ServerStorage' || word === 'ServerScriptService' ||
      word === 'StarterGui' || word === 'StarterPlayer' || word === 'StarterPack' ||
      word === 'SoundService' || word === 'TweenService' || word === 'RunService' ||
      word === 'UserInputService' || word === 'HttpService' || word === 'ContextActionService' ||
      word === 'Debris'
    ) {
      return Decoration.mark({ class: 'cm-roblox-service' });
    }

    // Instance Methods & Signal calls
    if (
      word === 'GetService' || word === 'WaitForChild' || word === 'FindFirstChild' ||
      word === 'FindFirstChildOfClass' || word === 'FindFirstChildWhichIsA' ||
      word === 'GetChildren' || word === 'GetDescendants' || word === 'IsA' ||
      word === 'GetFullName' || word === 'Clone' || word === 'Destroy' ||
      word === 'ClearAllChildren' || word === 'Connect' || word === 'Disconnect' ||
      word === 'Fire' || word === 'Wait' || word === 'FireServer' ||
      word === 'FireClient' || word === 'FireAllClients' || word === 'InvokeServer' ||
      word === 'InvokeClient'
    ) {
      return Decoration.mark({ class: 'cm-roblox-method' });
    }

    // Built-in functions
    if (
      word === 'print' || word === 'warn' || word === 'error' || word === 'require' ||
      word === 'typeof' || word === 'pcall' || word === 'xpcall' || word === 'setmetatable' ||
      word === 'getmetatable' || word === 'rawget' || word === 'rawset' || word === 'tostring' ||
      word === 'tonumber' || word === 'assert' || word === 'ipairs' || word === 'pairs'
    ) {
      return Decoration.mark({ class: 'cm-roblox-builtin' });
    }

    // Task methods
    if (word === 'spawn' || word === 'delay' || word === 'defer' || word === 'cancel') {
      return Decoration.mark({ class: 'cm-roblox-task' });
    }

    // Common Signals & Events
    if (
      word === 'Changed' || word === 'ChildAdded' || word === 'ChildRemoved' ||
      word === 'Destroying' || word === 'OnServerEvent' || word === 'OnClientEvent' ||
      word === 'Event'
    ) {
      return Decoration.mark({ class: 'cm-roblox-event' });
    }

    // Properties
    return Decoration.mark({ class: 'cm-roblox-prop' });
  },
});

export const robloxTokenHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: any) {
      this.decorations = robloxDecorator.createDeco(view);
    }
    update(update: any) {
      this.decorations = robloxDecorator.updateDeco(update, this.decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ===== 2. Inline Color Preview Swatches =====
class ColorSwatchWidget extends WidgetType {
  color: string;

  constructor(color: string) {
    super();
    this.color = color;
  }

  toDOM() {
    const swatch = document.createElement('span');
    swatch.className = 'cm-color-swatch-widget';
    swatch.style.backgroundColor = this.color;
    swatch.title = `Color: ${this.color}`;
    return swatch;
  }

  ignoreEvent() {
    return false;
  }
}

// Matches Color3.fromRGB(r, g, b)
const COLOR_RGB_REGEX = /Color3\.fromRGB\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g;
// Matches Color3.new(r, g, b) where values are 0-1
const COLOR_NEW_REGEX = /Color3\.new\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g;
// Matches Color3.fromHex("#RRGGBB")
const COLOR_HEX_REGEX = /Color3\.fromHex\(\s*["'](#?[0-9a-fA-F]{6})["']\s*\)/g;

const colorRgbDecorator = new MatchDecorator({
  regexp: COLOR_RGB_REGEX,
  decoration: (match) => {
    const r = Math.min(255, parseInt(match[1], 10));
    const g = Math.min(255, parseInt(match[2], 10));
    const b = Math.min(255, parseInt(match[3], 10));
    const color = `rgb(${r}, ${g}, ${b})`;
    return Decoration.widget({
      widget: new ColorSwatchWidget(color),
      side: 1,
    });
  },
});

const colorNewDecorator = new MatchDecorator({
  regexp: COLOR_NEW_REGEX,
  decoration: (match) => {
    const r = Math.min(255, Math.round(parseFloat(match[1]) * 255));
    const g = Math.min(255, Math.round(parseFloat(match[2]) * 255));
    const b = Math.min(255, Math.round(parseFloat(match[3]) * 255));
    const color = `rgb(${r}, ${g}, ${b})`;
    return Decoration.widget({
      widget: new ColorSwatchWidget(color),
      side: 1,
    });
  },
});

const colorHexDecorator = new MatchDecorator({
  regexp: COLOR_HEX_REGEX,
  decoration: (match) => {
    const hex = match[1].startsWith('#') ? match[1] : `#${match[1]}`;
    return Decoration.widget({
      widget: new ColorSwatchWidget(hex),
      side: 1,
    });
  },
});

export const colorPreviewPlugin: Extension = [
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: any) {
        this.decorations = colorRgbDecorator.createDeco(view);
      }
      update(update: any) {
        this.decorations = colorRgbDecorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations }
  ),
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: any) {
        this.decorations = colorNewDecorator.createDeco(view);
      }
      update(update: any) {
        this.decorations = colorNewDecorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations }
  ),
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: any) {
        this.decorations = colorHexDecorator.createDeco(view);
      }
      update(update: any) {
        this.decorations = colorHexDecorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations }
  ),
];

// ===== 3. Interactive Hover Documentation =====
export interface DocEntry {
  type: 'service' | 'class' | 'method' | 'function' | 'datatype' | 'keyword';
  signature?: string;
  summary: string;
  example?: string;
}

export const ROBLOX_DOCS: Record<string, DocEntry> = {
  'game': {
    type: 'service',
    signature: 'game: DataModel',
    summary: 'The root of the Roblox hierarchy and parent of all top-level services.',
    example: 'local ws = game:GetService("Workspace")',
  },
  'workspace': {
    type: 'service',
    signature: 'workspace: Workspace',
    summary: 'Contains all 3D physical instances, terrain, and active simulation parts.',
    example: 'part.Parent = workspace',
  },
  'task': {
    type: 'datatype',
    signature: 'task library',
    summary: 'Roblox high-performance cooperative task scheduler (wait, spawn, delay, defer, cancel).',
    example: 'task.wait(1)',
  },
  'task.wait': {
    type: 'function',
    signature: 'task.wait(duration?: number) → number',
    summary: 'Yields the current thread for the specified duration and returns actual elapsed time.',
    example: 'task.wait(0.5)',
  },
  'task.spawn': {
    type: 'function',
    signature: 'task.spawn(fn: function, ...args: any) → thread',
    summary: 'Spawns a function immediately on a new thread without waiting for the next step.',
    example: 'task.spawn(function() print("Running") end)',
  },
  'task.delay': {
    type: 'function',
    signature: 'task.delay(duration: number, fn: function, ...args: any) → thread',
    summary: 'Schedules a function to run after the given duration.',
    example: 'task.delay(2, function() print("Done") end)',
  },
  'Instance.new': {
    type: 'function',
    signature: 'Instance.new(className: string, parent?: Instance) → Instance',
    summary: 'Instantiates a new Roblox object of the specified class.',
    example: 'local p = Instance.new("Part"); p.Parent = workspace',
  },
  'Instance': {
    type: 'class',
    signature: 'Instance',
    summary: 'Base class for all items in the Roblox hierarchy.',
  },
  'GetService': {
    type: 'method',
    signature: 'game:GetService(serviceName: string) → Instance',
    summary: 'Retrieves the singleton instance of the specified service.',
    example: 'local players = game:GetService("Players")',
  },
  'WaitForChild': {
    type: 'method',
    signature: 'Instance:WaitForChild(childName: string, timeout?: number) → Instance',
    summary: 'Yields execution until the child exists or timeout expires.',
    example: 'local part = workspace:WaitForChild("SpawnLocation")',
  },
  'FindFirstChild': {
    type: 'method',
    signature: 'Instance:FindFirstChild(name: string, recursive?: boolean) → Instance?',
    summary: 'Returns the child with the given name, or nil if not found.',
    example: 'local torso = char:FindFirstChild("Torso")',
  },
  'GetChildren': {
    type: 'method',
    signature: 'Instance:GetChildren() → {Instance}',
    summary: 'Returns an array of all direct children of this instance.',
    example: 'for _, child in ipairs(workspace:GetChildren()) do print(child.Name) end',
  },
  'Connect': {
    type: 'method',
    signature: 'Signal:Connect(listener: (args...) → void) → RBXScriptConnection',
    summary: 'Subscribes a callback function to the event signal.',
    example: 'part.Touched:Connect(function(hit) print(hit.Name) end)',
  },
  'Destroy': {
    type: 'method',
    signature: 'Instance:Destroy() → void',
    summary: 'Disconnects all events, unparents the instance, and cleans up descendants.',
    example: 'part:Destroy()',
  },
  'Clone': {
    type: 'method',
    signature: 'Instance:Clone() → Instance',
    summary: 'Creates a deep duplicate copy of the instance and its descendants.',
    example: 'local copy = template:Clone()',
  },
  'Vector3.new': {
    type: 'datatype',
    signature: 'Vector3.new(x?: number, y?: number, z?: number) → Vector3',
    summary: 'Creates a 3D vector with the specified X, Y, and Z coordinates.',
    example: 'local pos = Vector3.new(0, 50, 0)',
  },
  'Vector3': {
    type: 'datatype',
    signature: 'Vector3(X, Y, Z)',
    summary: '3D coordinate vector representing position, size, or velocity.',
  },
  'CFrame.new': {
    type: 'datatype',
    signature: 'CFrame.new(x, y, z) → CFrame',
    summary: 'Creates a CoordinateFrame representing 3D position and rotation orientation.',
    example: 'part.CFrame = CFrame.new(0, 10, 0)',
  },
  'Color3.fromRGB': {
    type: 'datatype',
    signature: 'Color3.fromRGB(r: number, g: number, b: number) → Color3',
    summary: 'Creates a color using standard 0-255 RGB integer values.',
    example: 'part.Color = Color3.fromRGB(255, 80, 80)',
  },
  'Color3': {
    type: 'datatype',
    signature: 'Color3(R, G, B)',
    summary: 'Color representation with Red, Green, and Blue channels.',
  },
  'UDim2.new': {
    type: 'datatype',
    signature: 'UDim2.new(xScale, xOffset, yScale, yOffset) → UDim2',
    summary: 'Creates a 2D scale and pixel offset coordinate for GUI positioning and sizing.',
    example: 'frame.Size = UDim2.new(1, 0, 0, 50)',
  },
  'require': {
    type: 'function',
    signature: 'require(module: ModuleScript | string) → any',
    summary: 'Executes and caches the given ModuleScript, returning its exported value.',
    example: 'local mathUtils = require("MathUtils")',
  },
  'typeof': {
    type: 'function',
    signature: 'typeof(value: any) → string',
    summary: 'Returns the exact Roblox datatype name ("Instance", "Vector3", "Color3", etc.).',
    example: 'print(typeof(workspace)) -- "Instance"',
  },
  'pcall': {
    type: 'function',
    signature: 'pcall(fn: function, ...args) → (boolean, any)',
    summary: 'Protected call that catches any runtime errors and returns success status.',
    example: 'local success, result = pcall(function() ... end)',
  },
  'print': {
    type: 'function',
    signature: 'print(...args: any) → void',
    summary: 'Outputs strings and object values to the runner output console.',
    example: 'print("Game loaded!")',
  },
  'warn': {
    type: 'function',
    signature: 'warn(...args: any) → void',
    summary: 'Outputs a highlighted warning message to the runner console.',
    example: 'warn("Resource took long to load")',
  },
  'error': {
    type: 'function',
    signature: 'error(message: string, level?: number) → never',
    summary: 'Throws a terminating runtime error with an optional stack level.',
    example: 'error("Invalid parameter")',
  },
};

export const robloxHoverTooltips = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos);
  const text = line.text;
  const linePos = pos - line.from;

  // Find word boundary at cursor pos (supporting dots like task.wait or Instance.new)
  let start = linePos;
  let end = linePos;

  while (start > 0 && /[\w.]/.test(text[start - 1])) start--;
  while (end < text.length && /[\w.]/.test(text[end])) end++;

  if (start === end) return null;

  const rawWord = text.slice(start, end);

  // Check compound word first (e.g. task.wait, Instance.new, Color3.fromRGB)
  let doc = ROBLOX_DOCS[rawWord];
  let matchWord = rawWord;

  // If not found, check simple identifier
  if (!doc) {
    let simpleStart = linePos;
    let simpleEnd = linePos;
    while (simpleStart > 0 && /\w/.test(text[simpleStart - 1])) simpleStart--;
    while (simpleEnd < text.length && /\w/.test(text[simpleEnd])) simpleEnd--;
    const simpleWord = text.slice(simpleStart, simpleEnd);
    if (ROBLOX_DOCS[simpleWord]) {
      doc = ROBLOX_DOCS[simpleWord];
      matchWord = simpleWord;
      start = simpleStart;
      end = simpleEnd;
    }
  }

  if (!doc) return null;

  return {
    pos: line.from + start,
    end: line.from + end,
    above: true,
    create() {
      const dom = document.createElement('div');
      dom.className = 'cm-roblox-doc-tooltip';

      const typeBadge = `<span class="doc-badge badge-${doc.type}">${doc.type.toUpperCase()}</span>`;
      const signatureHtml = doc.signature
        ? `<div class="doc-signature"><code>${doc.signature}</code></div>`
        : '';
      const summaryHtml = `<div class="doc-summary">${doc.summary}</div>`;
      const exampleHtml = doc.example
        ? `<div class="doc-example"><span class="example-label">Example:</span> <code>${doc.example}</code></div>`
        : '';

      dom.innerHTML = `
        <div class="doc-header">
          <span class="doc-title">${matchWord}</span>
          ${typeBadge}
        </div>
        ${signatureHtml}
        ${summaryHtml}
        ${exampleHtml}
      `;

      return { dom };
    },
  };
});
