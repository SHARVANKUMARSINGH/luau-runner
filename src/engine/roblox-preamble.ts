import type { ScriptFile, ScriptType } from '../types';

/**
 * Generates the Luau simulator runtime code that gets injected before user scripts.
 * Runs directly in the Luau VM, providing native speed, accurate Luau behavior,
 * full metatable support, and real Luau table arrays.
 */
export function generateRobloxPreamble(
  currentScriptType: ScriptType,
  allScripts: ScriptFile[]
): string {
  const isClient = currentScriptType === 'LocalScript';
  const isServer = currentScriptType === 'ServerScript';

  // Build module scripts dictionary
  const moduleEntries: string[] = [];
  for (const s of allScripts) {
    if (s.type === 'ModuleScript') {
      moduleEntries.push(`
  __MODULE_SOURCES__["${s.name}"] = function()
${s.content}
  end
`);
    }
  }

  return `
-- [[ Roblox Simulator Luau Runtime ]] --
local __MODULE_SOURCES__ = {}
local __MODULE_CACHE__ = {}
${moduleEntries.join('\n')}

-- Signal Implementation
local Signal = {}
Signal.__index = Signal

function Signal.new(name)
    local self = setmetatable({}, Signal)
    self._name = name or "Signal"
    self._connections = {}
    return self
end

function Signal:Connect(fn)
    local conn = { Connected = true, _fn = fn }
    function conn:Disconnect()
        self.Connected = false
    end
    table.insert(self._connections, conn)
    return conn
end

function Signal:Once(fn)
    local conn
    conn = self:Connect(function(...)
        conn:Disconnect()
        fn(...)
    end)
    return conn
end

function Signal:Fire(...)
    local conns = self._connections
    for i = #conns, 1, -1 do
        local c = conns[i]
        if c.Connected then
            task.spawn(c._fn, ...)
        else
            table.remove(conns, i)
        end
    end
end

function Signal:Wait()
    local result = nil
    local waiting = true
    self:Once(function(...)
        result = { ... }
        waiting = false
    end)
    while waiting do
        task.wait(0.01)
    end
    return unpack(result)
end

-- Math & Roblox Types
Vector3 = {}
Vector3.__index = Vector3
function Vector3.new(x, y, z)
    return setmetatable({ X = x or 0, Y = y or 0, Z = z or 0 }, Vector3)
end
Vector3.zero = Vector3.new(0, 0, 0)
Vector3.one = Vector3.new(1, 1, 1)
function Vector3:__tostring()
    return string.format("%g, %g, %g", self.X, self.Y, self.Z)
end

CFrame = {}
CFrame.__index = CFrame
function CFrame.new(x, y, z)
    local pos = if typeof(x) == "table" and x.X then x else Vector3.new(x or 0, y or 0, z or 0)
    return setmetatable({ Position = pos, X = pos.X, Y = pos.Y, Z = pos.Z }, CFrame)
end

Color3 = {}
Color3.__index = Color3
function Color3.new(r, g, b)
    return setmetatable({ R = r or 0, G = g or 0, B = b or 0 }, Color3)
end
function Color3.fromRGB(r, g, b)
    return Color3.new((r or 0) / 255, (g or 0) / 255, (b or 0) / 255)
end

UDim2 = {}
UDim2.__index = UDim2
function UDim2.new(xs, xo, ys, yo)
    return setmetatable({
        X = { Scale = xs or 0, Offset = xo or 0 },
        Y = { Scale = ys or 0, Offset = yo or 0 }
    }, UDim2)
end

-- Instance Metatable & Class System
local CLASS_HIERARCHY = {
    Part = { "BasePart", "Instance" },
    MeshPart = { "BasePart", "Instance" },
    WedgePart = { "BasePart", "Instance" },
    SpawnLocation = { "BasePart", "Instance" },
    BasePart = { "Instance" },
    Model = { "Instance" },
    Folder = { "Instance" },
    ScreenGui = { "LayerCollector", "Instance" },
    Frame = { "GuiObject", "Instance" },
    TextLabel = { "GuiObject", "Instance" },
    TextButton = { "GuiObject", "Instance" },
    TextBox = { "GuiObject", "Instance" },
    ImageLabel = { "GuiObject", "Instance" },
    ImageButton = { "GuiObject", "Instance" },
    GuiObject = { "Instance" },
    LayerCollector = { "Instance" },
    RemoteEvent = { "Instance" },
    RemoteFunction = { "Instance" },
    BindableEvent = { "Instance" },
    BindableFunction = { "Instance" },
    Script = { "Instance" },
    LocalScript = { "Instance" },
    ModuleScript = { "Instance" },
    StringValue = { "ValueBase", "Instance" },
    IntValue = { "ValueBase", "Instance" },
    NumberValue = { "ValueBase", "Instance" },
    BoolValue = { "ValueBase", "Instance" },
    ValueBase = { "Instance" },
    Player = { "Instance" },
    Camera = { "Instance" },
    Terrain = { "BasePart", "Instance" },
    Workspace = { "Instance" },
    Players = { "Instance" },
    Lighting = { "Instance" },
    ReplicatedStorage = { "Instance" },
    ServerStorage = { "Instance" },
    ServerScriptService = { "Instance" },
    StarterGui = { "Instance" },
    StarterPlayer = { "Instance" },
    Sound = { "Instance" },
    Tool = { "Instance" },
}

local InstanceMethods = {}
local __instance_id = 0

local function createInstance(className, parent)
    __instance_id += 1
    local id = __instance_id

    local obj = {
        _id = id,
        _children = {},
        _props = {
            ClassName = className,
            Name = className,
            Parent = nil,
            Archivable = true,
        },
        _events = {
            Changed = Signal.new("Changed"),
            ChildAdded = Signal.new("ChildAdded"),
            ChildRemoved = Signal.new("ChildRemoved"),
            Destroying = Signal.new("Destroying"),
            OnServerEvent = Signal.new("OnServerEvent"),
            OnClientEvent = Signal.new("OnClientEvent"),
            Event = Signal.new("Event"),
        }
    }

    -- Set class default properties
    if className == "Part" or className == "MeshPart" or className == "WedgePart" or className == "SpawnLocation" then
        obj._props.Size = Vector3.new(4, 1, 2)
        obj._props.Position = Vector3.new(0, 0, 0)
        obj._props.Anchored = false
        obj._props.CanCollide = true
        obj._props.Transparency = 0
        obj._props.Color = Color3.fromRGB(163, 162, 165)
        obj._props.Material = "Plastic"
    elseif className == "Model" then
        obj._props.PrimaryPart = nil
    elseif className == "StringValue" then
        obj._props.Value = ""
    elseif className == "IntValue" or className == "NumberValue" then
        obj._props.Value = 0
    elseif className == "BoolValue" then
        obj._props.Value = false
    elseif className == "ScreenGui" then
        obj._props.Enabled = true
        obj._props.ResetOnSpawn = true
    elseif className == "TextLabel" or className == "TextButton" or className == "TextBox" then
        obj._props.Text = ""
        obj._props.TextSize = 14
        obj._props.TextColor3 = Color3.fromRGB(255, 255, 255)
        obj._props.Visible = true
        obj._props.Size = UDim2.new(0, 100, 0, 40)
        obj._props.Position = UDim2.new(0, 0, 0, 0)
    elseif className == "Player" then
        obj._props.UserId = 1001
        obj._props.DisplayName = "Robloxian"
    end

    local meta = {
        __index = function(self, key)
            local props = rawget(self, "_props")
            if props[key] ~= nil then return props[key] end
            local events = rawget(self, "_events")
            if events and events[key] then return events[key] end
            if InstanceMethods[key] then return InstanceMethods[key] end
            return nil
        end,
        __newindex = function(self, key, value)
            local props = rawget(self, "_props")
            if key == "Parent" then
                local oldParent = props.Parent
                if oldParent == value then return end
                if oldParent then
                    local oldKids = rawget(oldParent, "_children")
                    if oldKids then
                        for idx, kid in ipairs(oldKids) do
                            if kid == self then
                                table.remove(oldKids, idx)
                                break
                            end
                        end
                        oldParent.ChildRemoved:Fire(self)
                    end
                end
                props.Parent = value
                if value then
                    local newKids = rawget(value, "_children")
                    if newKids then
                        table.insert(newKids, self)
                        value.ChildAdded:Fire(self)
                    end
                end
                self.Changed:Fire("Parent")
                return
            end
            props[key] = value
            self.Changed:Fire(key)
        end,
        __tostring = function(self)
            return rawget(self, "_props").Name
        end
    }

    local inst = setmetatable(obj, meta)
    if parent then
        inst.Parent = parent
    end
    return inst
end

function InstanceMethods:GetChildren()
    local kids = rawget(self, "_children") or {}
    local copy = {}
    for i, v in ipairs(kids) do copy[i] = v end
    return copy
end

function InstanceMethods:GetDescendants()
    local result = {}
    local function collect(curr)
        for _, kid in ipairs(curr:GetChildren()) do
            table.insert(result, kid)
            collect(kid)
        end
    end
    collect(self)
    return result
end

function InstanceMethods:FindFirstChild(name, recursive)
    for _, child in ipairs(self:GetChildren()) do
        if child.Name == name then return child end
        if recursive then
            local found = child:FindFirstChild(name, true)
            if found then return found end
        end
    end
    return nil
end

function InstanceMethods:FindFirstChildOfClass(className)
    for _, child in ipairs(self:GetChildren()) do
        if child.ClassName == className then return child end
    end
    return nil
end

function InstanceMethods:FindFirstChildWhichIsA(className)
    for _, child in ipairs(self:GetChildren()) do
        if child:IsA(className) then return child end
    end
    return nil
end

function InstanceMethods:WaitForChild(name, timeout)
    local found = self:FindFirstChild(name)
    if found then return found end
    local start = os.clock()
    local maxWait = timeout or 5
    while not found and (os.clock() - start < maxWait) do
        task.wait(0.05)
        found = self:FindFirstChild(name)
    end
    return found
end

function InstanceMethods:IsA(className)
    if self.ClassName == className then return true end
    local h = CLASS_HIERARCHY[self.ClassName]
    if h then
        for _, parentClass in ipairs(h) do
            if parentClass == className then return true end
        end
    end
    return false
end

function InstanceMethods:GetFullName()
    local parts = { self.Name }
    local curr = self.Parent
    while curr do
        table.insert(parts, 1, curr.Name)
        curr = curr.Parent
    end
    return table.concat(parts, ".")
end

function InstanceMethods:Clone()
    local clone = createInstance(self.ClassName, nil)
    for k, v in pairs(rawget(self, "_props")) do
        if k ~= "Parent" then
            rawget(clone, "_props")[k] = v
        end
    end
    for _, child in ipairs(self:GetChildren()) do
        local childClone = child:Clone()
        childClone.Parent = clone
    end
    return clone
end

function InstanceMethods:Destroy()
    self.Destroying:Fire()
    for _, child in ipairs(self:GetChildren()) do
        child:Destroy()
    end
    self.Parent = nil
    rawset(self, "_children", {})
end

function InstanceMethods:ClearAllChildren()
    for _, child in ipairs(self:GetChildren()) do
        child:Destroy()
    end
end

-- RemoteEvent & RemoteFunction Methods
function InstanceMethods:FireServer(...)
    self.OnServerEvent:Fire(game.Players.LocalPlayer, ...)
end

function InstanceMethods:FireClient(player, ...)
    self.OnClientEvent:Fire(...)
end

function InstanceMethods:FireAllClients(...)
    self.OnClientEvent:Fire(...)
end

function InstanceMethods:InvokeServer(...)
    if self.OnServerInvoke then
        return self.OnServerInvoke(...)
    end
    return nil
end

function InstanceMethods:InvokeClient(player, ...)
    if self.OnClientInvoke then
        return self.OnClientInvoke(...)
    end
    return nil
end

-- Instance.new factory
Instance = {
    new = function(className, parent)
        return createInstance(className, parent)
    end
}

-- Initialize DataModel and Core Services
local game = createInstance("DataModel", nil)
game.Name = "game"

local workspace = createInstance("Workspace", game)
workspace.Name = "Workspace"

local Players = createInstance("Players", game)
Players.Name = "Players"

local ReplicatedStorage = createInstance("ReplicatedStorage", game)
ReplicatedStorage.Name = "ReplicatedStorage"

local ServerStorage = createInstance("ServerStorage", game)
ServerStorage.Name = "ServerStorage"

local ServerScriptService = createInstance("ServerScriptService", game)
ServerScriptService.Name = "ServerScriptService"

local StarterGui = createInstance("StarterGui", game)
StarterGui.Name = "StarterGui"

local StarterPlayer = createInstance("StarterPlayer", game)
StarterPlayer.Name = "StarterPlayer"

local Lighting = createInstance("Lighting", game)
Lighting.Name = "Lighting"

local RunService = createInstance("RunService", game)
RunService.Name = "RunService"
RunService.Heartbeat = Signal.new("Heartbeat")
RunService.Stepped = Signal.new("Stepped")
RunService.RenderStepped = Signal.new("RenderStepped")
function RunService:IsServer() return ${isServer ? 'true' : 'false'} end
function RunService:IsClient() return ${isClient ? 'true' : 'false'} end
function RunService:IsStudio() return true end

-- Add Terrain and Camera to Workspace
local Terrain = createInstance("Terrain", workspace)
Terrain.Name = "Terrain"

local Camera = createInstance("Camera", workspace)
Camera.Name = "Camera"

-- Simulated Player Setup
local localPlayer = createInstance("Player", Players)
localPlayer.Name = "SimPlayer"
localPlayer.UserId = 12345678
localPlayer.DisplayName = "SimulatedPlayer"
Players.LocalPlayer = localPlayer

local backpack = createInstance("Folder", localPlayer)
backpack.Name = "Backpack"

local playerGui = createInstance("Folder", localPlayer)
playerGui.Name = "PlayerGui"

-- Context Boundary Enforcement
local _services = {
    Workspace = workspace,
    workspace = workspace,
    Players = Players,
    ReplicatedStorage = ReplicatedStorage,
    ServerStorage = ServerStorage,
    ServerScriptService = ServerScriptService,
    StarterGui = StarterGui,
    StarterPlayer = StarterPlayer,
    Lighting = Lighting,
    RunService = RunService,
}

function game:GetService(name)
    ${
      isClient
        ? `
    if name == "ServerStorage" or name == "ServerScriptService" then
        warn("[Security Violation] LocalScript cannot access " .. name .. " on the client!")
        return nil
    end
    `
        : ''
    }
    return _services[name] or error("Service '" .. tostring(name) .. "' is not a valid Service name")
end

-- Task Library Implementation
task = {
    wait = function(sec)
        local dur = sec or (1 / 30)
        return __task_wait_async(dur)
    end,
    spawn = function(fn, ...)
        local args = { ... }
        return __task_spawn_async(function()
            fn(unpack(args))
        end)
    end,
    delay = function(sec, fn)
        task.spawn(function()
            task.wait(sec)
            fn()
        end)
    end,
    defer = function(fn, ...)
        local args = { ... }
        task.spawn(function()
            fn(unpack(args))
        end)
    end,
    cancel = function(t) end,
}

-- Wait alias
wait = task.wait
spawn = task.spawn
delay = task.delay

-- ModuleScript Require Implementation
local _orig_require = require
function require(target)
    local name = nil
    if typeof(target) == "string" then
        name = target
    elseif typeof(target) == "table" and target.Name then
        name = target.Name
    elseif typeof(target) == "table" and target.ClassName == "ModuleScript" then
        name = target.Name
    end

    if not name then
        error("require() expects a ModuleScript or module name")
    end

    if __MODULE_CACHE__[name] ~= nil then
        return __MODULE_CACHE__[name]
    end

    if __MODULE_SOURCES__[name] then
        local result = __MODULE_SOURCES__[name]()
        if result == nil then
            error("ModuleScript '" .. name .. "' did not return a value")
        end
        __MODULE_CACHE__[name] = result
        return result
    end

    error("ModuleScript '" .. tostring(name) .. "' was not found in project")
end

-- Custom typeof implementation
local _lua_type = type
function typeof(v)
    if v == nil then return "nil" end
    if _lua_type(v) == "table" and rawget(v, "_props") and rawget(v, "_props").ClassName then
        return "Instance"
    end
    if _lua_type(v) == "table" and rawget(v, "_name") == "Signal" then
        return "RBXScriptSignal"
    end
    if _lua_type(v) == "table" and v.X and v.Y and v.Z then
        return "Vector3"
    end
    if _lua_type(v) == "table" and v.R and v.G and v.B then
        return "Color3"
    end
    if _lua_type(v) == "table" and v.X and v.Y and (not v.Z) then
        return "UDim2"
    end
    return _lua_type(v)
end

-- Hierarchy Serializer for Explorer Sync
function __serialize_node(inst)
    local kids = {}
    for i, child in ipairs(inst:GetChildren()) do
        table.insert(kids, __serialize_node(child))
    end
    local p = rawget(inst, "_props")
    local propsCopy = {}
    for k, v in pairs(p) do
        if k ~= "Parent" then
            if typeof(v) == "Vector3" then
                propsCopy[k] = string.format("Vector3(%g, %g, %g)", v.X, v.Y, v.Z)
            elseif typeof(v) == "Color3" then
                propsCopy[k] = string.format("Color3(%g, %g, %g)", v.R, v.G, v.B)
            elseif typeof(v) == "number" or typeof(v) == "string" or typeof(v) == "boolean" then
                propsCopy[k] = v
            end
        end
    end
    return {
        name = p.Name,
        className = p.ClassName,
        children = kids,
        properties = propsCopy,
        path = inst:GetFullName()
    }
end

function __sync_explorer_tree()
    local tree = __serialize_node(game)
    __bridge_on_tree_sync(tree)
end

-- [[ End Preamble ]] --
`;
}
