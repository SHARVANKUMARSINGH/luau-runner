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
  { label: '"Workspace"', type: 'constant', detail: 'Service', info: 'Contains all 3D objects and world hierarchy' },
  { label: '"Players"', type: 'constant', detail: 'Service', info: 'Manages players, characters, and client connections' },
  { label: '"Lighting"', type: 'constant', detail: 'Service', info: 'Controls global ambient lighting, sky, shadows, and fog' },
  { label: '"ReplicatedStorage"', type: 'constant', detail: 'Service', info: 'Shared storage for server and client (RemoteEvents, modules)' },
  { label: '"ReplicatedFirst"', type: 'constant', detail: 'Service', info: 'Client scripts loaded first before anything else' },
  { label: '"ServerStorage"', type: 'constant', detail: 'Service', info: 'Secure server-only storage inaccessible to clients' },
  { label: '"ServerScriptService"', type: 'constant', detail: 'Service', info: 'Server-only scripts container' },
  { label: '"StarterPlayer"', type: 'constant', detail: 'Service', info: 'Character defaults and player starter scripts' },
  { label: '"StarterGui"', type: 'constant', detail: 'Service', info: 'Default player screen GUIs' },
  { label: '"StarterPack"', type: 'constant', detail: 'Service', info: 'Default player inventory tools' },
  { label: '"RunService"', type: 'constant', detail: 'Service', info: 'Heartbeat, Stepped, RenderStepped callbacks' },
  { label: '"TweenService"', type: 'constant', detail: 'Service', info: 'Smooth value & property interpolation over time' },
  { label: '"HttpService"', type: 'constant', detail: 'Service', info: 'JSON encode/decode, GUID generation, and HTTP requests' },
  { label: '"DataStoreService"', type: 'constant', detail: 'Service', info: 'Persistent cloud key-value data storage' },
  { label: '"CollectionService"', type: 'constant', detail: 'Service', info: 'Tag-based instance grouping and component management' },
  { label: '"Debris"', type: 'constant', detail: 'Service', info: 'Timed cleanup and instance destruction scheduler' },
  { label: '"UserInputService"', type: 'constant', detail: 'Service', info: 'Keyboard, mouse, touch, and gamepad input detection' },
  { label: '"ContextActionService"', type: 'constant', detail: 'Service', info: 'Binds actions to keys, mouse clicks, and mobile touch buttons' },
  { label: '"SoundService"', type: 'constant', detail: 'Service', info: 'Audio playback and 3D sound acoustics management' },
  { label: '"MarketplaceService"', type: 'constant', detail: 'Service', info: 'Game passes, developer products, and asset monetization' },
  { label: '"BadgeService"', type: 'constant', detail: 'Service', info: 'Awards and checks player game badges' },
  { label: '"TeleportService"', type: 'constant', detail: 'Service', info: 'Teleports players between Roblox places and servers' },
  { label: '"TextChatService"', type: 'constant', detail: 'Service', info: 'Modern Roblox text chat channels and message handling' },
  { label: '"Chat"', type: 'constant', detail: 'Service', info: 'Legacy Roblox chat filtering and bubble chat' },
  { label: '"PathfindingService"', type: 'constant', detail: 'Service', info: 'AI navigation mesh computation and waypoints' },
  { label: '"PhysicsService"', type: 'constant', detail: 'Service', info: 'Custom collision groups and physics filtering' },
  { label: '"LocalizationService"', type: 'constant', detail: 'Service', info: 'Language localization and player country region' },
  { label: '"PolicyService"', type: 'constant', detail: 'Service', info: 'Player region compliance and safety policies' },
  { label: '"GuiService"', type: 'constant', detail: 'Service', info: 'Screen insets, menu state, and UI navigation' },
  { label: '"GroupService"', type: 'constant', detail: 'Service', info: 'Roblox community group info and player ranks' },
  { label: '"MemoryStoreService"', type: 'constant', detail: 'Service', info: 'High-throughput in-memory sorted maps and queues' },
  { label: '"ProximityPromptService"', type: 'constant', detail: 'Service', info: 'Global 3D interaction prompts and hold triggers' },
  { label: '"LogService"', type: 'constant', detail: 'Service', info: 'Output message logging and diagnostics' },
  { label: '"TestService"', type: 'constant', detail: 'Service', info: 'Unit testing and assertions' },
  { label: '"AssetService"', type: 'constant', detail: 'Service', info: 'Dynamic asset and place management' },
];

