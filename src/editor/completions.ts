/**
 * Luau/Roblox API autocomplete data for the CodeMirror editor.
 * These are real APIs available in the simulator.
 */

export interface CompletionItem {
  label: string;
  type: 'function' | 'property' | 'keyword' | 'class' | 'method' | 'constant' | 'variable';
  detail?: string;
  info?: string;
  boost?: number;
}

// Luau keywords
export const LUAU_KEYWORDS: CompletionItem[] = [
  { label: 'local', type: 'keyword', detail: 'Variable declaration' },
  { label: 'function', type: 'keyword', detail: 'Function declaration' },
  { label: 'end', type: 'keyword', detail: 'Block end' },
  { label: 'if', type: 'keyword', detail: 'Conditional' },
  { label: 'then', type: 'keyword', detail: 'Conditional body' },
  { label: 'else', type: 'keyword', detail: 'Else branch' },
  { label: 'elseif', type: 'keyword', detail: 'Else-if branch' },
  { label: 'for', type: 'keyword', detail: 'For loop' },
  { label: 'while', type: 'keyword', detail: 'While loop' },
  { label: 'do', type: 'keyword', detail: 'Do block' },
  { label: 'repeat', type: 'keyword', detail: 'Repeat loop' },
  { label: 'until', type: 'keyword', detail: 'Repeat condition' },
  { label: 'return', type: 'keyword', detail: 'Return statement' },
  { label: 'break', type: 'keyword', detail: 'Break loop' },
  { label: 'continue', type: 'keyword', detail: 'Continue loop (Luau)' },
  { label: 'in', type: 'keyword', detail: 'For-in iterator' },
  { label: 'and', type: 'keyword', detail: 'Logical AND' },
  { label: 'or', type: 'keyword', detail: 'Logical OR' },
  { label: 'not', type: 'keyword', detail: 'Logical NOT' },
  { label: 'true', type: 'constant', detail: 'Boolean true' },
  { label: 'false', type: 'constant', detail: 'Boolean false' },
  { label: 'nil', type: 'constant', detail: 'Nil value' },
  { label: 'type', type: 'keyword', detail: 'Type annotation (Luau)' },
  { label: 'export', type: 'keyword', detail: 'Export type (Luau)' },
];

// Global functions
export const GLOBAL_FUNCTIONS: CompletionItem[] = [
  { label: 'print', type: 'function', detail: '(...args) → void', info: 'Prints values to the output console' },
  { label: 'warn', type: 'function', detail: '(...args) → void', info: 'Prints a warning message' },
  { label: 'error', type: 'function', detail: '(message, level?) → never', info: 'Throws a runtime error' },
  { label: 'require', type: 'function', detail: '(module: ModuleScript) → any', info: 'Loads and returns a ModuleScript' },
  { label: 'typeof', type: 'function', detail: '(value) → string', info: 'Returns the Roblox type name' },
  { label: 'type', type: 'function', detail: '(value) → string', info: 'Returns the Lua type name' },
  { label: 'tostring', type: 'function', detail: '(value) → string', info: 'Converts value to string' },
  { label: 'tonumber', type: 'function', detail: '(value) → number?', info: 'Converts value to number' },
  { label: 'pcall', type: 'function', detail: '(fn, ...args) → (boolean, any)', info: 'Protected call - catches errors' },
  { label: 'xpcall', type: 'function', detail: '(fn, handler) → (boolean, any)', info: 'Protected call with error handler' },
  { label: 'select', type: 'function', detail: '(index, ...args) → ...', info: 'Returns arguments starting at index' },
  { label: 'unpack', type: 'function', detail: '(table) → ...', info: 'Unpacks a table into arguments' },
  { label: 'ipairs', type: 'function', detail: '(table) → iterator', info: 'Iterates over array part of table' },
  { label: 'pairs', type: 'function', detail: '(table) → iterator', info: 'Iterates over all table entries' },
  { label: 'next', type: 'function', detail: '(table, key?) → (key, value)', info: 'Returns the next key-value pair' },
  { label: 'rawget', type: 'function', detail: '(table, key) → value', info: 'Gets without metamethods' },
  { label: 'rawset', type: 'function', detail: '(table, key, value) → table', info: 'Sets without metamethods' },
  { label: 'rawequal', type: 'function', detail: '(a, b) → boolean', info: 'Equality without metamethods' },
  { label: 'rawlen', type: 'function', detail: '(table) → number', info: 'Length without metamethods' },
  { label: 'setmetatable', type: 'function', detail: '(table, metatable) → table', info: 'Sets the metatable' },
  { label: 'getmetatable', type: 'function', detail: '(table) → metatable?', info: 'Gets the metatable' },
  { label: 'tick', type: 'function', detail: '() → number', info: 'Returns the current time in seconds' },
  { label: 'time', type: 'function', detail: '() → number', info: 'Returns elapsed time since start' },
  { label: 'wait', type: 'function', detail: '(seconds?) → number', info: 'Yields for the given duration' },
  { label: 'delay', type: 'function', detail: '(seconds, fn) → void', info: 'Calls function after delay' },
  { label: 'spawn', type: 'function', detail: '(fn) → void', info: 'Spawns a new thread' },
  { label: 'assert', type: 'function', detail: '(condition, message?) → value', info: 'Throws if condition is false' },
  { label: 'newproxy', type: 'function', detail: '(addMetatable?) → userdata', info: 'Creates a new proxy object' },
];

