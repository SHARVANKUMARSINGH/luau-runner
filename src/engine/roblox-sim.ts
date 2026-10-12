/**
 * Roblox DataModel Simulator
 * 
 * Provides a simulated Roblox environment for Luau script execution.
 * 
 * IMPLEMENTED APIs:
 * - game:GetService(name) - Returns simulated services
 * - workspace - The Workspace service
 * - Instance.new(className, parent?) - Creates new instances
 * - Instance:FindFirstChild(name) - Finds a child by name
 * - Instance:WaitForChild(name) - Returns child (no actual waiting in simulation)
 * - Instance:GetChildren() - Returns array of children
 * - Instance:GetDescendants() - Returns all descendants
 * - Instance:Destroy() - Removes instance from parent
 * - Instance:Clone() - Deep clones an instance
 * - Instance:IsA(className) - Checks class hierarchy
 * - Instance.Name - Name property
 * - Instance.ClassName - Class name
 * - Instance.Parent - Parent reference
 * - Events: Instance.Changed, .ChildAdded, .ChildRemoved
 * - RBXScriptSignal:Connect(fn), :Wait(), :Once()
 * - RemoteEvent:FireServer(), :FireClient(), :FireAllClients()
 * - RemoteFunction:InvokeServer(), :InvokeClient()
 * - print(), warn(), error()
 * - task.wait(), task.spawn(), task.delay(), task.defer(), task.cancel()
 * - coroutine library
 * - typeof()
 * - tick(), time(), os.time(), os.clock()
 * - math library, string library, table library
 * - Players.LocalPlayer (in LocalScript context)
 * - require() for ModuleScripts
 * 
 * NOT IMPLEMENTED (would require actual Roblox engine):
 * - Rendering, physics, raycasting
 * - Networking between actual clients
 * - Audio playback
 * - Actual GUI rendering
 * - AnimationController, Humanoid movement
 * - Real player connections
 * - DataStoreService (actual persistence)
 * - HttpService (actual HTTP requests)
 * - TweenService (actual interpolation over time)
 * - Full class hierarchy and all properties
 */

import type { ExplorerNode, ConsoleMessage } from '../types';

type EventCallback = (...args: unknown[]) => void;

export class RBXScriptSignal {
  private connections: Array<{ callback: EventCallback; once: boolean }> = [];
  private name: string;

  constructor(name: string = 'Signal') {
    this.name = name;
  }

  Connect(callback: EventCallback): RBXScriptConnection {
    const entry = { callback, once: false };
    this.connections.push(entry);
    return new RBXScriptConnection(() => {
      const idx = this.connections.indexOf(entry);
      if (idx !== -1) this.connections.splice(idx, 1);
    });
  }

  Once(callback: EventCallback): RBXScriptConnection {
    const entry = { callback, once: true };
    this.connections.push(entry);
    return new RBXScriptConnection(() => {
      const idx = this.connections.indexOf(entry);
      if (idx !== -1) this.connections.splice(idx, 1);
    });
  }

  Wait(): Promise<unknown[]> {
    return new Promise((resolve) => {
      this.Once((...args) => resolve(args));
    });
  }

  Fire(...args: unknown[]): void {
    const toRemove: number[] = [];
    for (let i = 0; i < this.connections.length; i++) {
      try {
        this.connections[i].callback(...args);
      } catch (e) {
        console.error(`Error in ${this.name} callback:`, e);
      }
      if (this.connections[i]?.once) {
        toRemove.push(i);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.connections.splice(toRemove[i], 1);
    }
  }
}

export class RBXScriptConnection {
  public Connected = true;
  private disconnectFn: () => void;

  constructor(disconnectFn: () => void) {
    this.disconnectFn = disconnectFn;
  }