// Instance methods
export const INSTANCE_METHODS: CompletionItem[] = [
  { label: 'FindFirstChild', type: 'method', detail: '(name, recursive?) → Instance?', info: 'Finds a child by name' },
  { label: 'FindFirstChildOfClass', type: 'method', detail: '(className) → Instance?', info: 'Finds child by class' },
  { label: 'FindFirstChildWhichIsA', type: 'method', detail: '(className) → Instance?', info: 'Finds child matching class hierarchy' },
  { label: 'FindFirstAncestor', type: 'method', detail: '(name) → Instance?', info: 'Finds ancestor by name' },
  { label: 'FindFirstAncestorOfClass', type: 'method', detail: '(className) → Instance?', info: 'Finds ancestor by class' },
  { label: 'FindFirstAncestorWhichIsA', type: 'method', detail: '(className) → Instance?', info: 'Finds ancestor matching class hierarchy' },
  { label: 'WaitForChild', type: 'method', detail: '(name, timeout?) → Instance', info: 'Waits for child to exist' },
  { label: 'GetChildren', type: 'method', detail: '() → {Instance}', info: 'Returns all direct children' },
  { label: 'GetDescendants', type: 'method', detail: '() → {Instance}', info: 'Returns all descendants' },
  { label: 'IsA', type: 'method', detail: '(className) → boolean', info: 'Checks class hierarchy' },
  { label: 'IsDescendantOf', type: 'method', detail: '(ancestor) → boolean', info: 'Checks if instance is descendant of ancestor' },
  { label: 'IsAncestorOf', type: 'method', detail: '(descendant) → boolean', info: 'Checks if instance is ancestor of descendant' },
  { label: 'GetFullName', type: 'method', detail: '() → string', info: 'Returns full dot-separated path' },
  { label: 'Clone', type: 'method', detail: '() → Instance', info: 'Creates a deep copy' },
  { label: 'Destroy', type: 'method', detail: '() → void', info: 'Removes and cleans up instance and children' },
  { label: 'ClearAllChildren', type: 'method', detail: '() → void', info: 'Destroys all children' },
  { label: 'SetAttribute', type: 'method', detail: '(name, value) → void', info: 'Sets custom attribute value' },
  { label: 'GetAttribute', type: 'method', detail: '(name) → any', info: 'Gets custom attribute value' },
  { label: 'GetAttributes', type: 'method', detail: '() → table', info: 'Returns dictionary of all attributes' },
  { label: 'GetAttributeChangedSignal', type: 'method', detail: '(name) → RBXScriptSignal', info: 'Fires when specific attribute changes' },
  { label: 'GetPropertyChangedSignal', type: 'method', detail: '(propName) → RBXScriptSignal', info: 'Fires when specific property changes' },
  { label: 'AddTag', type: 'method', detail: '(tag) → void', info: 'Adds CollectionService tag' },
  { label: 'RemoveTag', type: 'method', detail: '(tag) → void', info: 'Removes CollectionService tag' },
  { label: 'HasTag', type: 'method', detail: '(tag) → boolean', info: 'Checks if instance has tag' },
  { label: 'GetTags', type: 'method', detail: '() → {string}', info: 'Returns array of assigned tags' },
  { label: 'GetPivot', type: 'method', detail: '() → CFrame', info: 'Returns pivot or PrimaryPart CFrame' },
  { label: 'PivotTo', type: 'method', detail: '(targetCFrame) → void', info: 'Pivots model or part to target CFrame' },
  { label: 'MoveTo', type: 'method', detail: '(targetPosition) → void', info: 'Moves model or humanoid to position' },
  { label: 'TranslateBy', type: 'method', detail: '(delta) → void', info: 'Translates all parts by delta vector' },
  { label: 'GetBoundingBox', type: 'method', detail: '() → (CFrame, Vector3)', info: 'Returns model CFrame and extents size' },
  { label: 'GetExtentsSize', type: 'method', detail: '() → Vector3', info: 'Returns total bounding size' },
  { label: 'ScaleTo', type: 'method', detail: '(factor) → void', info: 'Scales model parts and offsets' },
  { label: 'GetScale', type: 'method', detail: '() → number', info: 'Returns current model scale' },
  { label: 'GetMass', type: 'method', detail: '() → number', info: 'Calculates physical mass' },
  { label: 'GetRootPart', type: 'method', detail: '() → BasePart?', info: 'Returns root assembly part' },
  { label: 'BreakJoints', type: 'method', detail: '() → void', info: 'Destroys welds and constraints' },
  { label: 'MakeJoints', type: 'method', detail: '() → void', info: 'Creates joints between adjacent parts' },
  { label: 'ApplyImpulse', type: 'method', detail: '(impulse: Vector3) → void', info: 'Applies instantaneous physical impulse' },
  { label: 'ApplyAngularImpulse', type: 'method', detail: '(impulse: Vector3) → void', info: 'Applies rotational impulse' },
  { label: 'ApplyImpulseAtPosition', type: 'method', detail: '(impulse, position) → void', info: 'Applies impulse at offset position' },
  { label: 'TakeDamage', type: 'method', detail: '(amount: number) → void', info: 'Inflicts damage on Humanoid' },
  { label: 'ChangeState', type: 'method', detail: '(state: EnumItem) → void', info: 'Changes Humanoid state' },
  { label: 'GetState', type: 'method', detail: '() → EnumItem', info: 'Returns current Humanoid state' },
  { label: 'EquipTool', type: 'method', detail: '(tool: Tool) → void', info: 'Equips tool into character' },
  { label: 'UnequipTools', type: 'method', detail: '() → void', info: 'Moves equipped tools back to Backpack' },
  { label: 'LoadAnimation', type: 'method', detail: '(animation) → AnimationTrack', info: 'Loads animation track' },
  { label: 'TweenPosition', type: 'method', detail: '(endPos, dir?, style?, time?, override?, cb?) → boolean', info: 'Smoothly animates GuiObject position' },
  { label: 'TweenSize', type: 'method', detail: '(endSize, dir?, style?, time?, override?, cb?) → boolean', info: 'Smoothly animates GuiObject size' },
  { label: 'TweenSizeAndPosition', type: 'method', detail: '(size, pos, dir?, style?, time?, override?, cb?) → boolean', info: 'Smoothly animates GuiObject size and position' },
  { label: 'Play', type: 'method', detail: '() → void', info: 'Starts playing Sound or AnimationTrack' },
  { label: 'Stop', type: 'method', detail: '() → void', info: 'Stops Sound or AnimationTrack' },
  { label: 'Pause', type: 'method', detail: '() → void', info: 'Pauses Sound or Tween' },
  { label: 'Resume', type: 'method', detail: '() → void', info: 'Resumes Sound or Tween' },
  { label: 'Kick', type: 'method', detail: '(message?) → void', info: 'Disconnects player with notice' },
  { label: 'LoadCharacter', type: 'method', detail: '() → void', info: 'Spawns avatar character for player' },
  { label: 'Raycast', type: 'method', detail: '(origin, direction, params?) → RaycastResult?', info: 'Performs raycast against workspace geometry' },
  { label: 'FindPartOnRay', type: 'method', detail: '(ray, ignoreInstance?) → (Part?, Vector3, Vector3, Material)', info: 'Legacy raycast query' },
];

