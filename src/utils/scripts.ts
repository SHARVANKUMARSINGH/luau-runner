import type { ScriptFile, ScriptType, ScriptTemplate } from '../types';

let idCounter = 0;
export function generateId(): string {
  return `script_${Date.now()}_${++idCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

export const DEFAULT_SCRIPT_CONTENT: Record<ScriptType, string> = {
  Script: `-- Standard Script: Runs in a general Luau context
-- Demonstrates Luau language features and the simulated Roblox environment

print("🚀 Running Standard Script in Luau VM")

-- 1. Luau Type Annotations & Variables
type PlayerData = {
    name: string,
    level: number,
    coins: number,
}

local player: PlayerData = {
    name = "Robloxian",
    level = 25,
    coins = 1500,
}

-- 2. Luau String Interpolation
print(\`Player {player.name} has reached level {player.level} with {player.coins} coins!\`)

-- 3. Luau Compound Operators & Math
local totalXp = 0
for i = 1, 5 do
    totalXp += i * 100
end
print("Calculated Total XP:", totalXp)

-- 4. Luau If-Expressions
local rank = if player.level >= 20 then "Veteran" else "Novice"
print(\`Player Rank: {rank}\`)

-- 5. Creating an Instance in Workspace
local testFolder = Instance.new("Folder")
testFolder.Name = "GameData"
testFolder.Parent = workspace
print(\`Created folder '{testFolder.Name}' in {testFolder.Parent.Name}\`)

print("✅ Standard Script execution completed!")
`,

  ServerScript: `-- Server Script: Runs in the simulated Server context
-- Has full access to ServerStorage, ServerScriptService, ReplicatedStorage, and Workspace

print("🖥️ Starting Server Script...")

local ServerStorage = game:GetService("ServerStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

print("Connected to Server Services:")
print(" - ServerStorage:", ServerStorage.Name)
print(" - ServerScriptService:", ServerScriptService.Name)
print(" - ReplicatedStorage:", ReplicatedStorage.Name)

-- Create a shared RemoteEvent in ReplicatedStorage
local remoteEvent = Instance.new("RemoteEvent")
remoteEvent.Name = "PlayerLevelUp"
remoteEvent.Parent = ReplicatedStorage
print("📡 Created RemoteEvent in ReplicatedStorage:", remoteEvent.Name)

-- Listen for server events
remoteEvent.OnServerEvent:Connect(function(player, newLevel)
    print(\`[Server Event Received] Player leveled up to: {newLevel}\`)
end)

-- Create a dynamic game arena inside Workspace
local arena = Instance.new("Model")
arena.Name = "Arena1"
arena.Parent = workspace

local baseplate = Instance.new("Part")
baseplate.Name = "Baseplate"
baseplate.Size = Vector3.new(64, 2, 64)
baseplate.Position = Vector3.new(0, 0, 0)
baseplate.Anchored = true
baseplate.Parent = arena

local spawn = Instance.new("SpawnLocation")
spawn.Name = "SpawnPoint"
spawn.Position = Vector3.new(0, 5, 0)
spawn.Parent = arena

print(\`🏗️ Constructed Arena '{arena.Name}' with {arena:GetChildren().length or #arena:GetChildren()} objects\`)

-- Simulate a client firing the event
remoteEvent:FireServer(nil, 30)

print("✅ Server Script setup completed!")
`,

  LocalScript: `-- Local Script: Runs in the simulated Client context
-- Has access to Players.LocalPlayer, StarterGui, and ReplicatedStorage

print("📱 Starting Local Script on simulated Client...")

local Players = game:GetService("Players")
local localPlayer = Players.LocalPlayer

if localPlayer then
    print(\`Connected as LocalPlayer: {localPlayer.Name} (UserID: {localPlayer.UserId})\`)
else
    print("Simulated LocalPlayer active")
end

local StarterGui = game:GetService("StarterGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Create client UI components
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "HUD_Gui"
screenGui.Parent = StarterGui

local coinLabel = Instance.new("TextLabel")
coinLabel.Name = "CoinCounter"
coinLabel.Text = "Coins: 250"
coinLabel.Parent = screenGui

print(\`🎨 Client UI constructed: {screenGui.Name} -> {coinLabel.Name}\`)

-- Use asynchronous task scheduler
task.spawn(function()
    print("⏳ Asynchronous task running on client...")
    task.wait(0.1)
    coinLabel.Text = "Coins: 300 (Updated!)"
    print(\`Client UI updated: {coinLabel.Text}\`)
end)

print("✅ Local Script initialized successfully!")
`,

  ModuleScript: `-- Module Script: Returns a reusable table or utility library
-- Can be required by other scripts using require(script) or require("ModuleScript")

local MathUtils = {}

-- Basic arithmetic with type annotations
function MathUtils.add(a: number, b: number): number
    return a + b
end

function MathUtils.multiply(a: number, b: number): number
    return a * b
end

-- Factorial calculation
function MathUtils.factorial(n: number): number
    if n <= 1 then return 1 end
    return n * MathUtils.factorial(n - 1)
end

-- Fibonacci sequence
function MathUtils.fibonacci(n: number): number
    if n <= 0 then return 0 end
    if n == 1 then return 1 end
    local a, b = 0, 1
    for _ = 2, n do
        a, b = b, a + b
    end
    return b
end

-- Clamping utility
function MathUtils.clamp(val: number, min: number, max: number): number
    if val < min then return min end
    if val > max then return max end
    return val
end

-- Distance between two simulated 3D coordinates
function MathUtils.distance(p1, p2): number
    local dx = p1.X - p2.X
    local dy = p1.Y - p2.Y
    local dz = p1.Z - p2.Z
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

print("📦 ModuleScript 'MathUtils' loaded successfully!")

return MathUtils
`,
};

export const EXAMPLE_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'tpl_module_require',
    name: 'ModuleScript Require Demo',
    type: 'Script',
    description: 'Demonstrates requiring the ModuleScript and calling its mathematical functions',
    content: `-- Demonstrates require() loading the ModuleScript

print("🔍 Requiring ModuleScript...")

-- Require the ModuleScript by name or reference
local MathUtils = require("ModuleScript")

print("Testing MathUtils.add(15, 25):", MathUtils.add(15, 25))
print("Testing MathUtils.factorial(6):", MathUtils.factorial(6))
print("Testing MathUtils.fibonacci(10):", MathUtils.fibonacci(10))
print("Testing MathUtils.clamp(150, 0, 100):", MathUtils.clamp(150, 0, 100))

local p1 = { X = 0, Y = 0, Z = 0 }
local p2 = { X = 3, Y = 4, Z = 0 }
print("Distance between (0,0,0) and (3,4,0):", MathUtils.distance(p1, p2))

print("✨ All module tests passed!")
`,
  },
  {
    id: 'tpl_remote_events',
    name: 'Client-Server RemoteEvent',
    type: 'ServerScript',
    description: 'Demonstrates RemoteEvent communication between client and server',
    content: `-- RemoteEvent Client-Server Communication Demo

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- 1. Create a RemoteEvent
local chatEvent = Instance.new("RemoteEvent")
chatEvent.Name = "ChatBroadcast"
chatEvent.Parent = ReplicatedStorage
print("Created RemoteEvent:", chatEvent.Name)

-- 2. Connect a Server listener
local connection = chatEvent.OnServerEvent:Connect(function(player, message)
    local sender = if player then player.Name else "SimulatedClient"
    print(\`[SERVER RECEIVED] From {sender}: "{message}"\`)
end)

-- 3. Connect a Client listener
chatEvent.OnClientEvent:Connect(function(message)
    print(\`[CLIENT RECEIVED] Broadcast: "{message}"\`)
end)

-- 4. Fire from client to server
print("Simulating client firing to server...")
chatEvent:FireServer(nil, "Hello from client!")

-- 5. Fire from server to client
print("Simulating server firing to all clients...")
chatEvent:FireAllClients("Welcome to the server!")

print("RemoteEvent communication test completed!")
`,
  },
  {
    id: 'tpl_task_scheduler',
    name: 'Task Library & Coroutines',
    type: 'Script',
    description: 'Demonstrates task.wait, task.spawn, task.delay, and coroutines',
    content: `-- Demonstrates the task library and coroutines in Luau

print("⏱️ Starting task scheduling demonstration...")

-- 1. task.spawn: runs function immediately
task.spawn(function()
    print("▶ task.spawn: Executing concurrent task A")
end)

-- 2. task.wait: yields thread
print("Before task.wait(0.1)...")
local elapsed = task.wait(0.1)
print(\`Resumed after task.wait, elapsed: {elapsed}s\`)

-- 3. coroutines
local co = coroutine.create(function(msg)
    print("Inside coroutine:", msg)
    coroutine.yield("yielded_value")
    print("Resumed coroutine!")
    return "done"
end)

local success, yieldVal = coroutine.resume(co, "Hello coroutine!")
print("Coroutine yield received:", yieldVal)

local success2, retVal = coroutine.resume(co)
print("Coroutine return received:", retVal)

print("✅ Task scheduling demo complete!")
`,
  },
  {
    id: 'tpl_instance_tree',
    name: 'Hierarchy & Instance Tree',
    type: 'Script',
    description: 'Generates a full Roblox hierarchy with Parts, Models, and Value objects',
    content: `-- Generates a rich Instance hierarchy in Workspace
-- Check the Explorer (click the Globe icon in toolbar) to inspect the tree!

print("🌳 Building simulated game world...")

-- Clean up any previous demo tree
local existing = workspace:FindFirstChild("DemoCity")
if existing then
    existing:Destroy()
    print("Cleaned up existing DemoCity")
end

-- Create City Model
local city = Instance.new("Model")
city.Name = "DemoCity"
city.Parent = workspace

-- Create Buildings Folder
local buildings = Instance.new("Folder")
buildings.Name = "Buildings"
buildings.Parent = city

-- Add Tower
local tower = Instance.new("Model")
tower.Name = "ClockTower"
tower.Parent = buildings

local towerBase = Instance.new("Part")
towerBase.Name = "TowerBase"
towerBase.Size = Vector3.new(10, 30, 10)
towerBase.Position = Vector3.new(0, 15, 0)
towerBase.Anchored = true
towerBase.Parent = tower

local towerSpire = Instance.new("Part")
towerSpire.Name = "Spire"
towerSpire.Size = Vector3.new(2, 10, 2)
towerSpire.Position = Vector3.new(0, 35, 0)
towerSpire.Parent = tower

-- Add Configuration Values
local config = Instance.new("Folder")
config.Name = "Config"
config.Parent = city

local cityName = Instance.new("StringValue")
cityName.Name = "CityName"
cityName.Value = "Luau Metropolis"
cityName.Parent = config

local population = Instance.new("IntValue")
population.Name = "Population"
population.Value = 42000
population.Parent = config

print(\`Successfully constructed '{city.Name}'!\`)
print("Children in Workspace:")
for _, child in ipairs(workspace:GetChildren()) do
    print(" - " .. child.Name .. " (" .. child.ClassName .. ")")
end

print("💡 Tip: Click the Globe icon in the toolbar to inspect this hierarchy in the Explorer!")
`,
  },
];