  Disconnect(): void {
    if (this.Connected) {
      this.Connected = false;
      this.disconnectFn();
    }
  }
}

// Class hierarchy for IsA checks
const CLASS_HIERARCHY: Record<string, string[]> = {
  Instance: [],
  BasePart: ['Instance'],
  Part: ['BasePart', 'Instance'],
  MeshPart: ['BasePart', 'Instance'],
  WedgePart: ['BasePart', 'Instance'],
  SpawnLocation: ['BasePart', 'Instance'],
  Model: ['Instance'],
  Folder: ['Instance'],
  Script: ['Instance'],
  LocalScript: ['Instance'],
  ModuleScript: ['Instance'],
  RemoteEvent: ['Instance'],
  RemoteFunction: ['Instance'],
  BindableEvent: ['Instance'],
  BindableFunction: ['Instance'],
  StringValue: ['ValueBase', 'Instance'],
  IntValue: ['ValueBase', 'Instance'],
  NumberValue: ['ValueBase', 'Instance'],
  BoolValue: ['ValueBase', 'Instance'],
  ObjectValue: ['ValueBase', 'Instance'],
  ValueBase: ['Instance'],
  ScreenGui: ['LayerCollector', 'Instance'],
  LayerCollector: ['Instance'],
  Frame: ['GuiObject', 'Instance'],
  TextLabel: ['GuiObject', 'Instance'],
  TextButton: ['GuiObject', 'Instance'],
  TextBox: ['GuiObject', 'Instance'],
  ImageLabel: ['GuiObject', 'Instance'],
  ImageButton: ['GuiObject', 'Instance'],
  GuiObject: ['Instance'],
  Player: ['Instance'],
  Camera: ['Instance'],
  Attachment: ['Instance'],
  Workspace: ['Instance'],
  Lighting: ['Instance'],
  ReplicatedStorage: ['Instance'],
  ServerStorage: ['Instance'],
  ServerScriptService: ['Instance'],
  StarterPlayer: ['Instance'],
  StarterGui: ['Instance'],
  StarterPack: ['Instance'],
  Players: ['Instance'],
  RunService: ['Instance'],
  SoundService: ['Instance'],
  UserInputService: ['Instance'],
  TweenService: ['Instance'],
  Terrain: ['BasePart', 'Instance'],
  Sound: ['Instance'],
  Tool: ['Instance'],
};

export class SimulatedInstance {
  Name: string;
  ClassName: string;
  private _parent: SimulatedInstance | null = null;
  private _children: SimulatedInstance[] = [];
  private _properties: Record<string, unknown> = {};
  private _destroyed = false;

  // Events
  Changed: RBXScriptSignal;
  ChildAdded: RBXScriptSignal;
  ChildRemoved: RBXScriptSignal;
  Destroying: RBXScriptSignal;

  // For RemoteEvent
  OnServerEvent: RBXScriptSignal;
  OnClientEvent: RBXScriptSignal;

  // For RemoteFunction
  OnServerInvoke: ((...args: unknown[]) => unknown) | null = null;
  OnClientInvoke: ((...args: unknown[]) => unknown) | null = null;

  // For BindableEvent
  Event: RBXScriptSignal;

  // For value objects
  Value: unknown = null;

  constructor(className: string, parent?: SimulatedInstance | null) {
    this.ClassName = className;
    this.Name = className;
    this.Changed = new RBXScriptSignal('Changed');
    this.ChildAdded = new RBXScriptSignal('ChildAdded');
    this.ChildRemoved = new RBXScriptSignal('ChildRemoved');
    this.Destroying = new RBXScriptSignal('Destroying');
    this.OnServerEvent = new RBXScriptSignal('OnServerEvent');
    this.OnClientEvent = new RBXScriptSignal('OnClientEvent');
    this.Event = new RBXScriptSignal('Event');

    // Set default properties based on class
    this.initializeDefaults();

    if (parent) {
      this.Parent = parent;
    }
  }