// Instance properties
export const INSTANCE_PROPERTIES: CompletionItem[] = [
  { label: 'Name', type: 'property', detail: 'string', info: 'The name of the instance' },
  { label: 'ClassName', type: 'property', detail: 'string (read-only)', info: 'The class name' },
  { label: 'Parent', type: 'property', detail: 'Instance?', info: 'The parent instance' },
  { label: 'Position', type: 'property', detail: 'Vector3', info: 'World-space position' },
  { label: 'CFrame', type: 'property', detail: 'CFrame', info: 'Coordinate frame matrix' },
  { label: 'Orientation', type: 'property', detail: 'Vector3', info: 'Rotation angles in degrees' },
  { label: 'Rotation', type: 'property', detail: 'Vector3', info: 'Rotation angles in degrees' },
  { label: 'Size', type: 'property', detail: 'Vector3 / UDim2', info: 'Dimensions of part or GUI' },
  { label: 'Anchored', type: 'property', detail: 'boolean', info: 'Prevents physics motion' },
  { label: 'CanCollide', type: 'property', detail: 'boolean', info: 'Enables physical collisions' },
  { label: 'CanTouch', type: 'property', detail: 'boolean', info: 'Enables Touched event firing' },
  { label: 'Transparency', type: 'property', detail: 'number', info: 'Visual transparency (0 to 1)' },
  { label: 'Reflectance', type: 'property', detail: 'number', info: 'Visual reflectance' },
  { label: 'Color', type: 'property', detail: 'Color3', info: 'RGB color tint' },
  { label: 'BrickColor', type: 'property', detail: 'BrickColor', info: 'Named palette color' },
  { label: 'Material', type: 'property', detail: 'Enum.Material', info: 'Surface material texture' },
  { label: 'PrimaryPart', type: 'property', detail: 'BasePart?', info: 'Primary part of Model' },
  { label: 'Health', type: 'property', detail: 'number', info: 'Current health points' },
  { label: 'MaxHealth', type: 'property', detail: 'number', info: 'Maximum health capacity' },
  { label: 'WalkSpeed', type: 'property', detail: 'number', info: 'Avatar movement speed' },
  { label: 'JumpPower', type: 'property', detail: 'number', info: 'Vertical jump power' },
  { label: 'Value', type: 'property', detail: 'any', info: 'Value of ValueBase instance' },
  { label: 'Visible', type: 'property', detail: 'boolean', info: 'UI element visibility' },
  { label: 'Text', type: 'property', detail: 'string', info: 'Displayed label or button text' },
];