// game and services
export const GAME_API: CompletionItem[] = [
  { label: 'game', type: 'variable', detail: 'DataModel', info: 'The root game DataModel', boost: 10 },
  { label: 'workspace', type: 'variable', detail: 'Workspace', info: 'The Workspace service', boost: 10 },
  { label: 'GetService', type: 'method', detail: '(serviceName: string) → Instance', info: 'Returns the specified service' },
];

// Services available via GetService
export const SERVICES: CompletionItem[] = [
  { label: '"Workspace"', type: 'constant', detail: 'Service', info: 'Contains all 3D objects' },
  { label: '"Players"', type: 'constant', detail: 'Service', info: 'Manages connected players' },
  { label: '"ReplicatedStorage"', type: 'constant', detail: 'Service', info: 'Shared storage for server/client' },
  { label: '"ServerStorage"', type: 'constant', detail: 'Service', info: 'Server-only storage' },
  { label: '"ServerScriptService"', type: 'constant', detail: 'Service', info: 'Server-only scripts' },
  { label: '"StarterPlayer"', type: 'constant', detail: 'Service', info: 'Player character defaults' },
  { label: '"StarterGui"', type: 'constant', detail: 'Service', info: 'Default player GUIs' },
  { label: '"StarterPack"', type: 'constant', detail: 'Service', info: 'Default player tools' },
  { label: '"Lighting"', type: 'constant', detail: 'Service', info: 'Lighting and atmosphere' },
  { label: '"RunService"', type: 'constant', detail: 'Service', info: 'Frame-based callbacks' },
  { label: '"SoundService"', type: 'constant', detail: 'Service', info: 'Audio management' },
  { label: '"UserInputService"', type: 'constant', detail: 'Service', info: 'Input handling' },
  { label: '"TweenService"', type: 'constant', detail: 'Service', info: 'Value interpolation' },
];

// Instance methods
export const INSTANCE_METHODS: CompletionItem[] = [
  { label: 'FindFirstChild', type: 'method', detail: '(name, recursive?) → Instance?', info: 'Finds a child by name' },
  { label: 'FindFirstChildOfClass', type: 'method', detail: '(className) → Instance?', info: 'Finds child by class' },
  { label: 'FindFirstChildWhichIsA', type: 'method', detail: '(className) → Instance?', info: 'Finds child matching class hierarchy' },
  { label: 'WaitForChild', type: 'method', detail: '(name, timeout?) → Instance', info: 'Waits for child to exist' },
  { label: 'GetChildren', type: 'method', detail: '() → {Instance}', info: 'Returns all direct children' },
  { label: 'GetDescendants', type: 'method', detail: '() → {Instance}', info: 'Returns all descendants' },
  { label: 'IsA', type: 'method', detail: '(className) → boolean', info: 'Checks class hierarchy' },
  { label: 'GetFullName', type: 'method', detail: '() → string', info: 'Returns full dot-separated path' },
  { label: 'Clone', type: 'method', detail: '() → Instance', info: 'Creates a deep copy' },
  { label: 'Destroy', type: 'method', detail: '() → void', info: 'Removes and cleans up' },
  { label: 'ClearAllChildren', type: 'method', detail: '() → void', info: 'Destroys all children' },
];