  private initializeDefaults(): void {
    switch (this.ClassName) {
      case 'Part':
      case 'MeshPart':
      case 'WedgePart':
      case 'SpawnLocation':
        this._properties['Position'] = { X: 0, Y: 0, Z: 0 };
        this._properties['Size'] = { X: 4, Y: 1, Z: 2 };
        this._properties['Anchored'] = false;
        this._properties['CanCollide'] = true;
        this._properties['Transparency'] = 0;
        this._properties['BrickColor'] = 'Medium stone grey';
        this._properties['Material'] = 'Plastic';
        break;
      case 'Model':
        this._properties['PrimaryPart'] = null;
        break;
      case 'Camera':
        this._properties['CFrame'] = { Position: { X: 0, Y: 10, Z: 0 } };
        this._properties['FieldOfView'] = 70;
        break;
      case 'Player':
        this._properties['UserId'] = 1;
        this._properties['DisplayName'] = 'SimPlayer';
        this._properties['Team'] = null;
        break;
      case 'StringValue':
        this.Value = '';
        break;
      case 'IntValue':
      case 'NumberValue':
        this.Value = 0;
        break;
      case 'BoolValue':
        this.Value = false;
        break;
      case 'Sound':
        this._properties['SoundId'] = '';
        this._properties['Volume'] = 0.5;
        this._properties['Playing'] = false;
        this._properties['Looped'] = false;
        break;
      case 'ScreenGui':
        this._properties['Enabled'] = true;
        this._properties['ResetOnSpawn'] = true;
        break;
      case 'Frame':
      case 'TextLabel':
      case 'TextButton':
      case 'TextBox':
      case 'ImageLabel':
      case 'ImageButton':
        this._properties['Size'] = { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } };
        this._properties['Position'] = { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } };
        this._properties['Visible'] = true;
        this._properties['BackgroundTransparency'] = 0;
        break;
    }

    if (['TextLabel', 'TextButton', 'TextBox'].includes(this.ClassName)) {
      this._properties['Text'] = '';
      this._properties['TextSize'] = 14;
      this._properties['Font'] = 'SourceSans';
    }
  }

  get Parent(): SimulatedInstance | null {
    return this._parent;
  }

  set Parent(newParent: SimulatedInstance | null) {
    if (this._destroyed) return;
    const oldParent = this._parent;
    if (oldParent === newParent) return;

    if (oldParent) {
      const idx = oldParent._children.indexOf(this);
      if (idx !== -1) {
        oldParent._children.splice(idx, 1);
        oldParent.ChildRemoved.Fire(this);
      }
    }

    this._parent = newParent;

    if (newParent) {
      newParent._children.push(this);
      newParent.ChildAdded.Fire(this);
    }

    this.Changed.Fire('Parent');
  }

  FindFirstChild(name: string, recursive = false): SimulatedInstance | null {
    for (const child of this._children) {
      if (child.Name === name) return child;
      if (recursive) {
        const found = child.FindFirstChild(name, true);
        if (found) return found;
      }
    }
    return null;
  }

  FindFirstChildOfClass(className: string): SimulatedInstance | null {
    for (const child of this._children) {
      if (child.ClassName === className) return child;
    }
    return null;
  }

  FindFirstChildWhichIsA(className: string): SimulatedInstance | null {
    for (const child of this._children) {
      if (child.IsA(className)) return child;
    }
    return null;
  }

  WaitForChild(name: string): SimulatedInstance | null {
    // In simulation, we just do an immediate lookup
    return this.FindFirstChild(name);
  }

  GetChildren(): SimulatedInstance[] {
    return [...this._children];
  }

  GetDescendants(): SimulatedInstance[] {
    const result: SimulatedInstance[] = [];
    const collect = (inst: SimulatedInstance) => {
      for (const child of inst._children) {
        result.push(child);
        collect(child);
      }
    };
    collect(this);
    return result;
  }

  IsA(className: string): boolean {
    if (this.ClassName === className) return true;
    const hierarchy = CLASS_HIERARCHY[this.ClassName];
    if (hierarchy) {
      return hierarchy.includes(className);
    }
    return false;
  }

  GetFullName(): string {
    const parts: string[] = [this.Name];
    let current = this._parent;
    while (current) {
      parts.unshift(current.Name);
      current = current._parent;
    }
    return parts.join('.');
  }

  Clone(): SimulatedInstance {
    const clone = new SimulatedInstance(this.ClassName);
    clone.Name = this.Name;
    clone._properties = { ...this._properties };
    clone.Value = this.Value;
    for (const child of this._children) {
      const childClone = child.Clone();
      childClone.Parent = clone;
    }
    return clone;
  }

  Destroy(): void {
    this._destroyed = true;
    this.Destroying.Fire();
    // Destroy all children first
    for (const child of [...this._children]) {
      child.Destroy();
    }
    this.Parent = null;
    this._children = [];
  }

  ClearAllChildren(): void {
    for (const child of [...this._children]) {
      child.Destroy();
    }
  }

  // Remote event methods
  FireServer(...args: unknown[]): void {
    this.OnServerEvent.Fire(null, ...args);
  }

  FireClient(_player: unknown, ...args: unknown[]): void {
    this.OnClientEvent.Fire(...args);
  }

  FireAllClients(...args: unknown[]): void {
    this.OnClientEvent.Fire(...args);
  }

  Fire(...args: unknown[]): void {
    this.Event.Fire(...args);
  }

  // Remote function methods
  InvokeServer(...args: unknown[]): unknown {
    if (this.OnServerInvoke) {
      return this.OnServerInvoke(...args);
    }
    return null;
  }

  InvokeClient(_player: unknown, ...args: unknown[]): unknown {
    if (this.OnClientInvoke) {
      return this.OnClientInvoke(...args);
    }
    return null;
  }

  // Property access
  getProperty(name: string): unknown {
    if (name in this._properties) return this._properties[name];
    return undefined;
  }

  setProperty(name: string, value: unknown): void {
    this._properties[name] = value;
    this.Changed.Fire(name);
  }

  // For explorer
  toExplorerNode(path = ''): ExplorerNode {
    const nodePath = path ? `${path}.${this.Name}` : this.Name;
    return {
      name: this.Name,
      className: this.ClassName,
      children: this._children.map((c) => c.toExplorerNode(nodePath)),
      properties: { ...this._properties },
      path: nodePath,
    };
  }
}

