/**
 * Luau & Roblox Function Explainer
 * 
 * Provides rich, detailed explanations for Roblox APIs, Luau standard libraries,
 * globals, datatypes, keywords, and user-defined functions in the script.
 */

export interface FunctionExplanation {
  name: string;
  type: 'function' | 'method' | 'service' | 'class' | 'datatype' | 'keyword' | 'user-function';
  typeLabel: string;
  signature: string;
  summary: string;
  parameters?: { name: string; type?: string; description: string }[];
  returns?: string;
  example?: string;
  definedLine?: number;
}

export const FUNCTION_EXPLANATIONS_DB: Record<string, Omit<FunctionExplanation, 'name' | 'typeLabel'>> = {
  // ===== TASK LIBRARY =====
  'task.wait': {
    type: 'function',
    signature: 'task.wait(duration?: number) → number',
    summary: 'Yields the current Luau thread for the specified duration (in seconds) and returns the actual elapsed time. Optimized for frame-rate independent timing.',
    parameters: [
      { name: 'duration', type: 'number?', description: 'Duration to pause in seconds (defaults to ~1/30 or 1 frame).' },
    ],
    returns: 'The actual elapsed time in seconds.',
    example: 'local elapsed = task.wait(1.5)\nprint("Waited for:", elapsed, "seconds")',
  },
  'wait': {
    type: 'function',
    signature: 'task.wait(duration?: number) → number',
    summary: 'Yields execution for the given duration in seconds. Uses the Roblox 60Hz task scheduler.',
    example: 'task.wait(0.5)',
  },
  'task.spawn': {
    type: 'function',
    signature: 'task.spawn(fn: function, ...args: any) → thread',
    summary: 'Spawns a function immediately on a new cooperative thread without waiting for the next engine cycle.',
    parameters: [
      { name: 'fn', type: 'function', description: 'The function to execute on the new thread.' },
      { name: '...args', type: 'any', description: 'Arguments to pass to the function.' },
    ],
    returns: 'The created thread object.',
    example: 'task.spawn(function(name)\n    print("Hello from spawned thread:", name)\nend, "Player1")',
  },
  'spawn': {
    type: 'function',
    signature: 'task.spawn(fn: function, ...args: any) → thread',
    summary: 'Spawns a function immediately on a new thread.',
    example: 'task.spawn(function() print("Running") end)',
  },
  'task.delay': {
    type: 'function',
    signature: 'task.delay(duration: number, fn: function, ...args: any) → thread',
    summary: 'Schedules a function to run on a new thread after the specified delay in seconds.',
    parameters: [
      { name: 'duration', type: 'number', description: 'Time in seconds to wait before running.' },
      { name: 'fn', type: 'function', description: 'Function to execute.' },
    ],
    returns: 'The scheduled thread.',
    example: 'task.delay(3, function()\n    print("3 seconds elapsed, executing action!")\nend)',
  },
  'delay': {
    type: 'function',
    signature: 'task.delay(duration: number, fn: function, ...args: any) → thread',
    summary: 'Schedules a function to execute after a given delay.',
    example: 'task.delay(2, function() print("Done") end)',
  },
  'task.defer': {
    type: 'function',
    signature: 'task.defer(fn: function, ...args: any) → thread',
    summary: 'Defers execution of the function until the end of the current engine resumption cycle.',
    example: 'task.defer(function() print("Ran after current stack unwinds") end)',
  },
  'task.cancel': {
    type: 'function',
    signature: 'task.cancel(t: thread) → void',
    summary: 'Cancels a thread created by task.spawn, task.delay, or task.defer, preventing further execution.',
    example: 'local t = task.delay(5, function() end)\ntask.cancel(t)',
  },

  // ===== INSTANCE API =====
  'Instance.new': {
    type: 'function',
    signature: 'Instance.new(className: string, parent?: Instance) → Instance',
    summary: 'Instantiates a new Roblox object of the specified class. Optionally sets parent (setting parent last is recommended for performance).',
    parameters: [
      { name: 'className', type: 'string', description: 'The class name of the instance to create (e.g. "Part", "Model", "Folder").' },
      { name: 'parent', type: 'Instance?', description: 'Optional instance to immediately parent the new object to.' },
    ],
    returns: 'The newly created Instance.',
    example: 'local part = Instance.new("Part")\npart.Size = Vector3.new(4, 1, 2)\npart.Position = Vector3.new(0, 10, 0)\npart.Parent = workspace',
  },
  'GetService': {
    type: 'method',
    signature: 'game:GetService(serviceName: string) → Instance',
    summary: 'Retrieves the singleton instance of the requested Roblox service (e.g. "Players", "TweenService", "HttpService").',
    parameters: [
      { name: 'serviceName', type: 'string', description: 'The name of the service to retrieve.' },
    ],
    returns: 'The singleton Service instance.',
    example: 'local TweenService = game:GetService("TweenService")\nlocal Players = game:GetService("Players")',
  },
  'WaitForChild': {
    type: 'method',
    signature: 'Instance:WaitForChild(childName: string, timeout?: number) → Instance',
    summary: 'Yields execution until a child with the given name exists or timeout expires. Crucial on client scripts when waiting for instances to replicate.',
    parameters: [
      { name: 'childName', type: 'string', description: 'Name of the child to wait for.' },
      { name: 'timeout', type: 'number?', description: 'Optional timeout in seconds (emits a warning if exceeded).' },
    ],
    returns: 'The resolved child Instance.',
    example: 'local humanoid = character:WaitForChild("Humanoid", 5)',
  },
  'FindFirstChild': {
    type: 'method',
    signature: 'Instance:FindFirstChild(name: string, recursive?: boolean) → Instance?',
    summary: 'Returns the first child with the given name without yielding, or nil if not found.',
    parameters: [
      { name: 'name', type: 'string', description: 'Name of the child to find.' },
      { name: 'recursive', type: 'boolean?', description: 'If true, searches all descendants deeply.' },
    ],
    returns: 'The found Instance, or nil.',
    example: 'local tool = character:FindFirstChild("Sword")',
  },
  'FindFirstChildOfClass': {
    type: 'method',
    signature: 'Instance:FindFirstChildOfClass(className: string) → Instance?',
    summary: 'Returns the first direct child matching the exact ClassName, or nil.',
    example: 'local hum = char:FindFirstChildOfClass("Humanoid")',
  },
  'FindFirstChildWhichIsA': {
    type: 'method',
    signature: 'Instance:FindFirstChildWhichIsA(className: string) → Instance?',
    summary: 'Returns the first child whose class inherits from className.',
    example: 'local part = model:FindFirstChildWhichIsA("BasePart")',
  },
  'GetChildren': {
    type: 'method',
    signature: 'Instance:GetChildren() → {Instance}',
    summary: 'Returns an array of all direct child instances of this object.',
    example: 'for _, child in ipairs(workspace:GetChildren()) do\n    print(child.Name, child.ClassName)\nend',
  },
  'GetDescendants': {
    type: 'method',
    signature: 'Instance:GetDescendants() → {Instance}',
    summary: 'Returns an array of all descendants (children, grandchildren, etc.) of this instance.',
    example: 'for _, desc in ipairs(workspace:GetDescendants()) do\n    if desc:IsA("BasePart") then desc.Anchored = true end\nend',
  },
  'IsA': {
    type: 'method',
    signature: 'Instance:IsA(className: string) → boolean',
    summary: 'Checks if this instance belongs to or inherits from the specified class name.',
    parameters: [
      { name: 'className', type: 'string', description: 'Class name to check (e.g. "BasePart", "GuiObject", "ValueBase").' },
    ],
    returns: 'true if the instance is or inherits from className.',
    example: 'if hit:IsA("BasePart") then print("Hit a physical part") end',
  },
  'Destroy': {
    type: 'method',
    signature: 'Instance:Destroy() → void',
    summary: 'Permanently removes the instance from the hierarchy, disconnects all connected events, and clears children.',
    example: 'part:Destroy()',
  },
  'Clone': {
    type: 'method',
    signature: 'Instance:Clone() → Instance',
    summary: 'Creates a deep duplicate copy of the instance and all its descendants (parent defaults to nil).',
    returns: 'The cloned Instance.',
    example: 'local copy = templatePart:Clone()\ncopy.Position = Vector3.new(0, 5, 0)\ncopy.Parent = workspace',
  },
  'ClearAllChildren': {
    type: 'method',
    signature: 'Instance:ClearAllChildren() → void',
    summary: 'Destroys and removes all child objects of this instance.',
    example: 'folder:ClearAllChildren()',
  },

  // ===== SIGNALS & EVENTS =====
  'Connect': {
    type: 'method',
    signature: 'Signal:Connect(listener: (...any) → void) → RBXScriptConnection',
    summary: 'Subscribes a listener callback function to this event. When the event fires, the callback is executed with the event parameters.',
    parameters: [
      { name: 'listener', type: 'function', description: 'Callback function that handles the event.' },
    ],
    returns: 'An RBXScriptConnection object that can be disconnected via :Disconnect().',
    example: 'local conn = part.Touched:Connect(function(hit)\n    print("Touched by:", hit.Name)\nend)',
  },
  'Disconnect': {
    type: 'method',
    signature: 'Connection:Disconnect() → void',
    summary: 'Unsubscribes a listener connection from an event so the callback is no longer invoked.',
    example: 'conn:Disconnect()',
  },
  'Fire': {
    type: 'method',
    signature: 'BindableEvent:Fire(...args: any) → void',
    summary: 'Fires a custom BindableEvent, invoking all connected listeners on the same context.',
    example: 'customEvent:Fire("ScoreUpdated", 100)',
  },

  // ===== TWEEN SERVICE =====
  'TweenService:Create': {
    type: 'method',
    signature: 'TweenService:Create(instance: Instance, tweenInfo: TweenInfo, propertyTable: table) → Tween',
    summary: 'Creates a Tween object to smoothly interpolate specified instance properties over time with easing curves.',
    parameters: [
      { name: 'instance', type: 'Instance', description: 'The instance whose properties to animate.' },
      { name: 'tweenInfo', type: 'TweenInfo', description: 'Tween timing, easing style, direction, repeat, and reverse settings.' },
      { name: 'propertyTable', type: 'table', description: 'Key-value map of target properties to interpolate towards.' },
    ],
    returns: 'A Tween object with :Play(), :Pause(), :Cancel(), and .Completed signal.',
    example: 'local info = TweenInfo.new(1.0, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)\nlocal tween = TweenService:Create(part, info, {\n    Position = Vector3.new(0, 20, 0),\n    Transparency = 0.5\n})\ntween:Play()',
  },
  'Create': {
    type: 'method',
    signature: 'TweenService:Create(instance, tweenInfo, goals) → Tween',
    summary: 'Creates a tween that animates instance properties using TweenInfo easing.',
    example: 'local tween = TweenService:Create(part, info, { Transparency = 1 })',
  },
  'Play': {
    type: 'method',
    signature: 'Tween:Play() → void',
    summary: 'Starts playback of the tween animation.',
    example: 'tween:Play()',
  },
  'Pause': {
    type: 'method',
    signature: 'Tween:Pause() → void',
    summary: 'Pauses the currently playing tween at its current interpolated position.',
    example: 'tween:Pause()',
  },
  'Cancel': {
    type: 'method',
    signature: 'Tween:Cancel() → void',
    summary: 'Cancels the tween playback and stops interpolation.',
    example: 'tween:Cancel()',
  },
  'TweenInfo.new': {
    type: 'function',
    signature: 'TweenInfo.new(time?: number, style?: EasingStyle, dir?: EasingDirection, repeatCount?: number, reverses?: boolean, delayTime?: number) → TweenInfo',
    summary: 'Constructs timing parameters for TweenService interpolation.',
    example: 'local info = TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)',
  },

  // ===== HTTP SERVICE =====
  'HttpService:JSONEncode': {
    type: 'method',
    signature: 'HttpService:JSONEncode(input: any) → string',
    summary: 'Serializes a Luau table, array, or primitive into a standard valid JSON string.',
    example: 'local json = HttpService:JSONEncode({ name = "Robloxian", score = 100 })',
  },
  'JSONEncode': {
    type: 'method',
    signature: 'HttpService:JSONEncode(input: any) → string',
    summary: 'Encodes data into a JSON string.',
    example: 'local json = HttpService:JSONEncode(myTable)',
  },
  'HttpService:JSONDecode': {
    type: 'method',
    signature: 'HttpService:JSONDecode(jsonString: string) → any',
    summary: 'Parses a JSON string into a native Luau table or primitive value.',
    example: 'local data = HttpService:JSONDecode(jsonString)\nprint(data.name)',
  },
  'JSONDecode': {
    type: 'method',
    signature: 'HttpService:JSONDecode(jsonString: string) → any',
    summary: 'Decodes a JSON string into a Luau table.',
    example: 'local tab = HttpService:JSONDecode(json)',
  },
  'HttpService:GenerateGUID': {
    type: 'method',
    signature: 'HttpService:GenerateGUID(wrap?: boolean) → string',
    summary: 'Generates a random RFC-4122 v4 UUID string, optionally wrapped with curly braces {}.',
    example: 'local id = HttpService:GenerateGUID(false) -- "b71407e3-de5f-4405-a04a-a0ba94fd079d"',
  },
  'GenerateGUID': {
    type: 'method',
    signature: 'HttpService:GenerateGUID(wrap?: boolean) → string',
    summary: 'Generates a unique GUID/UUID string.',
    example: 'local guid = HttpService:GenerateGUID(false)',
  },

  // ===== DATA STORE SERVICE =====
  'DataStoreService:GetDataStore': {
    type: 'method',
    signature: 'DataStoreService:GetDataStore(name: string, scope?: string) → GlobalDataStore',
    summary: 'Retrieves a persistent key-value DataStore with the given name and scope.',
    example: 'local leaderboards = DataStoreService:GetDataStore("Leaderboards")',
  },
  'GetDataStore': {
    type: 'method',
    signature: 'DataStoreService:GetDataStore(name: string, scope?: string) → GlobalDataStore',
    summary: 'Returns a DataStore instance.',
    example: 'local ds = DataStoreService:GetDataStore("SaveData")',
  },
  'GetAsync': {
    type: 'method',
    signature: 'DataStore:GetAsync(key: string) → any',
    summary: 'Retrieves the stored value associated with key from the DataStore.',
    example: 'local coins = ds:GetAsync("User_12345") or 0',
  },
  'SetAsync': {
    type: 'method',
    signature: 'DataStore:SetAsync(key: string, value: any) → void',
    summary: 'Saves the given value under key in the DataStore.',
    example: 'ds:SetAsync("User_12345", 500)',
  },
  'UpdateAsync': {
    type: 'method',
    signature: 'DataStore:UpdateAsync(key: string, transformFn: (oldValue: any) → any) → any',
    summary: 'Atomically retrieves and updates a DataStore entry via a transform callback function.',
    example: 'ds:UpdateAsync("User_12345", function(old)\n    return (old or 0) + 50\nend)',
  },

  // ===== DEBRIS & COLLECTION SERVICE =====
  'Debris:AddItem': {
    type: 'method',
    signature: 'Debris:AddItem(item: Instance, lifetime?: number) → void',
    summary: 'Schedules an instance to be destroyed automatically after lifetime seconds without yielding the current thread.',
    example: 'Debris:AddItem(bulletPart, 3.0)',
  },
  'AddItem': {
    type: 'method',
    signature: 'Debris:AddItem(item: Instance, lifetime?: number) → void',
    summary: 'Schedules an item for automatic cleanup.',
    example: 'Debris:AddItem(effect, 1.5)',
  },
  'CollectionService:AddTag': {
    type: 'method',
    signature: 'CollectionService:AddTag(instance: Instance, tag: string) → void',
    summary: 'Attaches a collection tag to an instance for easy grouping and querying.',
    example: 'CollectionService:AddTag(coin, "Collectable")',
  },
  'AddTag': {
    type: 'method',
    signature: 'CollectionService:AddTag(instance: Instance, tag: string) → void',
    summary: 'Tags an instance with a collection tag.',
    example: 'CollectionService:AddTag(mob, "Enemy")',
  },
  'GetTagged': {
    type: 'method',
    signature: 'CollectionService:GetTagged(tag: string) → {Instance}',
    summary: 'Returns an array of all instances in the game currently tagged with tag.',
    example: 'for _, enemy in ipairs(CollectionService:GetTagged("Enemy")) do\n    enemy:TakeDamage(10)\nend',
  },

  // ===== RAYCASTING =====
  'Raycast': {
    type: 'method',
    signature: 'workspace:Raycast(origin: Vector3, direction: Vector3, params?: RaycastParams) → RaycastResult?',
    summary: 'Casts a ray from origin in direction. Returns a RaycastResult with Instance, Position, Normal, and Material if an object was hit.',
    example: 'local result = workspace:Raycast(origin, dir * 100)\nif result then\n    print("Hit:", result.Instance.Name, "at:", result.Position)\nend',
  },

  // ===== CORE GLOBALS =====
  'print': {
    type: 'function',
    signature: 'print(...args: any) → void',
    summary: 'Outputs strings and object values to the runner console output separated by spaces.',
    example: 'print("Game loaded! Player count:", 10)',
  },
  'warn': {
    type: 'function',
    signature: 'warn(...args: any) → void',
    summary: 'Outputs a highlighted orange warning message with timestamp to the runner console.',
    example: 'warn("Resource took longer than expected to load")',
  },
  'error': {
    type: 'function',
    signature: 'error(message: string, level?: number) → never',
    summary: 'Throws a terminating Luau runtime error that stops current thread execution unless caught by pcall.',
    example: 'error("Invalid parameter value provided")',
  },
  'pcall': {
    type: 'function',
    signature: 'pcall(fn: function, ...args: any) → (boolean, any)',
    summary: 'Protected call that catches any runtime error thrown inside fn. Returns success boolean and result/error message.',
    example: 'local success, res = pcall(function()\n    return ds:GetAsync("Key")\nend)\nif not success then warn("DataStore error:", res) end',
  },
  'require': {
    type: 'function',
    signature: 'require(module: ModuleScript | string) → any',
    summary: 'Executes and caches the given ModuleScript, returning its exported return value.',
    example: 'local MathUtils = require("MathUtils")',
  },
  'typeof': {
    type: 'function',
    signature: 'typeof(value: any) → string',
    summary: 'Returns the exact Roblox datatype name ("Instance", "Vector3", "CFrame", "Color3", "UDim2", etc.) rather than primitive Lua "userdata".',
    example: 'print(typeof(workspace)) -- "Instance"\nprint(typeof(Vector3.new())) -- "Vector3"',
  },
  'assert': {
    type: 'function',
    signature: 'assert(condition: any, message?: string) → any',
    summary: 'Throws an error if condition is nil or false; otherwise returns all passed arguments.',
    example: 'assert(player ~= nil, "Player cannot be nil!")',
  },
  'tostring': {
    type: 'function',
    signature: 'tostring(val: any) → string',
    summary: 'Converts any value to its string representation.',
    example: 'local str = tostring(Vector3.new(1, 2, 3))',
  },
  'tonumber': {
    type: 'function',
    signature: 'tonumber(val: any, base?: number) → number?',
    summary: 'Converts a string or number to a number in the given base (default base 10), or returns nil.',
    example: 'local num = tonumber("42.5")',
  },

  // ===== MATH LIBRARY =====
  'math.random': {
    type: 'function',
    signature: 'math.random([m: number [, n: number]]) → number',
    summary: 'Generates pseudo-random numbers. With 2 args: integer in [m, n]. With 1 arg: integer in [1, m]. With 0 args: float in [0, 1).',
    example: 'local roll = math.random(1, 6)',
  },
  'math.floor': {
    type: 'function',
    signature: 'math.floor(x: number) → number',
    summary: 'Returns the largest integer less than or equal to x.',
    example: 'math.floor(3.7) -- 3',
  },
  'math.ceil': {
    type: 'function',
    signature: 'math.ceil(x: number) → number',
    summary: 'Returns the smallest integer greater than or equal to x.',
    example: 'math.ceil(3.2) -- 4',
  },
  'math.clamp': {
    type: 'function',
    signature: 'math.clamp(val: number, min: number, max: number) → number',
    summary: 'Clamps val between min and max bounds.',
    example: 'local health = math.clamp(currentHealth, 0, 100)',
  },
  'math.abs': {
    type: 'function',
    signature: 'math.abs(x: number) → number',
    summary: 'Returns the absolute value of x.',
    example: 'math.abs(-15) -- 15',
  },
  'math.sqrt': {
    type: 'function',
    signature: 'math.sqrt(x: number) → number',
    summary: 'Returns the square root of x.',
    example: 'math.sqrt(16) -- 4',
  },

  // ===== TABLE LIBRARY =====
  'table.insert': {
    type: 'function',
    signature: 'table.insert(list: table, [pos: number,] val: any) → void',
    summary: 'Inserts val at the specified position in list (defaults to the end).',
    example: 'local list = {}\ntable.insert(list, "Apple")',
  },
  'table.remove': {
    type: 'function',
    signature: 'table.remove(list: table, pos?: number) → any',
    summary: 'Removes the element at pos (defaults to the last) and returns it, shifting remaining elements down.',
    example: 'local removed = table.remove(list, 1)',
  },
  'table.find': {
    type: 'function',
    signature: 'table.find(list: table, val: any, init?: number) → number?',
    summary: 'Returns the first numeric index where val appears in list, or nil.',
    example: 'local idx = table.find(inventory, "Sword")',
  },
  'table.sort': {
    type: 'function',
    signature: 'table.sort(list: table, comp?: (a: any, b: any) → boolean) → void',
    summary: 'Sorts elements of list in-place in ascending order or using custom comparison function comp.',
    example: 'table.sort(scores, function(a, b) return a > b end)',
  },

  // ===== STRING LIBRARY =====
  'string.format': {
    type: 'function',
    signature: 'string.format(formatstring: string, ...args: any) → string',
    summary: 'Returns a formatted version of its variable number of arguments following the description given in formatstring.',
    example: 'local msg = string.format("Player %s has %d points", "Alex", 150)',
  },
  'string.sub': {
    type: 'function',
    signature: 'string.sub(s: string, i: number, j?: number) → string',
    summary: 'Returns the substring of s starting at index i and ending at index j.',
    example: 'local sub = string.sub("Hello World", 1, 5) -- "Hello"',
  },

  // ===== DATATYPES =====
  'Vector3.new': {
    type: 'datatype',
    signature: 'Vector3.new(x?: number, y?: number, z?: number) → Vector3',
    summary: 'Constructs a 3D coordinate vector representing 3D position, size, or velocity.',
    example: 'local pos = Vector3.new(0, 50, 0)',
  },
  'Vector3': {
    type: 'datatype',
    signature: 'Vector3(X, Y, Z)',
    summary: '3D coordinate vector with X, Y, Z float components.',
    example: 'part.Position = Vector3.new(0, 10, 0)',
  },
  'CFrame.new': {
    type: 'datatype',
    signature: 'CFrame.new(x, y, z) → CFrame',
    summary: 'Constructs a 3D CoordinateFrame representing 3D spatial position and rotational orientation matrix.',
    example: 'part.CFrame = CFrame.new(0, 10, 0)',
  },
  'Color3.fromRGB': {
    type: 'datatype',
    signature: 'Color3.fromRGB(r: number, g: number, b: number) → Color3',
    summary: 'Constructs a Color3 using standard 0-255 RGB integer values.',
    example: 'part.Color = Color3.fromRGB(255, 80, 80)',
  },
  'UDim2.new': {
    type: 'datatype',
    signature: 'UDim2.new(xScale, xOffset, yScale, yOffset) → UDim2',
    summary: 'Constructs a 2D position or size coordinate combining proportional scale (0-1) and absolute pixel offset.',
    example: 'frame.Size = UDim2.new(1, 0, 0, 50)',
  },
};