// Instance properties
export const INSTANCE_PROPERTIES: CompletionItem[] = [
  { label: 'Name', type: 'property', detail: 'string', info: 'The name of the instance' },
  { label: 'ClassName', type: 'property', detail: 'string (read-only)', info: 'The class name' },
  { label: 'Parent', type: 'property', detail: 'Instance?', info: 'The parent instance' },
];

// Instance events
export const INSTANCE_EVENTS: CompletionItem[] = [
  { label: 'Changed', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a property changes' },
  { label: 'ChildAdded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a child is added' },
  { label: 'ChildRemoved', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a child is removed' },
  { label: 'Destroying', type: 'property', detail: 'RBXScriptSignal', info: 'Fires before destruction' },
];

// Instance.new class names
export const INSTANCE_CLASSES: CompletionItem[] = [
  { label: '"Part"', type: 'class', detail: 'BasePart', info: 'A basic 3D part' },
  { label: '"MeshPart"', type: 'class', detail: 'BasePart', info: 'A mesh-based part' },
  { label: '"WedgePart"', type: 'class', detail: 'BasePart', info: 'A wedge-shaped part' },
  { label: '"SpawnLocation"', type: 'class', detail: 'BasePart', info: 'Player spawn point' },
  { label: '"Model"', type: 'class', detail: 'Instance', info: 'A group of objects' },
  { label: '"Folder"', type: 'class', detail: 'Instance', info: 'An organizational container' },
  { label: '"Script"', type: 'class', detail: 'Instance', info: 'Server-side script' },
  { label: '"LocalScript"', type: 'class', detail: 'Instance', info: 'Client-side script' },
  { label: '"ModuleScript"', type: 'class', detail: 'Instance', info: 'Reusable code module' },
  { label: '"RemoteEvent"', type: 'class', detail: 'Instance', info: 'Server-client event' },
  { label: '"RemoteFunction"', type: 'class', detail: 'Instance', info: 'Server-client function' },
  { label: '"BindableEvent"', type: 'class', detail: 'Instance', info: 'In-context event' },
  { label: '"BindableFunction"', type: 'class', detail: 'Instance', info: 'In-context function' },
  { label: '"StringValue"', type: 'class', detail: 'ValueBase', info: 'String value object' },
  { label: '"IntValue"', type: 'class', detail: 'ValueBase', info: 'Integer value object' },
  { label: '"NumberValue"', type: 'class', detail: 'ValueBase', info: 'Number value object' },
  { label: '"BoolValue"', type: 'class', detail: 'ValueBase', info: 'Boolean value object' },
  { label: '"ObjectValue"', type: 'class', detail: 'ValueBase', info: 'Object reference value' },
  { label: '"ScreenGui"', type: 'class', detail: 'LayerCollector', info: 'Screen-space GUI container' },
  { label: '"Frame"', type: 'class', detail: 'GuiObject', info: 'GUI container' },
  { label: '"TextLabel"', type: 'class', detail: 'GuiObject', info: 'Display text' },
  { label: '"TextButton"', type: 'class', detail: 'GuiObject', info: 'Clickable text' },
  { label: '"TextBox"', type: 'class', detail: 'GuiObject', info: 'Text input' },
  { label: '"ImageLabel"', type: 'class', detail: 'GuiObject', info: 'Display image' },
  { label: '"ImageButton"', type: 'class', detail: 'GuiObject', info: 'Clickable image' },
  { label: '"Sound"', type: 'class', detail: 'Instance', info: 'Audio playback' },
  { label: '"Camera"', type: 'class', detail: 'Instance', info: 'Viewport camera' },
  { label: '"Attachment"', type: 'class', detail: 'Instance', info: 'Constraint attachment point' },
  { label: '"Tool"', type: 'class', detail: 'Instance', info: 'Equippable tool' },
];

// task library
export const TASK_API: CompletionItem[] = [
  { label: 'wait', type: 'method', detail: '(seconds?) → number', info: 'Yields the current thread' },
  { label: 'spawn', type: 'method', detail: '(fn, ...args) → thread', info: 'Spawns a new thread' },
  { label: 'delay', type: 'method', detail: '(seconds, fn) → thread', info: 'Delays thread creation' },
  { label: 'defer', type: 'method', detail: '(fn, ...args) → thread', info: 'Defers to next resumption' },
  { label: 'cancel', type: 'method', detail: '(thread) → void', info: 'Cancels a spawned thread' },
];

// RBXScriptSignal methods
export const SIGNAL_METHODS: CompletionItem[] = [
  { label: 'Connect', type: 'method', detail: '(fn) → RBXScriptConnection', info: 'Connects a callback' },
  { label: 'Once', type: 'method', detail: '(fn) → RBXScriptConnection', info: 'Connects for one fire' },
  { label: 'Wait', type: 'method', detail: '() → ...args', info: 'Yields until the signal fires' },
];

// RemoteEvent methods
export const REMOTE_EVENT_API: CompletionItem[] = [
  { label: 'FireServer', type: 'method', detail: '(...args) → void', info: 'Fires to server from client' },
  { label: 'FireClient', type: 'method', detail: '(player, ...args) → void', info: 'Fires to specific client' },
  { label: 'FireAllClients', type: 'method', detail: '(...args) → void', info: 'Fires to all clients' },
  { label: 'OnServerEvent', type: 'property', detail: 'RBXScriptSignal', info: 'Server-side event handler' },
  { label: 'OnClientEvent', type: 'property', detail: 'RBXScriptSignal', info: 'Client-side event handler' },
];

// math library completions
export const MATH_API: CompletionItem[] = [
  { label: 'abs', type: 'function', detail: '(x) → number' },
  { label: 'ceil', type: 'function', detail: '(x) → number' },
  { label: 'floor', type: 'function', detail: '(x) → number' },
  { label: 'sqrt', type: 'function', detail: '(x) → number' },
  { label: 'sin', type: 'function', detail: '(x) → number' },
  { label: 'cos', type: 'function', detail: '(x) → number' },
  { label: 'tan', type: 'function', detail: '(x) → number' },
  { label: 'random', type: 'function', detail: '(m?, n?) → number' },
  { label: 'max', type: 'function', detail: '(...) → number' },
  { label: 'min', type: 'function', detail: '(...) → number' },
  { label: 'clamp', type: 'function', detail: '(x, min, max) → number', info: 'Luau extension' },
  { label: 'huge', type: 'constant', detail: 'number (infinity)' },
  { label: 'pi', type: 'constant', detail: 'number (3.14159...)' },
  { label: 'round', type: 'function', detail: '(x) → number', info: 'Luau extension' },
  { label: 'sign', type: 'function', detail: '(x) → number', info: 'Luau extension' },
  { label: 'noise', type: 'function', detail: '(x, y?, z?) → number', info: 'Perlin noise' },
  { label: 'log', type: 'function', detail: '(x, base?) → number' },
  { label: 'exp', type: 'function', detail: '(x) → number' },
  { label: 'pow', type: 'function', detail: '(x, y) → number' },
];

// string library completions
export const STRING_API: CompletionItem[] = [
  { label: 'byte', type: 'function', detail: '(s, i?, j?) → number...' },
  { label: 'char', type: 'function', detail: '(...bytes) → string' },
  { label: 'find', type: 'function', detail: '(s, pattern, init?, plain?) → (number, number)' },
  { label: 'format', type: 'function', detail: '(format, ...) → string' },
  { label: 'gmatch', type: 'function', detail: '(s, pattern) → iterator' },
  { label: 'gsub', type: 'function', detail: '(s, pattern, repl, n?) → string' },
  { label: 'len', type: 'function', detail: '(s) → number' },
  { label: 'lower', type: 'function', detail: '(s) → string' },
  { label: 'upper', type: 'function', detail: '(s) → string' },
  { label: 'match', type: 'function', detail: '(s, pattern, init?) → ...captures' },
  { label: 'rep', type: 'function', detail: '(s, n, sep?) → string' },
  { label: 'reverse', type: 'function', detail: '(s) → string' },
  { label: 'sub', type: 'function', detail: '(s, i, j?) → string' },
  { label: 'split', type: 'function', detail: '(s, sep) → {string}', info: 'Luau extension' },
];

// table library completions
export const TABLE_API: CompletionItem[] = [
  { label: 'insert', type: 'function', detail: '(t, [pos], value) → void' },
  { label: 'remove', type: 'function', detail: '(t, pos?) → value' },
  { label: 'sort', type: 'function', detail: '(t, comp?) → void' },
  { label: 'concat', type: 'function', detail: '(t, sep?, i?, j?) → string' },
  { label: 'find', type: 'function', detail: '(t, value, init?) → number?', info: 'Luau extension' },
  { label: 'create', type: 'function', detail: '(count, value?) → table', info: 'Luau extension' },
  { label: 'move', type: 'function', detail: '(t, from, to, dest) → table', info: 'Luau extension' },
  { label: 'clear', type: 'function', detail: '(t) → void', info: 'Luau extension' },
  { label: 'freeze', type: 'function', detail: '(t) → table', info: 'Luau extension' },
  { label: 'isfrozen', type: 'function', detail: '(t) → boolean', info: 'Luau extension' },
  { label: 'clone', type: 'function', detail: '(t) → table', info: 'Luau extension' },
  { label: 'unpack', type: 'function', detail: '(t, i?, j?) → ...' },
  { label: 'pack', type: 'function', detail: '(...) → table' },
];

// Code snippets
export const CODE_SNIPPETS = [
  {
    label: 'for i loop',
    snippet: 'for ${1:i} = ${2:1}, ${3:10} do\n\t${4:-- body}\nend',
    detail: 'Numeric for loop',
  },
  {
    label: 'for ipairs',
    snippet: 'for ${1:i}, ${2:v} in ipairs(${3:table}) do\n\t${4:-- body}\nend',
    detail: 'Array iteration',
  },
  {
    label: 'for pairs',
    snippet: 'for ${1:key}, ${2:value} in pairs(${3:table}) do\n\t${4:-- body}\nend',
    detail: 'Table iteration',
  },
  {
    label: 'function',
    snippet: 'function ${1:name}(${2:args})\n\t${3:-- body}\nend',
    detail: 'Function declaration',
  },
  {
    label: 'local function',
    snippet: 'local function ${1:name}(${2:args})\n\t${3:-- body}\nend',
    detail: 'Local function',
  },
  {
    label: 'if then',
    snippet: 'if ${1:condition} then\n\t${2:-- body}\nend',
    detail: 'If statement',
  },
  {
    label: 'if then else',
    snippet: 'if ${1:condition} then\n\t${2:-- true}\nelse\n\t${3:-- false}\nend',
    detail: 'If-else statement',
  },
  {
    label: 'while do',
    snippet: 'while ${1:condition} do\n\t${2:-- body}\nend',
    detail: 'While loop',
  },
  {
    label: 'repeat until',
    snippet: 'repeat\n\t${1:-- body}\nuntil ${2:condition}',
    detail: 'Repeat-until loop',
  },
  {
    label: 'pcall',
    snippet: 'local ${1:success}, ${2:result} = pcall(function()\n\t${3:-- body}\nend)',
    detail: 'Protected call',
  },
  {
    label: 'GetService',
    snippet: 'local ${1:Service} = game:GetService("${2:ServiceName}")',
    detail: 'Get a Roblox service',
  },
  {
    label: 'Instance.new',
    snippet: 'local ${1:instance} = Instance.new("${2:Part}")\n${1:instance}.Name = "${3:Name}"\n${1:instance}.Parent = ${4:workspace}',
    detail: 'Create new Instance',
  },
  {
    label: 'RemoteEvent setup',
    snippet: 'local ${1:remote} = Instance.new("RemoteEvent")\n${1:remote}.Name = "${2:EventName}"\n${1:remote}.Parent = game:GetService("ReplicatedStorage")',
    detail: 'Create RemoteEvent',
  },
  {
    label: 'Connect event',
    snippet: '${1:signal}:Connect(function(${2:args})\n\t${3:-- handler}\nend)',
    detail: 'Connect to signal',
  },
  {
    label: 'task.spawn',
    snippet: 'task.spawn(function()\n\t${1:-- body}\nend)',
    detail: 'Spawn new thread',
  },
  {
    label: 'task.delay',
    snippet: 'task.delay(${1:1}, function()\n\t${2:-- body}\nend)',
    detail: 'Delayed execution',
  },
  {
    label: 'ModuleScript template',
    snippet: 'local ${1:Module} = {}\n\nfunction ${1:Module}.${2:method}(${3:args})\n\t${4:-- body}\nend\n\nreturn ${1:Module}',
    detail: 'ModuleScript boilerplate',
  },
  {
    label: 'type annotation',
    snippet: 'type ${1:TypeName} = {\n\t${2:field}: ${3:string},\n}',
    detail: 'Luau type declaration',
  },
];