// ===== RunService Simulation =====
class RunServiceSim extends SimulatedInstance {
  Heartbeat: RBXScriptSignal;
  Stepped: RBXScriptSignal;
  RenderStepped: RBXScriptSignal;

  constructor() {
    super('RunService');
    this.Name = 'RunService';
    this.Heartbeat = new RBXScriptSignal('Heartbeat');
    this.Stepped = new RBXScriptSignal('Stepped');
    this.RenderStepped = new RBXScriptSignal('RenderStepped');
  }

  IsServer(): boolean {
    return true;
  }

  IsClient(): boolean {
    return false;
  }

  IsStudio(): boolean {
    return true;
  }
}

// ===== DataModel (game) =====
export class DataModel extends SimulatedInstance {
  private services: Map<string, SimulatedInstance> = new Map();
  private runService: RunServiceSim;

  constructor() {
    super('DataModel');
    this.Name = 'game';

    // Create default services
    this.runService = new RunServiceSim();
    this.runService.Parent = this;
    this.services.set('RunService', this.runService);

    const serviceNames = [
      'Workspace',
      'Players',
      'ReplicatedStorage',
      'ServerStorage',
      'ServerScriptService',
      'StarterPlayer',
      'StarterGui',
      'StarterPack',
      'Lighting',
      'SoundService',
      'UserInputService',
      'TweenService',
    ];

    for (const name of serviceNames) {
      const service = new SimulatedInstance(name);
      service.Name = name;
      service.Parent = this;
      this.services.set(name, service);
    }

    // Add Terrain to Workspace
    const workspace = this.services.get('Workspace')!;
    const terrain = new SimulatedInstance('Terrain');
    terrain.Name = 'Terrain';
    terrain.Parent = workspace;

    // Add Camera to Workspace
    const camera = new SimulatedInstance('Camera');
    camera.Name = 'Camera';
    camera.Parent = workspace;

    // Create a simulated local player
    const players = this.services.get('Players')!;
    const localPlayer = new SimulatedInstance('Player');
    localPlayer.Name = 'SimPlayer';
    localPlayer.setProperty('UserId', 1);
    localPlayer.setProperty('DisplayName', 'SimPlayer');
    localPlayer.Parent = players;

    // Add backpack and PlayerGui to player
    const backpack = new SimulatedInstance('Folder');
    backpack.Name = 'Backpack';
    backpack.Parent = localPlayer;

    const playerGui = new SimulatedInstance('Folder');
    playerGui.Name = 'PlayerGui';
    playerGui.Parent = localPlayer;

    // Set LocalPlayer reference on Players service
    (players as unknown as Record<string, unknown>).LocalPlayer = localPlayer;
  }

  GetService(name: string): SimulatedInstance | null {
    if (name === 'RunService') return this.runService;
    return this.services.get(name) ?? null;
  }

  getWorkspace(): SimulatedInstance {
    return this.services.get('Workspace')!;
  }
}