export function createDefaultScripts(): ScriptFile[] {
  const now = Date.now();
  return [
    {
      id: 'default_script',
      name: 'Script',
      type: 'Script',
      content: DEFAULT_SCRIPT_CONTENT.Script,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'default_server_script',
      name: 'Server Script',
      type: 'ServerScript',
      content: DEFAULT_SCRIPT_CONTENT.ServerScript,
      isDefault: true,
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: 'default_local_script',
      name: 'Local Script',
      type: 'LocalScript',
      content: DEFAULT_SCRIPT_CONTENT.LocalScript,
      isDefault: true,
      createdAt: now + 2,
      updatedAt: now + 2,
    },
    {
      id: 'default_module_script',
      name: 'Module Script',
      type: 'ModuleScript',
      content: DEFAULT_SCRIPT_CONTENT.ModuleScript,
      isDefault: true,
      createdAt: now + 3,
      updatedAt: now + 3,
    },
  ];
}

export function createNewScript(name: string, type: ScriptType, initialContent?: string): ScriptFile {
  const now = Date.now();
  return {
    id: generateId(),
    name: name.trim() || `${type}_${Math.floor(Math.random() * 1000)}`,
    type,
    content: initialContent ?? DEFAULT_SCRIPT_CONTENT[type],
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}