// Instance events
export const INSTANCE_EVENTS: CompletionItem[] = [
  { label: 'Changed', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a property changes' },
  { label: 'ChildAdded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a child is added' },
  { label: 'ChildRemoved', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a child is removed' },
  { label: 'DescendantAdded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when any descendant is added' },
  { label: 'DescendantRemoving', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when any descendant is removed' },
  { label: 'AncestryChanged', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when Parent or ancestor changes' },
  { label: 'Destroying', type: 'property', detail: 'RBXScriptSignal', info: 'Fires before destruction' },
  { label: 'AttributeChanged', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when an attribute changes' },
  { label: 'Touched', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a physical collision occurs' },
  { label: 'TouchEnded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when collision contact ends' },
  { label: 'Died', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when Humanoid Health reaches 0' },
  { label: 'HealthChanged', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when Humanoid Health changes' },
  { label: 'StateChanged', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when Humanoid changes state' },
  { label: 'Activated', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when Tool or button is activated' },
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

// Vector3 API
export const VECTOR3_API: CompletionItem[] = [
  { label: 'new', type: 'function', detail: '(x?, y?, z?) → Vector3', info: 'Creates a 3D vector' },
  { label: 'zero', type: 'constant', detail: 'Vector3 (0, 0, 0)', info: 'Zero vector' },
  { label: 'one', type: 'constant', detail: 'Vector3 (1, 1, 1)', info: 'Unit vector' },
  { label: 'xAxis', type: 'constant', detail: 'Vector3 (1, 0, 0)', info: 'X axis unit vector' },
  { label: 'yAxis', type: 'constant', detail: 'Vector3 (0, 1, 0)', info: 'Y axis unit vector' },
  { label: 'zAxis', type: 'constant', detail: 'Vector3 (0, 0, 1)', info: 'Z axis unit vector' },
];

// CFrame API
export const CFRAME_API: CompletionItem[] = [
  { label: 'new', type: 'function', detail: '(pos?, lookAt?) → CFrame', info: 'Creates a coordinate frame' },
  { label: 'Angles', type: 'function', detail: '(rx, ry, rz) → CFrame', info: 'Creates CFrame from Euler angles (radians)' },
  { label: 'identity', type: 'constant', detail: 'CFrame', info: 'Identity coordinate frame' },
  { label: 'lookAt', type: 'function', detail: '(at, target) → CFrame', info: 'CFrame facing a target' },
  { label: 'fromEulerAnglesXYZ', type: 'function', detail: '(rx, ry, rz) → CFrame', info: 'Euler angles XYZ' },
];

// Color3 API
export const COLOR3_API: CompletionItem[] = [
  { label: 'fromRGB', type: 'function', detail: '(r, g, b) → Color3', info: 'Color from 0-255 RGB values' },
  { label: 'fromHex', type: 'function', detail: '(hexString) → Color3', info: 'Color from hex string (e.g. #FFAA00)' },
  { label: 'new', type: 'function', detail: '(r?, g?, b?) → Color3', info: 'Color from 0-1 values' },
  { label: 'fromHSV', type: 'function', detail: '(h, s, v) → Color3', info: 'Color from hue, saturation, value' },
];

// UDim2 API
export const UDIM2_API: CompletionItem[] = [
  { label: 'new', type: 'function', detail: '(xScale, xOffset, yScale, yOffset) → UDim2', info: '2D UI dimension' },
  { label: 'fromScale', type: 'function', detail: '(xScale, yScale) → UDim2', info: 'Scale-only UDim2' },
  { label: 'fromOffset', type: 'function', detail: '(xOffset, yOffset) → UDim2', info: 'Offset-only UDim2' },
];

// UDim API
export const UDIM_API: CompletionItem[] = [
  { label: 'new', type: 'function', detail: '(scale, offset) → UDim', info: '1D UI dimension' },
];

// BrickColor API
export const BRICKCOLOR_API: CompletionItem[] = [
  { label: 'new', type: 'function', detail: '(name | number | color) → BrickColor', info: 'Roblox palette color' },
  { label: 'random', type: 'function', detail: '() → BrickColor', info: 'Random BrickColor' },
  { label: 'Red', type: 'function', detail: '() → BrickColor' },
  { label: 'Blue', type: 'function', detail: '() → BrickColor' },
  { label: 'Green', type: 'function', detail: '() → BrickColor' },
  { label: 'Yellow', type: 'function', detail: '() → BrickColor' },
  { label: 'White', type: 'function', detail: '() → BrickColor' },
  { label: 'Black', type: 'function', detail: '() → BrickColor' },
];

// TweenInfo API
export const TWEENINFO_API: CompletionItem[] = [
  { label: 'new', type: 'function', detail: '(time?, style?, dir?, count?, reverses?, delay?) → TweenInfo', info: 'Tween parameters' },
];

// TweenService API
export const TWEENSERVICE_API: CompletionItem[] = [
  { label: 'Create', type: 'method', detail: '(instance, tweenInfo, propertyTable) → Tween', info: 'Creates a new Tween object for smooth property animation' },
  { label: 'GetValue', type: 'method', detail: '(alpha, easingStyle, easingDirection) → number', info: 'Calculates the eased alpha value along an easing curve' },
];

// HttpService API
export const HTTPSERVICE_API: CompletionItem[] = [
  { label: 'JSONEncode', type: 'method', detail: '(data) → string', info: 'Serializes a table or primitive into a standard JSON string' },
  { label: 'JSONDecode', type: 'method', detail: '(jsonString) → any', info: 'Parses a JSON string into a native Luau table' },
  { label: 'GenerateGUID', type: 'method', detail: '(wrapInCurlyBraces?: boolean) → string', info: 'Generates a random v4 UUID / GUID string' },
  { label: 'UrlEncode', type: 'method', detail: '(str: string) → string', info: 'URL encodes a given string for web queries' },
  { label: 'GetAsync', type: 'method', detail: '(url: string) → string', info: 'Sends an HTTP GET request' },
  { label: 'PostAsync', type: 'method', detail: '(url: string, data: string) → string', info: 'Sends an HTTP POST request' },
];

// DataStoreService API
export const DATASTORESERVICE_API: CompletionItem[] = [
  { label: 'GetDataStore', type: 'method', detail: '(name: string, scope?: string) → GlobalDataStore', info: 'Retrieves or creates a named persistent key-value data store' },
  { label: 'GetOrderedDataStore', type: 'method', detail: '(name: string, scope?: string) → OrderedDataStore', info: 'Retrieves or creates an ordered integer data store' },
];
export const DATASTORE_API = DATASTORESERVICE_API;

// CollectionService API
export const COLLECTIONSERVICE_API: CompletionItem[] = [
  { label: 'AddTag', type: 'method', detail: '(instance: Instance, tag: string) → void', info: 'Attaches a CollectionService tag to an instance' },
  { label: 'RemoveTag', type: 'method', detail: '(instance: Instance, tag: string) → void', info: 'Removes a tag from an instance' },
  { label: 'HasTag', type: 'method', detail: '(instance: Instance, tag: string) → boolean', info: 'Checks whether an instance has the specified tag' },
  { label: 'GetTags', type: 'method', detail: '(instance: Instance) → {string}', info: 'Returns an array of all tags attached to the instance' },
  { label: 'GetTagged', type: 'method', detail: '(tag: string) → {Instance}', info: 'Returns all instances in the DataModel with the given tag' },
  { label: 'GetInstanceAddedSignal', type: 'method', detail: '(tag: string) → RBXScriptSignal', info: 'Signal fired when an instance is tagged with this tag' },
  { label: 'GetInstanceRemovedSignal', type: 'method', detail: '(tag: string) → RBXScriptSignal', info: 'Signal fired when a tag is removed from an instance' },
];

// Debris API
export const DEBRIS_API: CompletionItem[] = [
  { label: 'AddItem', type: 'method', detail: '(item: Instance, lifetime: number) → void', info: 'Schedules an instance to be automatically destroyed after lifetime seconds' },
];

// MarketplaceService API
export const MARKETPLACESERVICE_API: CompletionItem[] = [
  { label: 'UserOwnsGamePassAsync', type: 'method', detail: '(userId: number, passId: number) → boolean', info: 'Checks if a player owns a gamepass' },
  { label: 'GetProductInfo', type: 'method', detail: '(assetId: number, infoType?: number) → table', info: 'Fetches product details from Roblox marketplace' },
  { label: 'PromptPurchase', type: 'method', detail: '(player: Player, assetId: number) → void', info: 'Prompts the player to purchase an asset' },
  { label: 'PromptGamePassPurchase', type: 'method', detail: '(player: Player, passId: number) → void', info: 'Prompts the player to purchase a gamepass' },
  { label: 'PromptPurchaseFinished', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when an asset purchase prompt finishes' },
  { label: 'PromptGamePassPurchaseFinished', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a gamepass purchase prompt finishes' },
];

// UserInputService API
export const USERINPUTSERVICE_API: CompletionItem[] = [
  { label: 'IsKeyDown', type: 'method', detail: '(keyCode: Enum.KeyCode) → boolean', info: 'Returns whether the specified keyboard key is held down' },
  { label: 'IsMouseButtonPressed', type: 'method', detail: '(button: Enum.UserInputType) → boolean', info: 'Returns whether the mouse button is pressed' },
  { label: 'GetMouseLocation', type: 'method', detail: '() → Vector2', info: 'Returns the 2D cursor coordinates on screen' },
  { label: 'InputBegan', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when user initiates any key, mouse, or touch input' },
  { label: 'InputEnded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when user releases input' },
  { label: 'TouchTap', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when user taps a touch screen' },
];

// Enum API
export const ENUM_API: CompletionItem[] = [
  { label: 'Material', type: 'class', detail: 'Enum', info: 'Part materials (Plastic, Neon, Wood, etc.)' },
  { label: 'EasingStyle', type: 'class', detail: 'Enum', info: 'Tween easing styles (Linear, Quad, Bounce, etc.)' },
  { label: 'EasingDirection', type: 'class', detail: 'Enum', info: 'Tween easing directions (In, Out, InOut)' },
  { label: 'KeyCode', type: 'class', detail: 'Enum', info: 'Keyboard keys (E, Space, Return, etc.)' },
  { label: 'UserInputType', type: 'class', detail: 'Enum', info: 'Input types (MouseButton1, Touch, Keyboard)' },
  { label: 'Font', type: 'class', detail: 'Enum', info: 'UI font families (SourceSans, Gotham, etc.)' },
  { label: 'HumanoidStateType', type: 'class', detail: 'Enum', info: 'Humanoid states (Jumping, Freefall, etc.)' },
];

// BasePart properties & events
export const BASEPART_API: CompletionItem[] = [
  { label: 'Position', type: 'property', detail: 'Vector3', info: '3D world position' },
  { label: 'CFrame', type: 'property', detail: 'CFrame', info: 'Position and orientation' },
  { label: 'Size', type: 'property', detail: 'Vector3', info: 'Dimensions of the part' },
  { label: 'Color', type: 'property', detail: 'Color3', info: 'Color3 of the part' },
  { label: 'BrickColor', type: 'property', detail: 'BrickColor', info: 'Palette color' },
  { label: 'Material', type: 'property', detail: 'Enum.Material', info: 'Physical appearance' },
  { label: 'Transparency', type: 'property', detail: 'number (0-1)', info: 'Opacity' },
  { label: 'Reflectance', type: 'property', detail: 'number (0-1)', info: 'Surface reflectiveness' },
  { label: 'Anchored', type: 'property', detail: 'boolean', info: 'Whether part is immovable' },
  { label: 'CanCollide', type: 'property', detail: 'boolean', info: 'Whether part collides' },
  { label: 'CanTouch', type: 'property', detail: 'boolean', info: 'Whether part fires Touched events' },
  { label: 'CastShadow', type: 'property', detail: 'boolean', info: 'Whether part casts shadows' },
  { label: 'Touched', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when touching another part' },
  { label: 'TouchEnded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when touch ends' },
];

// Players API
export const PLAYERS_API: CompletionItem[] = [
  { label: 'LocalPlayer', type: 'property', detail: 'Player? (client)', info: 'The local client Player' },
  { label: 'PlayerAdded', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a player joins' },
  { label: 'PlayerRemoving', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when a player leaves' },
  { label: 'GetPlayers', type: 'method', detail: '() → {Player}', info: 'Returns array of all players' },
  { label: 'GetPlayerFromCharacter', type: 'method', detail: '(char) → Player?', info: 'Finds Player owning character' },
];

// Humanoid API
export const HUMANOID_API: CompletionItem[] = [
  { label: 'Health', type: 'property', detail: 'number', info: 'Current health' },
  { label: 'MaxHealth', type: 'property', detail: 'number', info: 'Maximum health' },
  { label: 'WalkSpeed', type: 'property', detail: 'number', info: 'Movement speed (default 16)' },
  { label: 'JumpPower', type: 'property', detail: 'number', info: 'Jump power (default 50)' },
  { label: 'JumpHeight', type: 'property', detail: 'number', info: 'Jump height (default 7.2)' },
  { label: 'TakeDamage', type: 'method', detail: '(amount: number) → void', info: 'Damages humanoid' },
  { label: 'MoveTo', type: 'method', detail: '(target: Vector3) → void', info: 'Walks to position' },
  { label: 'Died', type: 'property', detail: 'RBXScriptSignal', info: 'Fires when health reaches 0' },
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
    label: 'while true do loop',
    snippet: 'while true do\n\ttask.wait(${1:1})\n\t${2:print("looping")}\nend',
    detail: 'Safe infinite loop with task.wait',
  },
  {
    label: 'Touched event',
    snippet: '${1:part}.Touched:Connect(function(${2:hit})\n\tlocal ${3:humanoid} = ${2:hit}.Parent:FindFirstChildWhichIsA("Humanoid")\n\tif ${3:humanoid} then\n\t\t${4:-- handle player touch}\n\tend\nend)',
    detail: 'Part Touched callback',
  },
  {
    label: 'PlayerAdded event',
    snippet: 'game:GetService("Players").PlayerAdded:Connect(function(${1:player})\n\tprint(${1:player}.Name .. " joined the game!")\n\t${2:-- setup player}\nend)',
    detail: 'Players.PlayerAdded handler',
  },
  {
    label: 'type annotation',
    snippet: 'type ${1:TypeName} = {\n\t${2:field}: ${3:string},\n}',
    detail: 'Luau type declaration',
  },
];