/**
 * Creates a JS object representation of the DataModel
 * that can be injected into the Luau runtime via luau-web's interop
 */
export function createRobloxEnvironment(
  dataModel: DataModel,
  context: 'server' | 'client',
  outputCallback: (msg: ConsoleMessage) => void,
  moduleScripts?: Map<string, string>
): Record<string, unknown> {
  let msgId = 0;
  const now = () => Date.now();

  const createConsoleMsg = (
    type: ConsoleMessage['type'],
    text: string,
    source?: string,
    line?: number
  ): ConsoleMessage => ({
    id: `msg_${now()}_${++msgId}`,
    type,
    text,
    timestamp: now(),
    source,
    line,
  });

  // Task scheduling state
  const scheduledTasks: Array<{
    fn: () => void;
    delay: number;
    id: number;
    cancelled: boolean;
  }> = [];
  let taskIdCounter = 0;

  const printFn = (...args: unknown[]) => {
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
      .join('\t');
    outputCallback(createConsoleMsg('output', text));
  };

  const warnFn = (...args: unknown[]) => {
    const text = args.map((a) => (a === null || a === undefined ? 'nil' : String(a))).join('\t');
    outputCallback(createConsoleMsg('warn', text));
  };

  const errorFn = (message?: unknown) => {
    const text = message === null || message === undefined ? 'nil' : String(message);
    outputCallback(createConsoleMsg('error', text));
    throw new Error(text);
  };

  // Instance.new factory
  const instanceNew = (className: string, parent?: SimulatedInstance) => {
    const inst = new SimulatedInstance(className, parent || null);
    return inst;
  };

  // Build game proxy object that exposes GetService
  const gameProxy = {
    GetService: (name: string) => {
      const svc = dataModel.GetService(name);
      if (!svc) {
        throw new Error(`Service "${name}" is not a valid service name`);
      }
      return svc;
    },
    Name: 'Game',
    ClassName: 'DataModel',
    FindFirstChild: (name: string) => dataModel.FindFirstChild(name),
    GetChildren: () => dataModel.GetChildren(),
    GetDescendants: () => dataModel.GetDescendants(),
  };

  // Build workspace reference
  const workspaceRef = dataModel.getWorkspace();

  // Require function for ModuleScripts
  const requireFn = (moduleOrName: unknown): unknown => {
    if (moduleOrName instanceof SimulatedInstance) {
      if (moduleOrName.ClassName !== 'ModuleScript') {
        throw new Error('Attempted to require a non-ModuleScript instance');
      }
      // Look for module content in moduleScripts map
      if (moduleScripts) {
        const content = moduleScripts.get(moduleOrName.Name);
        if (content) {
          outputCallback(
            createConsoleMsg('info', `[require] Loading module: ${moduleOrName.Name}`)
          );
          return content;
        }
      }
      throw new Error(`ModuleScript "${moduleOrName.Name}" has no loadable source`);
    }
    throw new Error('require expects a ModuleScript instance');
  };

  // task library
  const taskLib = {
    wait: (seconds?: number) => {
      // In WASM context, we can't actually yield. Return the elapsed time.
      const waitTime = seconds ?? (1 / 30);
      return waitTime;
    },
    spawn: (fn: (...args: unknown[]) => void, ...args: unknown[]) => {
      // Execute immediately (simulated spawn)
      try {
        fn(...args);
      } catch (e) {
        outputCallback(createConsoleMsg('error', `task.spawn error: ${e}`));
      }
    },
    delay: (seconds: number, fn: (...args: unknown[]) => void) => {
      const id = ++taskIdCounter;
      const task = { fn, delay: seconds, id, cancelled: false };
      scheduledTasks.push(task);
      // Execute via setTimeout-like behavior
      setTimeout(() => {
        if (!task.cancelled) {
          try {
            fn();
          } catch (e) {
            outputCallback(createConsoleMsg('error', `task.delay error: ${e}`));
          }
        }
      }, seconds * 1000);
      return id;
    },
    defer: (fn: (...args: unknown[]) => void, ...args: unknown[]) => {
      // Defer = run next resumption cycle (simulate with immediate exec)
      try {
        fn(...args);
      } catch (e) {
        outputCallback(createConsoleMsg('error', `task.defer error: ${e}`));
      }
    },
    cancel: (taskId: unknown) => {
      const t = scheduledTasks.find((t) => t.id === taskId);
      if (t) t.cancelled = true;
    },
  };

  // typeof implementation
  const typeofFn = (value: unknown): string => {
    if (value === null || value === undefined) return 'nil';
    if (value instanceof SimulatedInstance) return 'Instance';
    if (value instanceof RBXScriptSignal) return 'RBXScriptSignal';
    if (value instanceof RBXScriptConnection) return 'RBXScriptConnection';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'function') return 'function';
    if (Array.isArray(value)) return 'table';
    if (typeof value === 'object') return 'table';
    return 'nil';
  };

  const startTime = Date.now() / 1000;

  // Build the environment
  const env: Record<string, unknown> = {
    // Output
    print: printFn,
    warn: warnFn,
    error: errorFn,

    // Instance creation
    Instance: {
      new: instanceNew,
    },

    // Game references
    game: gameProxy,
    workspace: workspaceRef,

    // Libraries
    task: taskLib,
    require: requireFn,
    typeof: typeofFn,

    // Time functions
    tick: () => Date.now() / 1000,
    time: () => (Date.now() / 1000) - startTime,
    wait: taskLib.wait,
    delay: (seconds: number, fn: () => void) => taskLib.delay(seconds, fn),
    spawn: (fn: () => void) => taskLib.spawn(fn),

    // Utility
    tostring: (v: unknown) => (v === null || v === undefined ? 'nil' : String(v)),
    tonumber: (v: unknown) => {
      const n = Number(v);
      return isNaN(n) ? null : n;
    },
    type: (v: unknown) => {
      if (v === null || v === undefined) return 'nil';
      const t = typeof v;
      if (t === 'object') return 'table';
      return t;
    },
    pcall: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => {
      try {
        const result = fn(...args);
        return [true, result];
      } catch (e) {
        return [false, String(e)];
      }
    },
    xpcall: (fn: () => unknown, handler: (err: unknown) => unknown) => {
      try {
        const result = fn();
        return [true, result];
      } catch (e) {
        const handlerResult = handler(e);
        return [false, handlerResult];
      }
    },
    select: (index: unknown, ...args: unknown[]) => {
      if (index === '#') return args.length;
      const idx = Number(index);
      if (idx > 0) return args.slice(idx - 1);
      return [];
    },
    unpack: (t: unknown[]) => t,
    rawget: (t: Record<string, unknown>, k: string) => t[k],
    rawset: (t: Record<string, unknown>, k: string, v: unknown) => {
      t[k] = v;
      return t;
    },
    rawequal: (a: unknown, b: unknown) => a === b,
    rawlen: (t: unknown[]) => t.length,
    ipairs: (t: unknown[]) => {
      let i = 0;
      return () => {
        i++;
        if (i <= t.length) return [i, t[i - 1]];
        return null;
      };
    },
    pairs: (t: Record<string, unknown>) => {
      const keys = Object.keys(t);
      let i = 0;
      return () => {
        if (i < keys.length) {
          const key = keys[i++];
          return [key, t[key]];
        }
        return null;
      };
    },
    next: (t: Record<string, unknown>, key?: string) => {
      const keys = Object.keys(t);
      if (key === undefined || key === null) {
        if (keys.length > 0) return [keys[0], t[keys[0]]];
        return null;
      }
      const idx = keys.indexOf(key);
      if (idx !== -1 && idx + 1 < keys.length) {
        return [keys[idx + 1], t[keys[idx + 1]]];
      }
      return null;
    },
    setmetatable: () => {
      // Basic stub
      return null;
    },
    getmetatable: () => null,
    newproxy: () => ({}),
  };

  // Add Players.LocalPlayer for client context
  if (context === 'client') {
    const players = dataModel.GetService('Players');
    if (players) {
      const lp = (players as unknown as Record<string, unknown>).LocalPlayer;
      if (lp) {
        (env.game as Record<string, unknown>).Players = {
          ...players,
          LocalPlayer: lp,
        };
      }
    }
  }

  return env;
}

/**
 * Get the full explorer tree from the DataModel
 */
export function getExplorerTree(dataModel: DataModel): ExplorerNode {
  return dataModel.toExplorerNode();
}