/**
 * Explains a function, method, keyword, or user-defined function.
 */
export function explainFunctionOrToken(
  token: string,
  lineTextOrScript = '',
  fullScript?: string
): FunctionExplanation | null {
  if (!token) return null;
  const clean = token.trim();
  if (!clean) return null;

  const lineText = fullScript !== undefined ? lineTextOrScript : undefined;
  const scriptContent = fullScript !== undefined ? fullScript : (lineTextOrScript || '');

  // 0. If lineText is provided, check for member/method context like TweenService:Create or math.floor
  if (lineText) {
    const pattern = new RegExp(`([a-zA-Z0-9_]+)[:.]${clean}\\b`);
    const match = lineText.match(pattern);
    if (match) {
      const colonKey = `${match[1]}:${clean}`;
      const dotKey = `${match[1]}.${clean}`;
      if (FUNCTION_EXPLANATIONS_DB[colonKey]) {
        const entry = FUNCTION_EXPLANATIONS_DB[colonKey];
        return {
          name: colonKey,
          type: entry.type,
          typeLabel: getEntryTypeLabel(entry.type),
          signature: entry.signature,
          summary: entry.summary,
          parameters: entry.parameters,
          returns: entry.returns,
          example: entry.example,
        };
      }
      if (FUNCTION_EXPLANATIONS_DB[dotKey]) {
        const entry = FUNCTION_EXPLANATIONS_DB[dotKey];
        return {
          name: dotKey,
          type: entry.type,
          typeLabel: getEntryTypeLabel(entry.type),
          signature: entry.signature,
          summary: entry.summary,
          parameters: entry.parameters,
          returns: entry.returns,
          example: entry.example,
        };
      }
    }
  }

  // 1. Check exact match in knowledge database (e.g. "task.wait", "TweenService:Create")
  if (FUNCTION_EXPLANATIONS_DB[clean]) {
    const entry = FUNCTION_EXPLANATIONS_DB[clean];
    return {
      name: clean,
      type: entry.type,
      typeLabel: getEntryTypeLabel(entry.type),
      signature: entry.signature,
      summary: entry.summary,
      parameters: entry.parameters,
      returns: entry.returns,
      example: entry.example,
    };
  }

  // 2. Check suffix (e.g. if token is "wait", match "task.wait")
  const suffixMatches = Object.keys(FUNCTION_EXPLANATIONS_DB).filter(
    (k) => k.endsWith(`.${clean}`) || k.endsWith(`:${clean}`)
  );
  if (suffixMatches.length > 0) {
    const key = suffixMatches[0];
    const entry = FUNCTION_EXPLANATIONS_DB[key];
    return {
      name: key,
      type: entry.type,
      typeLabel: getEntryTypeLabel(entry.type),
      signature: entry.signature,
      summary: entry.summary,
      parameters: entry.parameters,
      returns: entry.returns,
      example: entry.example,
    };
  }

  // 3. Check user-defined functions in scriptContent
  if (scriptContent) {
    const lines = scriptContent.split('\n');
    const funcRegex = new RegExp(`(?:local\\s+)?function\\s+(?:[\\w_]+[:.])?(${clean})\\s*\\(([^)]*)\\)`, 'i');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(funcRegex);
      if (match) {
        // Collect any preceding comment lines as documentation
        let comments: string[] = [];
        let cur = i - 1;
        while (cur >= 0 && lines[cur].trim().startsWith('--')) {
          comments.unshift(lines[cur].trim().replace(/^--\s*/, ''));
          cur--;
        }

        const paramsStr = match[2].trim();
        const paramsList = paramsStr
          ? paramsStr.split(',').map((p) => ({
              name: p.trim(),
              description: `Parameter '${p.trim()}' passed to ${clean}.`,
            }))
          : [];

        return {
          name: clean,
          type: 'user-function',
          typeLabel: 'User-Defined Function',
          signature: `function ${clean}(${paramsStr})`,
          summary: comments.length > 0 
            ? comments.join(' ')
            : `Custom function declared in this script on Line ${i + 1}.`,
          parameters: paramsList,
          definedLine: i + 1,
          example: `${clean}(${paramsList.map((p) => p.name).join(', ')})`,
        };
      }
    }
  }

  // 4. Fallback: Generic identifier description
  return {
    name: clean,
    type: 'function',
    typeLabel: 'Luau Identifier',
    signature: `${clean}(...)`,
    summary: `Identifier '${clean}' in active Luau script.`,
  };
}

function getEntryTypeLabel(type: string): string {
  switch (type) {
    case 'function': return 'Built-in Function';
    case 'method': return 'Instance Method';
    case 'service': return 'Roblox Service';
    case 'datatype': return 'Datatype Constructor';
    case 'class': return 'Roblox Class';
    case 'keyword': return 'Luau Keyword';
    case 'user-function': return 'User Function';
    default: return 'Function';
  }
}

// Alias export for backwards compatibility
export const explainFunctionAtWord = explainFunctionOrToken;

