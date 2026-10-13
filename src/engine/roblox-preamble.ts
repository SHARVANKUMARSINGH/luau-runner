import type { ScriptFile, ScriptType } from '../types';

/**
 * Generates the authentic Roblox simulator runtime injected before user scripts.
 * Runs directly in the Luau WebAssembly VM, providing native speed,
 * real metatables, working Roblox services (TweenService, HttpService, DataStoreService,
 * Debris, CollectionService, UserInputService, etc.), full Enum system, and datatypes.
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
-- Common boolean typos and mobile autocorrect fallbacks
ture = true
flase = false

local __MODULE_SOURCES__ = {}
local __MODULE_CACHE__ = {}
${moduleEntries.join('\n')}

-- =========================================================================
-- 1. RBXScriptSignal & RBXScriptConnection Implementation
-- =========================================================================
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

-- =========================================================================
-- 2. Comprehensive Roblox Enum System
-- =========================================================================
local function createEnumGroup(groupName, items)
    local enumGroup = { _name = groupName }
    local itemMap = {}
    for idx, name in ipairs(items) do
        local item = {
            Name = name,
            Value = idx - 1,
            _group = groupName
        }
        setmetatable(item, {
            __tostring = function() return "Enum." .. groupName .. "." .. name end,
            __eq = function(a, b)
                if type(b) == "string" then return a.Name == b end
                if type(a) == "string" then return a == b.Name end
                if type(b) == "table" and b.Name then return a.Name == b.Name end
                return rawequal(a, b)
            end
        })
        enumGroup[name] = item
        itemMap[name] = item
        itemMap[idx - 1] = item
    end
    function enumGroup:GetEnumItems()
        local list = {}
        for _, name in ipairs(items) do
            table.insert(list, enumGroup[name])
        end
        return list
    end
    setmetatable(enumGroup, {
        __index = itemMap,
        __tostring = function() return "Enum." .. groupName end
    })
    return enumGroup
end

Enum = {
    EasingStyle = createEnumGroup("EasingStyle", {
        "Linear", "Sine", "Back", "Quad", "Cubic", "Quart", "Quint", "Bounce", "Elastic", "Exponential", "Circular"
    }),
    EasingDirection = createEnumGroup("EasingDirection", {
        "In", "Out", "InOut"
    }),
    PlaybackState = createEnumGroup("PlaybackState", {
        "Begin", "Delayed", "Playing", "Paused", "Completed", "Cancelled"
    }),
    Material = createEnumGroup("Material", {
        "Plastic", "Wood", "Slate", "Concrete", "CorrodedMetal", "DiamondPlate", "Foil", "Grass", "Ice",
        "Marble", "Granite", "Brick", "Pebble", "Sand", "Fabric", "SmoothPlastic", "Metal", "WoodPlanks",
        "Neon", "Glass", "ForceField"
    }),
    Font = createEnumGroup("Font", {
        "Legacy", "Arial", "ArialBold", "SourceSans", "SourceSansBold", "SourceSansLight", "SourceSansItalic",
        "Cartoon", "Code", "Highway", "SciFi", "Arcade", "Fantasy", "Antique", "Gotham", "GothamBold",
        "GothamMedium", "GothamBlack"
    }),
    KeyCode = createEnumGroup("KeyCode", {
        "Unknown", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R",
        "S", "T", "U", "V", "W", "X", "Y", "Z", "Zero", "One", "Two", "Three", "Four", "Five", "Six",
        "Seven", "Eight", "Nine", "Space", "Return", "Backspace", "Tab", "Escape", "LeftShift", "RightShift",
        "LeftControl", "RightControl", "LeftAlt", "RightAlt", "Up", "Down", "Left", "Right", "ButtonA",
        "ButtonB", "ButtonX", "ButtonY", "DPadUp", "DPadDown", "DPadLeft", "DPadRight"
    }),
    UserInputType = createEnumGroup("UserInputType", {
        "None", "MouseButton1", "MouseButton2", "MouseButton3", "MouseWheel", "MouseMovement", "Touch",
        "Keyboard", "Gamepad1", "Gamepad2"
    }),
    UserInputState = createEnumGroup("UserInputState", {
        "None", "Begin", "Change", "End", "Cancel"
    }),
    RaycastFilterType = createEnumGroup("RaycastFilterType", {
        "Exclude", "Include", "Blacklist", "Whitelist"
    }),
    HumanoidRigType = createEnumGroup("HumanoidRigType", {
        "R6", "R15"
    }),
    HumanoidStateType = createEnumGroup("HumanoidStateType", {
        "FallingDown", "Ragdoll", "Physics", "GettingUp", "Jumping", "Swimming", "Freefall", "Flying",
        "Landed", "Running", "Climbing", "Seated", "PlatformStanding", "Dead", "None"
    }),
    PathStatus = createEnumGroup("PathStatus", {
        "Success", "ClosestNoPath", "ClosestOutOfRange", "FailStartNotEmpty", "FailFinishNotEmpty", "NoPath"
    }),
    CameraType = createEnumGroup("CameraType", {
        "Fixed", "Attach", "Watch", "Track", "Follow", "Custom", "Scriptable", "Orbital"
    }),
    PartType = createEnumGroup("PartType", {
        "Block", "Ball", "Cylinder", "Wedge", "CornerWedge"
    }),
    SortOrder = createEnumGroup("SortOrder", {
        "Name", "Custom", "LayoutOrder"
    }),
    ScaleType = createEnumGroup("ScaleType", {
        "Stretch", "Slice", "Tile", "Fit", "Crop"
    }),
    TextXAlignment = createEnumGroup("TextXAlignment", {
        "Left", "Center", "Right"
    }),
    TextYAlignment = createEnumGroup("TextYAlignment", {
        "Top", "Center", "Bottom"
    }),
    ProductPurchaseDecision = createEnumGroup("ProductPurchaseDecision", {
        "NotProcessedYet", "PurchaseGranted"
    }),
}

-- =========================================================================
-- 3. Complete Roblox Datatypes (Vector3, Vector2, CFrame, Color3, UDim2, etc.)
-- =========================================================================
Vector3 = {}
local Vector3Methods = {}

function Vector3.new(x, y, z)
    return setmetatable({ X = x or 0, Y = y or 0, Z = z or 0 }, Vector3)
end
Vector3.zero = Vector3.new(0, 0, 0)
Vector3.one = Vector3.new(1, 1, 1)
Vector3.xAxis = Vector3.new(1, 0, 0)
Vector3.yAxis = Vector3.new(0, 1, 0)
Vector3.zAxis = Vector3.new(0, 0, 1)

function Vector3Methods:Dot(other)
    return self.X * other.X + self.Y * other.Y + self.Z * other.Z
end
function Vector3Methods:Cross(other)
    return Vector3.new(
        self.Y * other.Z - self.Z * other.Y,
        self.Z * other.X - self.X * other.Z,
        self.X * other.Y - self.Y * other.X
    )
end
function Vector3Methods:Lerp(goal, alpha)
    return self + (goal - self) * alpha
end
function Vector3Methods:FuzzyEq(other, epsilon)
    local eps = epsilon or 0.00001
    return math.abs(self.X - other.X) <= eps and math.abs(self.Y - other.Y) <= eps and math.abs(self.Z - other.Z) <= eps
end

Vector3.__index = function(self, key)
    if key == "Magnitude" then
        return math.sqrt(self.X * self.X + self.Y * self.Y + self.Z * self.Z)
    elseif key == "Unit" then
        local mag = math.sqrt(self.X * self.X + self.Y * self.Y + self.Z * self.Z)
        if mag == 0 then return Vector3.zero end
        return Vector3.new(self.X / mag, self.Y / mag, self.Z / mag)
    end
    return Vector3Methods[key]
end
function Vector3.__add(a, b)
    return Vector3.new(a.X + b.X, a.Y + b.Y, a.Z + b.Z)
end
function Vector3.__sub(a, b)
    return Vector3.new(a.X - b.X, a.Y - b.Y, a.Z - b.Z)
end
function Vector3.__mul(a, b)
    if type(a) == "number" then return Vector3.new(a * b.X, a * b.Y, a * b.Z) end
    if type(b) == "number" then return Vector3.new(a.X * b, a.Y * b, a.Z * b) end
    return Vector3.new(a.X * b.X, a.Y * b.Y, a.Z * b.Z)
end
function Vector3.__div(a, b)
    if type(b) == "number" then return Vector3.new(a.X / b, a.Y / b, a.Z / b) end
    return Vector3.new(a.X / b.X, a.Y / b.Y, a.Z / b.Z)
end
function Vector3.__unm(a)
    return Vector3.new(-a.X, -a.Y, -a.Z)
end
function Vector3.__eq(a, b)
    return a.X == b.X and a.Y == b.Y and a.Z == b.Z
end
function Vector3:__tostring()
    return string.format("%g, %g, %g", self.X, self.Y, self.Z)
end

-- Vector2
Vector2 = {}
local Vector2Methods = {
    Dot = function(self, other) return self.X * other.X + self.Y * other.Y end,
    Cross = function(self, other) return self.X * other.Y - self.Y * other.X end,
    Lerp = function(self, goal, alpha) return self + (goal - self) * alpha end,
}
function Vector2.new(x, y)
    return setmetatable({ X = x or 0, Y = y or 0 }, Vector2)
end
Vector2.zero = Vector2.new(0, 0)
Vector2.one = Vector2.new(1, 1)
Vector2.xAxis = Vector2.new(1, 0)
Vector2.yAxis = Vector2.new(0, 1)

Vector2.__index = function(self, key)
    if key == "Magnitude" then
        return math.sqrt(self.X * self.X + self.Y * self.Y)
    elseif key == "Unit" then
        local mag = math.sqrt(self.X * self.X + self.Y * self.Y)
        if mag == 0 then return Vector2.zero end
        return Vector2.new(self.X / mag, self.Y / mag)
    end
    return Vector2Methods[key]
end
function Vector2.__add(a, b) return Vector2.new(a.X + b.X, a.Y + b.Y) end
function Vector2.__sub(a, b) return Vector2.new(a.X - b.X, a.Y - b.Y) end
function Vector2.__mul(a, b)
    if type(a) == "number" then return Vector2.new(a * b.X, a * b.Y) end
    if type(b) == "number" then return Vector2.new(a.X * b, a.Y * b) end
    return Vector2.new(a.X * b.X, a.Y * b.Y)
end
function Vector2.__div(a, b)
    if type(b) == "number" then return Vector2.new(a.X / b, a.Y / b) end
    return Vector2.new(a.X / b.X, a.Y / b.Y)
end
function Vector2.__unm(a) return Vector2.new(-a.X, -a.Y) end
function Vector2.__eq(a, b) return a.X == b.X and a.Y == b.Y end
function Vector2:__tostring() return string.format("%g, %g", self.X, self.Y) end

-- CFrame
CFrame = {}
local CFrameMethods = {}

function CFrame.new(x, y, z)
    if typeof(x) == "Vector3" and typeof(y) == "Vector3" then
        -- CFrame.new(pos, lookAt)
        local pos = x
        local lookAt = y
        local forward = (pos - lookAt).Unit
        if forward.Magnitude == 0 then forward = Vector3.new(0, 0, -1) end
        local up = Vector3.new(0, 1, 0)
        local right = up:Cross(forward).Unit
        up = forward:Cross(right)
        return setmetatable({
            Position = pos, X = pos.X, Y = pos.Y, Z = pos.Z,
            LookVector = -forward, RightVector = right, UpVector = up,
            _m = { right.X, up.X, forward.X, right.Y, up.Y, forward.Y, right.Z, up.Z, forward.Z }
        }, CFrame)
    end
    local pos = if typeof(x) == "table" and x.X then x else Vector3.new(x or 0, y or 0, z or 0)
    return setmetatable({
        Position = pos, X = pos.X, Y = pos.Y, Z = pos.Z,
        LookVector = Vector3.new(0, 0, -1), RightVector = Vector3.new(1, 0, 0), UpVector = Vector3.new(0, 1, 0),
        _m = { 1, 0, 0, 0, 1, 0, 0, 0, 1 }
    }, CFrame)
end

function CFrame.Angles(rx, ry, rz)
    local cx, sx = math.cos(rx or 0), math.sin(rx or 0)
    local cy, sy = math.cos(ry or 0), math.sin(ry or 0)
    local cz, sz = math.cos(rz or 0), math.sin(rz or 0)
    local m0 = cy * cz
    local m1 = -cy * sz
    local m2 = sy
    local m3 = cx * sz + sx * sy * cz
    local m4 = cx * cz - sx * sy * sz
    local m5 = -sx * cy
    local m6 = sx * sz - cx * sy * cz
    local m7 = sx * cz + cx * sy * sz
    local m8 = cx * cy
    return setmetatable({
        Position = Vector3.zero, X = 0, Y = 0, Z = 0,
        LookVector = Vector3.new(-m2, -m5, -m8),
        RightVector = Vector3.new(m0, m3, m6),
        UpVector = Vector3.new(m1, m4, m7),
        _m = { m0, m1, m2, m3, m4, m5, m6, m7, m8 }
    }, CFrame)
end
CFrame.identity = CFrame.new(0, 0, 0)
function CFrame.lookAt(at, look) return CFrame.new(at, look) end

function CFrameMethods:Inverse()
    local m = self._m or { 1, 0, 0, 0, 1, 0, 0, 0, 1 }
    -- Transpose 3x3 rotation
    local tm = { m[1], m[4], m[7], m[2], m[5], m[8], m[3], m[6], m[9] }
    local invPos = Vector3.new(
        -(tm[1] * self.X + tm[2] * self.Y + tm[3] * self.Z),
        -(tm[4] * self.X + tm[5] * self.Y + tm[6] * self.Z),
        -(tm[7] * self.X + tm[8] * self.Y + tm[9] * self.Z)
    )
    return setmetatable({
        Position = invPos, X = invPos.X, Y = invPos.Y, Z = invPos.Z,
        RightVector = Vector3.new(tm[1], tm[4], tm[7]),
        UpVector = Vector3.new(tm[2], tm[5], tm[8]),
        LookVector = Vector3.new(-tm[3], -tm[6], -tm[9]),
        _m = tm
    }, CFrame)
end

function CFrameMethods:Lerp(goal, alpha)
    local p = self.Position:Lerp(goal.Position, alpha)
    return CFrame.new(p.X, p.Y, p.Z)
end

function CFrameMethods:ToWorldSpace(cf) return self * cf end
function CFrameMethods:ToObjectSpace(cf) return self:Inverse() * cf end
function CFrameMethods:PointToWorldSpace(p) return (self * CFrame.new(p)).Position end
function CFrameMethods:PointToObjectSpace(p) return (self:Inverse() * CFrame.new(p)).Position end
function CFrameMethods:GetComponents()
    local m = self._m or { 1, 0, 0, 0, 1, 0, 0, 0, 1 }
    return self.X, self.Y, self.Z, m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9]
end

CFrame.__index = function(self, key)
    if key == "p" then return self.Position end
    return CFrameMethods[key]
end
function CFrame.__mul(a, b)
    if typeof(b) == "Vector3" then
        local m = a._m or { 1, 0, 0, 0, 1, 0, 0, 0, 1 }
        return Vector3.new(
            a.X + m[1] * b.X + m[2] * b.Y + m[3] * b.Z,
            a.Y + m[4] * b.X + m[5] * b.Y + m[6] * b.Z,
            a.Z + m[7] * b.X + m[8] * b.Y + m[9] * b.Z
        )
    elseif typeof(b) == "CFrame" then
        local pos = a * b.Position
        return CFrame.new(pos.X, pos.Y, pos.Z)
    end
    return a
end
function CFrame.__add(a, b)
    if typeof(b) == "Vector3" then return CFrame.new(a.Position + b) end
    return a
end
function CFrame.__sub(a, b)
    if typeof(b) == "Vector3" then return CFrame.new(a.Position - b) end
    return a
end
function CFrame:__tostring()
    return string.format("%g, %g, %g, 1, 0, 0, 0, 1, 0, 0, 0, 1", self.X, self.Y, self.Z)
end

-- Color3
Color3 = {}
Color3.__index = Color3
function Color3.new(r, g, b)
    return setmetatable({ R = r or 0, G = g or 0, B = b or 0 }, Color3)
end
function Color3.fromRGB(r, g, b)
    return Color3.new((r or 0) / 255, (g or 0) / 255, (b or 0) / 255)
end
function Color3.fromHSV(h, s, v)
    local r, g, b
    local i = math.floor(h * 6)
    local f = h * 6 - i
    local p = v * (1 - s)
    local q = v * (1 - f * s)
    local t = v * (1 - (1 - f) * s)
    local mod = i % 6
    if mod == 0 then r, g, b = v, t, p
    elseif mod == 1 then r, g, b = q, v, p
    elseif mod == 2 then r, g, b = p, v, t
    elseif mod == 3 then r, g, b = p, q, v
    elseif mod == 4 then r, g, b = t, p, v
    else r, g, b = v, p, q end
    return Color3.new(r, g, b)
end
function Color3.fromHex(hex)
    hex = hex:gsub("#", "")
    local r = tonumber(hex:sub(1, 2), 16) or 255
    local g = tonumber(hex:sub(3, 4), 16) or 255
    local b = tonumber(hex:sub(5, 6), 16) or 255
    return Color3.fromRGB(r, g, b)
end
function Color3:Lerp(goal, alpha)
    return Color3.new(
        self.R + (goal.R - self.R) * alpha,
        self.G + (goal.G - self.G) * alpha,
        self.B + (goal.B - self.B) * alpha
    )
end
function Color3:ToHex()
    return string.format("%02X%02X%02X", math.floor(self.R * 255), math.floor(self.G * 255), math.floor(self.B * 255))
end
function Color3:__tostring()
    return string.format("%g, %g, %g", self.R, self.G, self.B)
end

-- UDim & UDim2
UDim = {}
UDim.__index = UDim
function UDim.new(s, o)
    return setmetatable({ Scale = s or 0, Offset = o or 0 }, UDim)
end
function UDim:__tostring() return string.format("{%g, %g}", self.Scale, self.Offset) end

UDim2 = {}
UDim2.__index = function(self, key)
    if key == "Width" then return self.X end
    if key == "Height" then return self.Y end
    return rawget(UDim2, key)
end
function UDim2.new(xs, xo, ys, yo)
    return setmetatable({
        X = UDim.new(xs or 0, xo or 0),
        Y = UDim.new(ys or 0, yo or 0)
    }, UDim2)
end
function UDim2.fromScale(xs, ys) return UDim2.new(xs, 0, ys, 0) end
function UDim2.fromOffset(xo, yo) return UDim2.new(0, xo, 0, yo) end
UDim2.zero = UDim2.new(0, 0, 0, 0)
function UDim2:Lerp(goal, alpha)
    return UDim2.new(
        self.X.Scale + (goal.X.Scale - self.X.Scale) * alpha,
        self.X.Offset + (goal.X.Offset - self.X.Offset) * alpha,
        self.Y.Scale + (goal.Y.Scale - self.Y.Scale) * alpha,
        self.Y.Offset + (goal.Y.Offset - self.Y.Offset) * alpha
    )
end
function UDim2.__add(a, b)
    return UDim2.new(a.X.Scale + b.X.Scale, a.X.Offset + b.X.Offset, a.Y.Scale + b.Y.Scale, a.Y.Offset + b.Y.Offset)
end
function UDim2.__sub(a, b)
    return UDim2.new(a.X.Scale - b.X.Scale, a.X.Offset - b.X.Offset, a.Y.Scale - b.Y.Scale, a.Y.Offset - b.Y.Offset)
end
function UDim2:__tostring()
    return string.format("{%g, %g}, {%g, %g}", self.X.Scale, self.X.Offset, self.Y.Scale, self.Y.Offset)
end

-- BrickColor
BrickColor = {}
BrickColor.__index = BrickColor
local BRICK_COLORS = {
    ["Medium stone grey"] = { 163, 162, 165, 194 },
    ["Really black"] = { 17, 17, 17, 1003 },
    ["Really red"] = { 255, 0, 0, 1004 },
    ["Really blue"] = { 0, 0, 255, 1005 },
    ["White"] = { 242, 243, 243, 1 },
    ["Bright red"] = { 196, 40, 28, 21 },
    ["Bright blue"] = { 13, 105, 172, 23 },
    ["Bright yellow"] = { 245, 205, 47, 24 },
    ["Bright green"] = { 75, 151, 75, 37 },
    ["Dark stone grey"] = { 99, 95, 98, 199 },
}
function BrickColor.new(val)
    local name = "Medium stone grey"
    local r, g, b, num = 163, 162, 165, 194
    if type(val) == "string" and BRICK_COLORS[val] then
        name = val
        local entry = BRICK_COLORS[val]
        r, g, b, num = entry[1], entry[2], entry[3], entry[4]
    elseif type(val) == "number" then
        num = val
    elseif typeof(val) == "Color3" then
        return BrickColor.new("Medium stone grey")
    end
    return setmetatable({
        Name = name,
        Number = num,
        Color = Color3.fromRGB(r, g, b),
        r = r / 255, g = g / 255, b = b / 255
    }, BrickColor)
end
function BrickColor:__tostring() return self.Name end
function BrickColor.random() return BrickColor.new("Bright blue") end
function BrickColor.White() return BrickColor.new("White") end
function BrickColor.Black() return BrickColor.new("Really black") end
function BrickColor.Red() return BrickColor.new("Really red") end
function BrickColor.Blue() return BrickColor.new("Really blue") end
function BrickColor.Yellow() return BrickColor.new("Bright yellow") end
function BrickColor.Green() return BrickColor.new("Bright green") end
function BrickColor.DarkGray() return BrickColor.new("Dark stone grey") end

-- TweenInfo
TweenInfo = {}
TweenInfo.__index = TweenInfo
function TweenInfo.new(time, easingStyle, easingDirection, repeatCount, reverses, delayTime)
    return setmetatable({
        Time = time or 1,
        EasingStyle = easingStyle or Enum.EasingStyle.Quad,
        EasingDirection = easingDirection or Enum.EasingDirection.Out,
        RepeatCount = repeatCount or 0,
        Reverses = reverses or false,
        DelayTime = delayTime or 0,
    }, TweenInfo)
end
function TweenInfo:__tostring()
    return string.format("TweenInfo(%gs, %s, %s)", self.Time, tostring(self.EasingStyle), tostring(self.EasingDirection))
end

-- Ray & Parameters
Ray = {}
Ray.__index = Ray
function Ray.new(origin, direction)
    local o = origin or Vector3.zero
    local d = direction or Vector3.zero
    return setmetatable({
        Origin = o,
        Direction = d,
        Unit = if d.Magnitude > 0 then d.Unit else Vector3.zero
    }, Ray)
end
function Ray:ClosestPoint(pt)
    local v = pt - self.Origin
    local proj = v:Dot(self.Unit)
    return self.Origin + self.Unit * math.clamp(proj, 0, self.Direction.Magnitude)
end
function Ray:Distance(pt) return (self:ClosestPoint(pt) - pt).Magnitude end

RaycastParams = {}
RaycastParams.__index = RaycastParams
function RaycastParams.new()
    return setmetatable({
        FilterDescendantsInstances = {},
        FilterType = Enum.RaycastFilterType.Exclude,
        IgnoreWater = false,
        CollisionGroup = "Default"
    }, RaycastParams)
end

OverlapParams = {}
OverlapParams.__index = OverlapParams
function OverlapParams.new()
    return setmetatable({
        FilterDescendantsInstances = {},
        FilterType = Enum.RaycastFilterType.Exclude,
        MaxParts = 0,
        CollisionGroup = "Default"
    }, OverlapParams)
end

-- Random, NumberRange, Rect
Random = {}
Random.__index = Random
function Random.new(seed)
    return setmetatable({ _seed = seed or os.time() }, Random)
end
function Random:NextNumber(min, max)
    local a = min or 0
    local b = max or 1
    return a + math.random() * (b - a)
end
function Random:NextInteger(min, max) return math.random(min, max) end
function Random:NextUnitVector()
    local v = Vector3.new(math.random() * 2 - 1, math.random() * 2 - 1, math.random() * 2 - 1)
    return if v.Magnitude > 0 then v.Unit else Vector3.yAxis end
end

NumberRange = {}
NumberRange.__index = NumberRange
function NumberRange.new(min, max)
    return setmetatable({ Min = min or 0, Max = max or min or 0 }, NumberRange)
end

Rect = {}
Rect.__index = Rect
function Rect.new(minX, minY, maxX, maxY)
    local min = if typeof(minX) == "Vector2" then minX else Vector2.new(minX or 0, minY or 0)
    local max = if typeof(minY) == "Vector2" then minY else Vector2.new(maxX or 0, maxY or 0)
    return setmetatable({
        Min = min,
        Max = max,
        Width = max.X - min.X,
        Height = max.Y - min.Y
    }, Rect)
end

-- =========================================================================
-- 4. Class Hierarchy & Instance Metatable System
-- =========================================================================
local CLASS_HIERARCHY = {
    Part = { "BasePart", "Instance" },
    MeshPart = { "BasePart", "Instance" },
    WedgePart = { "BasePart", "Instance" },
    CornerWedgePart = { "BasePart", "Instance" },
    TrussPart = { "BasePart", "Instance" },
    SpawnLocation = { "BasePart", "Instance" },
    BasePart = { "Instance" },
    Model = { "Instance" },
    Folder = { "Instance" },
    Configuration = { "Instance" },
    Humanoid = { "Instance" },
    HumanoidDescription = { "Instance" },
    Tool = { "Instance" },
    Sound = { "Instance" },
    Animation = { "Instance" },
    Animator = { "Instance" },
    AnimationTrack = { "Instance" },
    ScreenGui = { "LayerCollector", "Instance" },
    BillboardGui = { "LayerCollector", "Instance" },
    SurfaceGui = { "LayerCollector", "Instance" },
    Frame = { "GuiObject", "Instance" },
    ScrollingFrame = { "GuiObject", "Instance" },
    TextLabel = { "GuiObject", "Instance" },
    TextButton = { "GuiObject", "Instance" },
    TextBox = { "GuiObject", "Instance" },
    ImageLabel = { "GuiObject", "Instance" },
    ImageButton = { "GuiObject", "Instance" },
    UIListLayout = { "UILayout", "Instance" },
    UIGridLayout = { "UILayout", "Instance" },
    UICorner = { "UIComponent", "Instance" },
    UIPadding = { "UIComponent", "Instance" },
    UIStroke = { "UIComponent", "Instance" },
    UIGradient = { "UIComponent", "Instance" },
    PointLight = { "Light", "Instance" },
    SpotLight = { "Light", "Instance" },
    SurfaceLight = { "Light", "Instance" },
    ParticleEmitter = { "Instance" },
    Highlight = { "Instance" },
    ProximityPrompt = { "Instance" },
    ClickDetector = { "Instance" },
    Attachment = { "Instance" },
    Weld = { "JointInstance", "Instance" },
    WeldConstraint = { "Instance" },
    Motor6D = { "JointInstance", "Instance" },
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
    Vector3Value = { "ValueBase", "Instance" },
    CFrameValue = { "ValueBase", "Instance" },
    Color3Value = { "ValueBase", "Instance" },
    ObjectValue = { "ValueBase", "Instance" },
    ValueBase = { "Instance" },
    Player = { "Instance" },
    Camera = { "Instance" },
    Terrain = { "BasePart", "Instance" },
    Workspace = { "Instance" },
    Players = { "Instance" },
    Lighting = { "Instance" },
    ReplicatedStorage = { "Instance" },
    ReplicatedFirst = { "Instance" },
    ServerStorage = { "Instance" },
    ServerScriptService = { "Instance" },
    StarterGui = { "Instance" },
    StarterPlayer = { "Instance" },
    StarterPack = { "Instance" },
    SoundService = { "Instance" },
    TweenService = { "Instance" },
    HttpService = { "Instance" },
    DataStoreService = { "Instance" },
    Debris = { "Instance" },
    CollectionService = { "Instance" },
    UserInputService = { "Instance" },
    ContextActionService = { "Instance" },
    MarketplaceService = { "Instance" },
    BadgeService = { "Instance" },
    TeleportService = { "Instance" },
    Chat = { "Instance" },
    TextChatService = { "Instance" },
    PathfindingService = { "Instance" },
    PhysicsService = { "Instance" },
    GuiService = { "Instance" },
    LocalizationService = { "Instance" },
    PolicyService = { "Instance" },
    ProximityPromptService = { "Instance" },
    Teams = { "Instance" },
    RunService = { "Instance" },
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
        _attributes = {},
        _events = {
            Changed = Signal.new("Changed"),
            ChildAdded = Signal.new("ChildAdded"),
            ChildRemoved = Signal.new("ChildRemoved"),
            Destroying = Signal.new("Destroying"),
            AttributeChanged = Signal.new("AttributeChanged"),
        },
        _propSignals = {}
    }

    -- Set class-specific properties and events
    if className == "Part" or className == "MeshPart" or className == "WedgePart" or className == "CornerWedgePart" or className == "TrussPart" or className == "SpawnLocation" then
        obj._props.Size = Vector3.new(4, 1, 2)
        obj._props.Position = Vector3.new(0, 0, 0)
        obj._props.CFrame = CFrame.new(0, 0, 0)
        obj._props.Anchored = false
        obj._props.CanCollide = true
        obj._props.CanTouch = true
        obj._props.Transparency = 0
        obj._props.Reflectance = 0
        obj._props.Color = Color3.fromRGB(163, 162, 165)
        obj._props.BrickColor = BrickColor.new("Medium stone grey")
        obj._props.Material = Enum.Material.Plastic
        obj._events.Touched = Signal.new("Touched")
        obj._events.TouchEnded = Signal.new("TouchEnded")
    elseif className == "Model" then
        obj._props.PrimaryPart = nil
    elseif className == "Humanoid" then
        obj._props.Health = 100
        obj._props.MaxHealth = 100
        obj._props.WalkSpeed = 16
        obj._props.JumpPower = 50
        obj._props.JumpHeight = 7.2
        obj._props.DisplayName = "Robloxian"
        obj._props.AutoRotate = true
        obj._props.RigType = Enum.HumanoidRigType.R15
        obj._events.Died = Signal.new("Died")
        obj._events.HealthChanged = Signal.new("HealthChanged")
        obj._events.StateChanged = Signal.new("StateChanged")
        obj._events.Running = Signal.new("Running")
        obj._events.Jumping = Signal.new("Jumping")
        obj._events.FreeFalling = Signal.new("FreeFalling")
    elseif className == "Tool" then
        obj._props.RequiresHandle = true
        obj._props.CanBeDropped = true
        obj._props.ToolTip = ""
        obj._events.Activated = Signal.new("Activated")
        obj._events.Deactivated = Signal.new("Deactivated")
        obj._events.Equipped = Signal.new("Equipped")
        obj._events.Unequipped = Signal.new("Unequipped")
    elseif className == "Sound" then
        obj._props.SoundId = ""
        obj._props.Volume = 0.5
        obj._props.Pitch = 1
        obj._props.PlaybackSpeed = 1
        obj._props.TimePosition = 0
        obj._props.TimeLength = 10
        obj._props.IsPlaying = false
        obj._props.Looped = false
        obj._events.Ended = Signal.new("Ended")
    elseif className == "ProximityPrompt" then
        obj._props.ActionText = "Interact"
        obj._props.ObjectText = ""
        obj._props.HoldDuration = 0
        obj._props.MaxActivationDistance = 10
        obj._props.RequiresLineOfSight = true
        obj._props.Enabled = true
        obj._events.Triggered = Signal.new("Triggered")
        obj._events.PromptButtonHoldBegan = Signal.new("PromptButtonHoldBegan")
        obj._events.PromptButtonHoldEnded = Signal.new("PromptButtonHoldEnded")
    elseif className == "ClickDetector" then
        obj._props.MaxActivationDistance = 32
        obj._events.MouseClick = Signal.new("MouseClick")
        obj._events.MouseHoverEnter = Signal.new("MouseHoverEnter")
        obj._events.MouseHoverLeave = Signal.new("MouseHoverLeave")
        obj._events.RightMouseClick = Signal.new("RightMouseClick")
    elseif className == "Camera" then
        obj._props.CFrame = CFrame.new(0, 10, 20)
        obj._props.FieldOfView = 70
        obj._props.CameraType = Enum.CameraType.Custom
    elseif className == "ScreenGui" then
        obj._props.Enabled = true
        obj._props.ResetOnSpawn = true
    elseif className == "Frame" or className == "ScrollingFrame" then
        obj._props.Size = UDim2.new(0, 100, 0, 100)
        obj._props.Position = UDim2.new(0, 0, 0, 0)
        obj._props.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        obj._props.BackgroundTransparency = 0
        obj._props.Visible = true
    elseif className == "TextLabel" or className == "TextButton" or className == "TextBox" then
        obj._props.Text = if className == "TextButton" then "Button" else "Label"
        obj._props.TextSize = 14
        obj._props.TextColor3 = Color3.fromRGB(255, 255, 255)
        obj._props.Font = Enum.Font.SourceSans
        obj._props.Visible = true
        obj._props.Size = UDim2.new(0, 100, 0, 40)
        obj._props.Position = UDim2.new(0, 0, 0, 0)
        obj._props.BackgroundColor3 = Color3.fromRGB(45, 45, 55)
        obj._events.Activated = Signal.new("Activated")
        obj._events.MouseButton1Click = Signal.new("MouseButton1Click")
        obj._events.MouseButton1Down = Signal.new("MouseButton1Down")
        obj._events.MouseButton1Up = Signal.new("MouseButton1Up")
    elseif className == "StringValue" then obj._props.Value = ""
    elseif className == "IntValue" or className == "NumberValue" then obj._props.Value = 0
    elseif className == "BoolValue" then obj._props.Value = false
    elseif className == "Vector3Value" then obj._props.Value = Vector3.zero
    elseif className == "CFrameValue" then obj._props.Value = CFrame.identity
    elseif className == "Color3Value" then obj._props.Value = Color3.new(1, 1, 1)
    elseif className == "ObjectValue" then obj._props.Value = nil
    elseif className == "RemoteEvent" then
        obj._events.OnServerEvent = Signal.new("OnServerEvent")
        obj._events.OnClientEvent = Signal.new("OnClientEvent")
    elseif className == "RemoteFunction" then
        obj._props.OnServerInvoke = nil
        obj._props.OnClientInvoke = nil
    elseif className == "BindableEvent" then
        obj._events.Event = Signal.new("Event")
    end

    local meta = {
        __index = function(self, key)
            local props = rawget(self, "_props")
            if props[key] ~= nil then return props[key] end
            local events = rawget(self, "_events")
            if events and events[key] then return events[key] end
            if InstanceMethods[key] then return InstanceMethods[key] end

            -- Direct child access (e.g. workspace.Part or model.Humanoid)
            local kids = rawget(self, "_children")
            if kids then
                for _, kid in ipairs(kids) do
                    if kid.Name == key then return kid end
                end
            end
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

            -- Coordinate math syncing: Position & CFrame
            if key == "Position" and typeof(value) == "Vector3" then
                props.Position = value
                props.CFrame = CFrame.new(value)
            elseif key == "CFrame" and typeof(value) == "CFrame" then
                props.CFrame = value
                props.Position = value.Position
            elseif key == "Color" and typeof(value) == "Color3" then
                props.Color = value
                props.BrickColor = BrickColor.new(value)
            else
                props[key] = value
            end

            self.Changed:Fire(key)
            local sigs = rawget(self, "_propSignals")
            if sigs and sigs[key] then
                sigs[key]:Fire(value)
            end
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

-- Instance Methods
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

function InstanceMethods:IsDescendantOf(ancestor)
    local curr = self.Parent
    while curr do
        if curr == ancestor then return true end
        curr = curr.Parent
    end
    return false
end

function InstanceMethods:IsAncestorOf(descendant)
    if not descendant then return false end
    return descendant:IsDescendantOf(self)
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
    for k, v in pairs(rawget(self, "_attributes")) do
        rawget(clone, "_attributes")[k] = v
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

function InstanceMethods:SetAttribute(name, val)
    rawget(self, "_attributes")[name] = val
    self.AttributeChanged:Fire(name)
end

function InstanceMethods:GetAttribute(name)
    return rawget(self, "_attributes")[name]
end

function InstanceMethods:GetAttributes()
    local copy = {}
    for k, v in pairs(rawget(self, "_attributes")) do copy[k] = v end
    return copy
end

function InstanceMethods:GetPropertyChangedSignal(propertyName)
    local sigs = rawget(self, "_propSignals")
    if not sigs[propertyName] then
        sigs[propertyName] = Signal.new("PropertyChanged_" .. propertyName)
    end
    return sigs[propertyName]
end

-- Model methods
function InstanceMethods:GetPivot()
    if self.PrimaryPart then return self.PrimaryPart.CFrame end
    return CFrame.new(0, 0, 0)
end
function InstanceMethods:PivotTo(targetCFrame)
    if self.PrimaryPart then self.PrimaryPart.CFrame = targetCFrame end
end
function InstanceMethods:SetPrimaryPartCFrame(cf)
    self:PivotTo(cf)
end

-- Humanoid methods
function InstanceMethods:TakeDamage(amount)
    if self.ClassName == "Humanoid" then
        local cur = self.Health or 100
        local nextHealth = math.max(0, cur - (amount or 0))
        self.Health = nextHealth
        self.HealthChanged:Fire(nextHealth)
        if nextHealth == 0 and cur > 0 then
            self.Died:Fire()
        end
    end
end
function InstanceMethods:ChangeState(state)
    if self.ClassName == "Humanoid" then
        self.StateChanged:Fire(state, state)
    end
end
function InstanceMethods:MoveTo(targetPosition)
    if self.ClassName == "Humanoid" then
        self.Running:Fire(self.WalkSpeed or 16)
    end
end

-- Sound methods
function InstanceMethods:Play()
    if self.ClassName == "Sound" then
        self.IsPlaying = true
        print("[Sound] Playing sound: " .. self.Name)
    end
end
function InstanceMethods:Stop()
    if self.ClassName == "Sound" then
        self.IsPlaying = false
        self.Ended:Fire()
    end
end
function InstanceMethods:Pause() if self.ClassName == "Sound" then self.IsPlaying = false end end
function InstanceMethods:Resume() if self.ClassName == "Sound" then self.IsPlaying = true end end

-- Tool methods
function InstanceMethods:Activate() self.Activated:Fire() end
function InstanceMethods:Deactivate() self.Deactivated:Fire() end

-- RemoteEvent & RemoteFunction
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
    if self.OnServerInvoke then return self.OnServerInvoke(...) end
    return nil
end
function InstanceMethods:InvokeClient(player, ...)
    if self.OnClientInvoke then return self.OnClientInvoke(...) end
    return nil
end

-- BindableEvent & BindableFunction
function InstanceMethods:Fire(...) self.Event:Fire(...) end
function InstanceMethods:Invoke(...)
    if self.OnInvoke then return self.OnInvoke(...) end
    return nil
end

-- Instance.new constructor
Instance = {
    new = function(className, parent)
        return createInstance(className, parent)
    end
}

-- =========================================================================
-- 5. DataModel ("game") and All Major Core Services
-- =========================================================================
local game = createInstance("DataModel", nil)
game.Name = "game"

local workspace = createInstance("Workspace", game)
workspace.Name = "Workspace"
workspace.Gravity = 196.2
workspace.FallenPartsDestroyHeight = -500

local Terrain = createInstance("Terrain", workspace)
Terrain.Name = "Terrain"

local Camera = createInstance("Camera", workspace)
Camera.Name = "Camera"
workspace.CurrentCamera = Camera

local Players = createInstance("Players", game)
Players.Name = "Players"
Players.PlayerAdded = Signal.new("PlayerAdded")
Players.PlayerRemoving = Signal.new("PlayerRemoving")

function Players:GetPlayers() return self:GetChildren() end
function Players:GetPlayerByUserId(id)
    for _, p in ipairs(self:GetChildren()) do
        if p.UserId == id then return p end
    end
    return nil
end
function Players:GetPlayerFromCharacter(char)
    for _, p in ipairs(self:GetChildren()) do
        if p.Character == char then return p end
    end
    return nil
end

-- Create LocalPlayer and authentic Character model in Workspace
local localPlayer = createInstance("Player", Players)
localPlayer.Name = "SimPlayer"
localPlayer.UserId = 12345678
localPlayer.DisplayName = "SimulatedRobloxian"
Players.LocalPlayer = localPlayer

local backpack = createInstance("Folder", localPlayer)
backpack.Name = "Backpack"

local playerGui = createInstance("Folder", localPlayer)
playerGui.Name = "PlayerGui"

local character = createInstance("Model", workspace)
character.Name = "SimPlayer"

local hrp = createInstance("Part", character)
hrp.Name = "HumanoidRootPart"
hrp.Size = Vector3.new(2, 2, 1)
hrp.Position = Vector3.new(0, 3, 0)
character.PrimaryPart = hrp

local head = createInstance("Part", character)
head.Name = "Head"
head.Size = Vector3.new(1.2, 1.2, 1.2)
head.Position = Vector3.new(0, 4.5, 0)

local torso = createInstance("Part", character)
torso.Name = "Torso"
torso.Size = Vector3.new(2, 2, 1)
torso.Position = Vector3.new(0, 2.8, 0)

local humanoid = createInstance("Humanoid", character)
humanoid.Name = "Humanoid"

localPlayer.Character = character
localPlayer.CharacterAdded = Signal.new("CharacterAdded")
localPlayer.CharacterRemoving = Signal.new("CharacterRemoving")
function localPlayer:Kick(msg) print("[Player:Kick] " .. tostring(msg or "Kicked")) end

-- Lighting Service
local Lighting = createInstance("Lighting", game)
Lighting.Name = "Lighting"
Lighting.ClockTime = 14
Lighting.TimeOfDay = "14:00:00"
Lighting.Brightness = 2
Lighting.Ambient = Color3.fromRGB(128, 128, 128)
Lighting.OutdoorAmbient = Color3.fromRGB(128, 128, 128)
Lighting.FogEnd = 100000
Lighting.FogStart = 0
Lighting.FogColor = Color3.fromRGB(192, 192, 192)
Lighting.GlobalShadows = true
function Lighting:GetMinutesAfterMidnight() return self.ClockTime * 60 end
function Lighting:SetMinutesAfterMidnight(m) self.ClockTime = m / 60 end

-- RunService
local RunService = createInstance("RunService", game)
RunService.Name = "RunService"
RunService.Heartbeat = Signal.new("Heartbeat")
RunService.Stepped = Signal.new("Stepped")
RunService.RenderStepped = Signal.new("RenderStepped")
function RunService:IsServer() return ${isServer ? 'true' : 'false'} end
function RunService:IsClient() return ${isClient ? 'true' : 'false'} end
function RunService:IsStudio() return true end

-- =========================================================================
-- 6. FULLY WORKING TWEENSERVICE
-- =========================================================================
local TweenService = createInstance("TweenService", game)
TweenService.Name = "TweenService"

-- Pure Luau Easing Functions
local function easeLinear(t) return t end
local function easeSine(t) return 1 - math.cos((t * math.pi) / 2) end
local function easeQuad(t) return t * t end
local function easeCubic(t) return t * t * t end
local function easeQuart(t) return t * t * t * t end
local function easeQuint(t) return t * t * t * t * t end
local function easeExpo(t) return if t == 0 then 0 else 2 ^ (10 * (t - 1)) end
local function easeCirc(t) return 1 - math.sqrt(1 - (t * t)) end
local function easeBack(t) local s = 1.70158 return t * t * ((s + 1) * t - s) end
local function easeBounce(t)
    t = 1 - t
    if t < (1 / 2.75) then
        return 1 - (7.5625 * t * t)
    elseif t < (2 / 2.75) then
        t = t - (1.5 / 2.75)
        return 1 - (7.5625 * t * t + 0.75)
    elseif t < (2.5 / 2.75) then
        t = t - (2.25 / 2.75)
        return 1 - (7.5625 * t * t + 0.9375)
    else
        t = t - (2.625 / 2.75)
        return 1 - (7.5625 * t * t + 0.984375)
    end
end
local function easeElastic(t)
    if t == 0 or t == 1 then return t end
    local p = 0.3
    local s = p / 4
    return -(2 ^ (10 * (t - 1)) * math.sin(((t - 1) - s) * (2 * math.pi) / p))
end

local EASING_FUNCS = {
    Linear = easeLinear,
    Sine = easeSine,
    Back = easeBack,
    Quad = easeQuad,
    Cubic = easeCubic,
    Quart = easeQuart,
    Quint = easeQuint,
    Bounce = easeBounce,
    Elastic = easeElastic,
    Exponential = easeExpo,
    Circular = easeCirc,
}

local function calculateAlpha(t, style, direction)
    local styleName = if typeof(style) == "table" and style.Name then style.Name else tostring(style or "Quad")
    styleName = styleName:match("[%w_]+$") or "Quad"
    local dirName = if typeof(direction) == "table" and direction.Name then direction.Name else tostring(direction or "Out")
    dirName = dirName:match("[%w_]+$") or "Out"

    local fn = EASING_FUNCS[styleName] or easeQuad
    t = math.clamp(t, 0, 1)

    if dirName == "In" then
        return fn(t)
    elseif dirName == "Out" then
        return 1 - fn(1 - t)
    elseif dirName == "InOut" then
        if t < 0.5 then
            return fn(t * 2) / 2
        else
            return 1 - (fn((1 - t) * 2) / 2)
        end
    end
    return fn(t)
end

function TweenService:GetValue(alpha, easingStyle, easingDirection)
    return calculateAlpha(alpha, easingStyle, easingDirection)
end

local function lerpValue(startVal, endVal, alpha)
    local t = typeof(startVal)
    if t == "number" then
        return startVal + (endVal - startVal) * alpha
    elseif t == "Vector3" then
        return startVal:Lerp(endVal, alpha)
    elseif t == "Vector2" then
        return startVal:Lerp(endVal, alpha)
    elseif t == "CFrame" then
        return startVal:Lerp(endVal, alpha)
    elseif t == "Color3" then
        return startVal:Lerp(endVal, alpha)
    elseif t == "UDim2" then
        return startVal:Lerp(endVal, alpha)
    end
    return if alpha >= 1 then endVal else startVal
end

function TweenService:Create(instance, tweenInfo, propertyTable)
    if not instance or typeof(instance) ~= "Instance" then
        error("TweenService:Create expects an Instance as first argument")
    end
    if not propertyTable or type(propertyTable) ~= "table" then
        error("TweenService:Create expects a property table as third argument")
    end

    local ti = tweenInfo or TweenInfo.new(1)
    local duration = ti.Time or 1
    local easingStyle = ti.EasingStyle or Enum.EasingStyle.Quad
    local easingDirection = ti.EasingDirection or Enum.EasingDirection.Out
    local repeatCount = ti.RepeatCount or 0
    local reverses = ti.Reverses or false
    local delayTime = ti.DelayTime or 0

    local tween = {
        Instance = instance,
        TweenInfo = ti,
        PlaybackState = Enum.PlaybackState.Begin,
        Completed = Signal.new("Completed"),
        _running = false,
        _paused = false,
        _cancelRequested = false,
    }

    function tween:Play()
        if self._running and not self._paused then return end
        if self._paused then
            self._paused = false
            self.PlaybackState = Enum.PlaybackState.Playing
            return
        end

        self._running = true
        self._paused = false
        self._cancelRequested = false
        self.PlaybackState = Enum.PlaybackState.Playing

        task.spawn(function()
            if delayTime > 0 then
                self.PlaybackState = Enum.PlaybackState.Delayed
                task.wait(delayTime)
                if self._cancelRequested then
                    self.PlaybackState = Enum.PlaybackState.Cancelled
                    self.Completed:Fire(Enum.PlaybackState.Cancelled)
                    return
                end
                self.PlaybackState = Enum.PlaybackState.Playing
            end

            local initialValues = {}
            for prop, _ in pairs(propertyTable) do
                initialValues[prop] = instance[prop]
            end

            local totalCycles = 1 + math.max(0, repeatCount)
            for cycle = 1, totalCycles do
                if self._cancelRequested then break end

                -- Forward Phase
                local startTime = os.clock()
                while os.clock() - startTime < duration do
                    if self._cancelRequested then break end
                    while self._paused do
                        task.wait(0.03)
                        startTime = startTime + 0.03
                    end

                    local elapsed = os.clock() - startTime
                    local rawAlpha = math.clamp(elapsed / duration, 0, 1)
                    local alpha = calculateAlpha(rawAlpha, easingStyle, easingDirection)

                    for prop, targetVal in pairs(propertyTable) do
                        local sVal = initialValues[prop]
                        if sVal ~= nil then
                            instance[prop] = lerpValue(sVal, targetVal, alpha)
                        end
                    end
                    task.wait(1 / 30)
                end

                if self._cancelRequested then break end

                -- Ensure final values
                for prop, targetVal in pairs(propertyTable) do
                    local sVal = initialValues[prop]
                    if sVal ~= nil then
                        instance[prop] = targetVal
                    end
                end

                -- Reverses Phase
                if reverses then
                    local revStartTime = os.clock()
                    while os.clock() - revStartTime < duration do
                        if self._cancelRequested then break end
                        while self._paused do
                            task.wait(0.03)
                            revStartTime = revStartTime + 0.03
                        end

                        local elapsed = os.clock() - revStartTime
                        local rawAlpha = math.clamp(elapsed / duration, 0, 1)
                        local alpha = calculateAlpha(rawAlpha, easingStyle, easingDirection)

                        for prop, targetVal in pairs(propertyTable) do
                            local sVal = initialValues[prop]
                            if sVal ~= nil then
                                instance[prop] = lerpValue(targetVal, sVal, alpha)
                            end
                        end
                        task.wait(1 / 30)
                    end

                    if not self._cancelRequested then
                        for prop, _ in pairs(propertyTable) do
                            local sVal = initialValues[prop]
                            if sVal ~= nil then
                                instance[prop] = sVal
                            end
                        end
                    end
                end
            end

            self._running = false
            if self._cancelRequested then
                self.PlaybackState = Enum.PlaybackState.Cancelled
                self.Completed:Fire(Enum.PlaybackState.Cancelled)
            else
                self.PlaybackState = Enum.PlaybackState.Completed
                self.Completed:Fire(Enum.PlaybackState.Completed)
            end
        end)
    end

    function tween:Pause()
        if self._running then
            self._paused = true
            self.PlaybackState = Enum.PlaybackState.Paused
        end
    end

    function tween:Resume()
        if self._paused then
            self._paused = false
            self.PlaybackState = Enum.PlaybackState.Playing
        end
    end

    function tween:Cancel()
        if self._running then
            self._cancelRequested = true
            self._running = false
            self._paused = false
            self.PlaybackState = Enum.PlaybackState.Cancelled
            self.Completed:Fire(Enum.PlaybackState.Cancelled)
        end
    end

    return tween
end

-- =========================================================================
-- 7. FULLY WORKING HTTPSERVICE (JSON & GUID)
-- =========================================================================
local HttpService = createInstance("HttpService", game)
HttpService.Name = "HttpService"

function HttpService:JSONEncode(data)
    local function serialize(val)
        local t = type(val)
        if t == "nil" then
            return "null"
        elseif t == "boolean" then
            return val and "true" or "false"
        elseif t == "number" then
            if val ~= val or val == math.huge or val == -math.huge then return "null" end
            return tostring(val)
        elseif t == "string" then
            local escaped = val:gsub('\\\\', '\\\\\\\\')
                :gsub('"', '\\\\"')
                :gsub('\\n', '\\\\n')
                :gsub('\\r', '\\\\r')
                :gsub('\\t', '\\\\t')
            return '"' .. escaped .. '"'
        elseif t == "table" then
            local isArray = true
            local maxKey = 0
            for k, _ in pairs(val) do
                if type(k) == "number" and k > 0 and math.floor(k) == k then
                    if k > maxKey then maxKey = k end
                else
                    isArray = false
                    break
                end
            end
            if isArray and maxKey > 0 then
                local parts = {}
                for i = 1, maxKey do
                    parts[i] = serialize(val[i])
                end
                return "[" .. table.concat(parts, ",") .. "]"
            elseif isArray and maxKey == 0 and next(val) == nil then
                return "[]"
            else
                local parts = {}
                for k, v in pairs(val) do
                    table.insert(parts, serialize(tostring(k)) .. ":" .. serialize(v))
                end
                return "{" .. table.concat(parts, ",") .. "}"
            end
        else
            return '"' .. tostring(val) .. '"'
        end
    end
    return serialize(data)
end

function HttpService:JSONDecode(jsonStr)
    if type(jsonStr) ~= "string" or jsonStr == "" then
        error("HttpService:JSONDecode expects non-empty string")
    end
    local pos = 1
    local len = #jsonStr

    local function skipWhitespace()
        while pos <= len do
            local c = jsonStr:sub(pos, pos)
            if c == ' ' or c == '\\t' or c == '\\n' or c == '\\r' then
                pos = pos + 1
            else
                break
            end
        end
    end

    local parseValue

    local function parseString()
        pos = pos + 1
        local start = pos
        local buf = {}
        while pos <= len do
            local c = jsonStr:sub(pos, pos)
            if c == '"' then
                table.insert(buf, jsonStr:sub(start, pos - 1))
                pos = pos + 1
                return table.concat(buf)
            elseif c == '\\\\' then
                table.insert(buf, jsonStr:sub(start, pos - 1))
                pos = pos + 1
                local esc = jsonStr:sub(pos, pos)
                if esc == 'n' then table.insert(buf, '\\n')
                elseif esc == 'r' then table.insert(buf, '\\r')
                elseif esc == 't' then table.insert(buf, '\\t')
                elseif esc == '"' then table.insert(buf, '"')
                elseif esc == '\\\\' then table.insert(buf, '\\\\')
                else table.insert(buf, esc) end
                pos = pos + 1
                start = pos
            else
                pos = pos + 1
            end
        end
        return table.concat(buf)
    end

    local function parseNumber()
        local start = pos
        if jsonStr:sub(pos, pos) == '-' then pos = pos + 1 end
        while pos <= len and jsonStr:sub(pos, pos):match("[%d.eE+-]") do
            pos = pos + 1
        end
        return tonumber(jsonStr:sub(start, pos - 1)) or 0
    end

    local function parseArray()
        pos = pos + 1
        local arr = {}
        skipWhitespace()
        if pos <= len and jsonStr:sub(pos, pos) == ']' then
            pos = pos + 1
            return arr
        end
        while pos <= len do
            local val = parseValue()
            table.insert(arr, val)
            skipWhitespace()
            local c = jsonStr:sub(pos, pos)
            if c == ']' then
                pos = pos + 1
                return arr
            elseif c == ',' then
                pos = pos + 1
            else
                break
            end
        end
        return arr
    end

    local function parseObject()
        pos = pos + 1
        local obj = {}
        skipWhitespace()
        if pos <= len and jsonStr:sub(pos, pos) == '}' then
            pos = pos + 1
            return obj
        end
        while pos <= len do
            skipWhitespace()
            if jsonStr:sub(pos, pos) ~= '"' then break end
            local key = parseString()
            skipWhitespace()
            if jsonStr:sub(pos, pos) == ':' then pos = pos + 1 end
            local val = parseValue()
            obj[key] = val
            skipWhitespace()
            local c = jsonStr:sub(pos, pos)
            if c == '}' then
                pos = pos + 1
                return obj
            elseif c == ',' then
                pos = pos + 1
            else
                break
            end
        end
        return obj
    end

    parseValue = function()
        skipWhitespace()
        if pos > len then return nil end
        local c = jsonStr:sub(pos, pos)
        if c == '"' then
            return parseString()
        elseif c == '{' then
            return parseObject()
        elseif c == '[' then
            return parseArray()
        elseif c == 't' and jsonStr:sub(pos, pos + 3) == "true" then
            pos = pos + 4
            return true
        elseif c == 'f' and jsonStr:sub(pos, pos + 4) == "false" then
            pos = pos + 5
            return false
        elseif c == 'n' and jsonStr:sub(pos, pos + 3) == "null" then
            pos = pos + 4
            return nil
        else
            return parseNumber()
        end
    end

    return parseValue()
end

function HttpService:GenerateGUID(wrap)
    local hex = "0123456789abcdef"
    local function rHex(n)
        local s = {}
        for i = 1, n do
            local idx = math.random(1, 16)
            s[i] = hex:sub(idx, idx)
        end
        return table.concat(s)
    end
    local guid = string.format("%s-%s-4%s-%s-%s", rHex(8), rHex(4), rHex(3), rHex(4), rHex(12))
    return if wrap ~= false then "{" .. guid .. "}" else guid
end

function HttpService:UrlEncode(str)
    if type(str) ~= "string" then return "" end
    return (str:gsub("([^%w%-._~])", function(c)
        return string.format("%%%02X", string.byte(c))
    end))
end

function HttpService:GetAsync(url)
    print("[HttpService:GetAsync] " .. tostring(url))
    return '{"status": "ok", "message": "Simulated HttpService response"}'
end

function HttpService:PostAsync(url, data)
    print("[HttpService:PostAsync] " .. tostring(url))
    return '{"status": "ok", "message": "Simulated Post response"}'
end

-- =========================================================================
-- 8. FULLY WORKING DATASTORESERVICE
-- =========================================================================
local DataStoreService = createInstance("DataStoreService", game)
DataStoreService.Name = "DataStoreService"
local __GLOBAL_DATASTORES__ = {}

local function createDataStore(name, scope)
    local storeKey = tostring(name) .. "::" .. tostring(scope or "global")
    if not __GLOBAL_DATASTORES__[storeKey] then
        __GLOBAL_DATASTORES__[storeKey] = {}
    end
    local store = __GLOBAL_DATASTORES__[storeKey]

    local ds = {}
    function ds:GetAsync(key) return store[tostring(key)] end
    function ds:SetAsync(key, value)
        store[tostring(key)] = value
        return value
    end
    function ds:UpdateAsync(key, transformFn)
        local cur = store[tostring(key)]
        local newVal = transformFn(cur)
        store[tostring(key)] = newVal
        return newVal
    end
    function ds:IncrementAsync(key, delta)
        local cur = tonumber(store[tostring(key)]) or 0
        local nextVal = cur + (delta or 1)
        store[tostring(key)] = nextVal
        return nextVal
    end
    function ds:RemoveAsync(key)
        local old = store[tostring(key)]
        store[tostring(key)] = nil
        return old
    end
    return ds
end

function DataStoreService:GetDataStore(name, scope) return createDataStore(name, scope) end
function DataStoreService:GetOrderedDataStore(name, scope) return createDataStore(name, scope) end

-- =========================================================================
-- 9. FULLY WORKING DEBRIS SERVICE
-- =========================================================================
local Debris = createInstance("Debris", game)
Debris.Name = "Debris"
function Debris:AddItem(item, lifetime)
    if not item or typeof(item) ~= "Instance" then return end
    task.delay(lifetime or 0, function()
        if item and item.Parent then item:Destroy() end
    end)
end

-- =========================================================================
-- 10. FULLY WORKING COLLECTIONSERVICE
-- =========================================================================
local CollectionService = createInstance("CollectionService", game)
CollectionService.Name = "CollectionService"
local __TAG_MAP__ = {}
local __TAG_ADDED_SIGNALS__ = {}
local __TAG_REMOVED_SIGNALS__ = {}

function CollectionService:AddTag(inst, tag)
    if not inst or not tag then return end
    if not __TAG_MAP__[tag] then __TAG_MAP__[tag] = {} end
    if not table.find(__TAG_MAP__[tag], inst) then
        table.insert(__TAG_MAP__[tag], inst)
        if __TAG_ADDED_SIGNALS__[tag] then __TAG_ADDED_SIGNALS__[tag]:Fire(inst) end
    end
end
function CollectionService:RemoveTag(inst, tag)
    if not inst or not tag or not __TAG_MAP__[tag] then return end
    local idx = table.find(__TAG_MAP__[tag], inst)
    if idx then
        table.remove(__TAG_MAP__[tag], idx)
        if __TAG_REMOVED_SIGNALS__[tag] then __TAG_REMOVED_SIGNALS__[tag]:Fire(inst) end
    end
end
function CollectionService:HasTag(inst, tag)
    if not inst or not tag or not __TAG_MAP__[tag] then return false end
    return table.find(__TAG_MAP__[tag], inst) ~= nil
end
function CollectionService:GetTags(inst)
    local tags = {}
    for t, list in pairs(__TAG_MAP__) do
        if table.find(list, inst) then table.insert(tags, t) end
    end
    return tags
end
function CollectionService:GetTagged(tag)
    local list = __TAG_MAP__[tag] or {}
    local copy = {}
    for i, v in ipairs(list) do copy[i] = v end
    return copy
end
function CollectionService:GetInstanceAddedSignal(tag)
    if not __TAG_ADDED_SIGNALS__[tag] then __TAG_ADDED_SIGNALS__[tag] = Signal.new("Added_" .. tag) end
    return __TAG_ADDED_SIGNALS__[tag]
end
function CollectionService:GetInstanceRemovedSignal(tag)
    if not __TAG_REMOVED_SIGNALS__[tag] then __TAG_REMOVED_SIGNALS__[tag] = Signal.new("Removed_" .. tag) end
    return __TAG_REMOVED_SIGNALS__[tag]
end

-- =========================================================================
-- 11. USERINPUTSERVICE & CONTEXTACTIONSERVICE
-- =========================================================================
local UserInputService = createInstance("UserInputService", game)
UserInputService.Name = "UserInputService"
UserInputService.InputBegan = Signal.new("InputBegan")
UserInputService.InputEnded = Signal.new("InputEnded")
UserInputService.InputChanged = Signal.new("InputChanged")
UserInputService.TouchTap = Signal.new("TouchTap")
UserInputService.TouchMoved = Signal.new("TouchMoved")
UserInputService.TouchEnabled = true
UserInputService.KeyboardEnabled = true
UserInputService.MouseEnabled = true
UserInputService.GamepadEnabled = false
function UserInputService:IsKeyDown(k) return false end
function UserInputService:IsMouseButtonPressed(b) return false end
function UserInputService:GetMouseLocation() return Vector2.new(0, 0) end

local ContextActionService = createInstance("ContextActionService", game)
ContextActionService.Name = "ContextActionService"
local __BOUND_ACTIONS__ = {}
function ContextActionService:BindAction(name, fn, touchBtn, ...)
    __BOUND_ACTIONS__[name] = { fn = fn, inputs = { ... } }
end
function ContextActionService:UnbindAction(name) __BOUND_ACTIONS__[name] = nil end
function ContextActionService:GetAllBoundActionInfo() return __BOUND_ACTIONS__ end

-- =========================================================================
-- 12. SOUNDSERVICE, CHAT, TEXTCHATSERVICE, MARKETPLACE, BADGE, TELEPORT
-- =========================================================================
local SoundService = createInstance("SoundService", game)
SoundService.Name = "SoundService"
SoundService.AmbientReverb = "NoReverb"
SoundService.DistanceFactor = 3.33
SoundService.DopplerScale = 1
SoundService.RolloffScale = 1
function SoundService:PlayLocalSound(s) if s and s.Name then print("[SoundService] Playing: " .. s.Name) end end

local Chat = createInstance("Chat", game)
Chat.Name = "Chat"
function Chat:Chat(part, msg, color)
    local n = if part and part.Name then part.Name else "Unknown"
    print(string.format("[Chat - %s]: %s", n, tostring(msg)))
end
function Chat:FilterStringForBroadcast(msg) return msg end

local TextChatService = createInstance("TextChatService", game)
TextChatService.Name = "TextChatService"
TextChatService.TextChannels = createInstance("Folder", TextChatService)
TextChatService.TextChannels.Name = "TextChannels"

local MarketplaceService = createInstance("MarketplaceService", game)
MarketplaceService.Name = "MarketplaceService"
MarketplaceService.PromptPurchaseFinished = Signal.new("PromptPurchaseFinished")
MarketplaceService.PromptGamePassPurchaseFinished = Signal.new("PromptGamePassPurchaseFinished")
MarketplaceService.PromptProductPurchaseFinished = Signal.new("PromptProductPurchaseFinished")
function MarketplaceService:UserOwnsGamePassAsync(uId, passId) return true end
function MarketplaceService:GetProductInfo(id, type)
    return { Name = "Asset " .. tostring(id), PriceInRobux = 100, Creator = { Name = "Robloxian" } }
end
function MarketplaceService:PromptPurchase(p, id)
    print(string.format("[MarketplaceService] Prompt purchase of %s for %s", tostring(id), tostring(p)))
    task.delay(0.05, function() MarketplaceService.PromptPurchaseFinished:Fire(p, id, true) end)
end
function MarketplaceService:PromptGamePassPurchase(p, id)
    print(string.format("[MarketplaceService] Prompt gamepass %s for %s", tostring(id), tostring(p)))
    task.delay(0.05, function() MarketplaceService.PromptGamePassPurchaseFinished:Fire(p, id, true) end)
end

local BadgeService = createInstance("BadgeService", game)
BadgeService.Name = "BadgeService"
function BadgeService:UserHasBadgeAsync(u, b) return false end
function BadgeService:AwardBadge(u, b)
    print(string.format("[BadgeService] Awarded badge %s to %s", tostring(b), tostring(u)))
    return true
end
function BadgeService:GetBadgeInfoAsync(b) return { Name = "Badge " .. tostring(b), IsEnabled = true } end

local TeleportService = createInstance("TeleportService", game)
TeleportService.Name = "TeleportService"
TeleportService.TeleportInitFailed = Signal.new("TeleportInitFailed")
function TeleportService:Teleport(pId, p) print("[TeleportService] Teleporting to " .. tostring(pId)) end
function TeleportService:TeleportAsync(pId, ps) print("[TeleportService] TeleportAsync to " .. tostring(pId)) end

-- Other Services
local PathfindingService = createInstance("PathfindingService", game)
PathfindingService.Name = "PathfindingService"
function PathfindingService:CreatePath(params)
    local path = { Status = Enum.PathStatus.Success, Blocked = Signal.new("Blocked") }
    function path:ComputeAsync(s, f) return true end
    function path:GetWaypoints() return {} end
    return path
end

local PhysicsService = createInstance("PhysicsService", game)
PhysicsService.Name = "PhysicsService"
function PhysicsService:RegisterCollisionGroup(n) end
function PhysicsService:CollisionGroupSetCollidable(g1, g2, c) end
function PhysicsService:SetPartCollisionGroup(p, n) if p then p.CollisionGroup = n end end

local GuiService = createInstance("GuiService", game)
GuiService.Name = "GuiService"
GuiService.MenuOpened = Signal.new("MenuOpened")
GuiService.MenuClosed = Signal.new("MenuClosed")
function GuiService:GetScreenResolution() return Vector2.new(1920, 1080) end
function GuiService:GetGuiInset() return Vector2.new(0, 36), Vector2.new(0, 0) end

local LocalizationService = createInstance("LocalizationService", game)
LocalizationService.Name = "LocalizationService"
LocalizationService.RobloxLocaleId = "en-us"
LocalizationService.SystemLocaleId = "en-us"
function LocalizationService:GetCountryRegionForPlayerAsync(p) return "US" end

local PolicyService = createInstance("PolicyService", game)
PolicyService.Name = "PolicyService"
function PolicyService:GetPolicyInfoForPlayerAsync(p)
    return { ArePaidRandomItemsRestricted = false, AllowedExternalLinkReferences = {}, IsEligibleForProximityPrompts = true }
end

local ProximityPromptService = createInstance("ProximityPromptService", game)
ProximityPromptService.Name = "ProximityPromptService"
ProximityPromptService.PromptTriggered = Signal.new("PromptTriggered")
ProximityPromptService.PromptButtonHoldBegan = Signal.new("PromptButtonHoldBegan")
ProximityPromptService.PromptButtonHoldEnded = Signal.new("PromptButtonHoldEnded")

local Teams = createInstance("Teams", game)
Teams.Name = "Teams"
function Teams:GetTeams() return self:GetChildren() end

local ReplicatedStorage = createInstance("ReplicatedStorage", game)
ReplicatedStorage.Name = "ReplicatedStorage"

local ReplicatedFirst = createInstance("ReplicatedFirst", game)
ReplicatedFirst.Name = "ReplicatedFirst"
function ReplicatedFirst:RemoveDefaultLoadingScreen() end
function ReplicatedFirst:IsFinishedReplicating() return true end

local ServerStorage = createInstance("ServerStorage", game)
ServerStorage.Name = "ServerStorage"

local ServerScriptService = createInstance("ServerScriptService", game)
ServerScriptService.Name = "ServerScriptService"

local StarterGui = createInstance("StarterGui", game)
StarterGui.Name = "StarterGui"

local StarterPlayer = createInstance("StarterPlayer", game)
StarterPlayer.Name = "StarterPlayer"
local StarterPlayerScripts = createInstance("Folder", StarterPlayer)
StarterPlayerScripts.Name = "StarterPlayerScripts"
local StarterCharacterScripts = createInstance("Folder", StarterPlayer)
StarterCharacterScripts.Name = "StarterCharacterScripts"

local StarterPack = createInstance("StarterPack", game)
StarterPack.Name = "StarterPack"

-- Workspace Raycast implementation
function workspace:Raycast(origin, direction, raycastParams)
    local dirLength = direction.Magnitude
    if dirLength == 0 then return nil end

    local closestHit = nil
    local minDistance = dirLength

    local function checkPart(part)
        if not part or not part:IsA("BasePart") then return end
        if raycastParams and raycastParams.FilterDescendantsInstances then
            for _, root in ipairs(raycastParams.FilterDescendantsInstances) do
                if part == root or part:IsDescendantOf(root) then return end
            end
        end

        local pos = part.Position
        local toPart = pos - origin
        local proj = toPart:Dot(direction.Unit)
        if proj > 0 and proj < minDistance then
            local perp = (toPart - direction.Unit * proj).Magnitude
            local radius = math.max(part.Size.X, part.Size.Y, part.Size.Z) / 2
            if perp <= radius then
                minDistance = proj
                closestHit = part
            end
        end
    end

    for _, desc in ipairs(workspace:GetDescendants()) do
        checkPart(desc)
    end

    if closestHit then
        return {
            Instance = closestHit,
            Position = origin + direction.Unit * minDistance,
            Normal = Vector3.new(0, 1, 0),
            Material = closestHit.Material or Enum.Material.Plastic,
            Distance = minDistance,
        }
    end
    return nil
end

-- =========================================================================
-- 13. Service Lookup Registry & Context Boundary Enforcement
-- =========================================================================
local _services = {
    Workspace = workspace,
    workspace = workspace,
    Players = Players,
    Lighting = Lighting,
    RunService = RunService,
    TweenService = TweenService,
    HttpService = HttpService,
    DataStoreService = DataStoreService,
    Debris = Debris,
    CollectionService = CollectionService,
    UserInputService = UserInputService,
    ContextActionService = ContextActionService,
    MarketplaceService = MarketplaceService,
    BadgeService = BadgeService,
    TeleportService = TeleportService,
    SoundService = SoundService,
    Chat = Chat,
    TextChatService = TextChatService,
    PathfindingService = PathfindingService,
    PhysicsService = PhysicsService,
    GuiService = GuiService,
    LocalizationService = LocalizationService,
    PolicyService = PolicyService,
    ProximityPromptService = ProximityPromptService,
    Teams = Teams,
    ReplicatedStorage = ReplicatedStorage,
    ReplicatedFirst = ReplicatedFirst,
    ServerStorage = ServerStorage,
    ServerScriptService = ServerScriptService,
    StarterGui = StarterGui,
    StarterPlayer = StarterPlayer,
    StarterPack = StarterPack,
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

-- Support direct dot indexing on game (e.g. game.Workspace, game.Lighting, game.TweenService)
local gameMeta = getmetatable(game)
local oldGameIndex = gameMeta.__index
gameMeta.__index = function(self, key)
    if _services[key] then return _services[key] end
    return oldGameIndex(self, key)
end

-- =========================================================================
-- 14. Task Library & Yielding
-- =========================================================================
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

wait = task.wait
spawn = task.spawn
delay = task.delay

-- =========================================================================
-- 15. ModuleScript Require Implementation
-- =========================================================================
local _orig_require = require
function require(target)
    local name = nil
    if typeof(target) == "string" then
        name = target
    elseif typeof(target) == "table" and target.Name then
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

-- =========================================================================
-- 16. Custom typeof Implementation
-- =========================================================================
local _lua_type = type
function typeof(v)
    if v == nil then return "nil" end
    if _lua_type(v) == "table" then
        if rawget(v, "_props") and rawget(v, "_props").ClassName then return "Instance" end
        if rawget(v, "_name") == "Signal" then return "RBXScriptSignal" end
        if rawget(v, "_group") then return "EnumItem" end
        if rawget(v, "_name") and Enum[rawget(v, "_name")] then return "Enum" end
        if v.X and v.Y and v.Z then return "Vector3" end
        if v.X and v.Y and (not v.Z) then
            if type(v.X) == "table" and v.X.Scale ~= nil then return "UDim2" end
            return "Vector2"
        end
        if v.R and v.G and v.B then return "Color3" end
        if v.Position and v.LookVector then return "CFrame" end
        if v.Scale and v.Offset then return "UDim" end
        if v.Time and v.EasingStyle then return "TweenInfo" end
        if v.Number and v.Color and v.r then return "BrickColor" end
        if v.Origin and v.Direction then return "Ray" end
        if v.Min and v.Max and v.Width then return "Rect" end
        if v.Min and v.Max then return "NumberRange" end
        if v.FilterDescendantsInstances and v.FilterType then return "RaycastParams" end
    end
    return _lua_type(v)
end

-- =========================================================================
-- 17. Hierarchy Serializer for Explorer Sync
-- =========================================================================
function __serialize_node(inst)
    local kids = {}
    for i, child in ipairs(inst:GetChildren()) do
        table.insert(kids, __serialize_node(child))
    end
    local p = rawget(inst, "_props")
    local propsCopy = {}
    for k, v in pairs(p) do
        if k ~= "Parent" then
            local tv = typeof(v)
            if tv == "Vector3" then
                propsCopy[k] = string.format("Vector3(%g, %g, %g)", v.X, v.Y, v.Z)
            elseif tv == "Color3" then
                propsCopy[k] = string.format("Color3(%g, %g, %g)", v.R, v.G, v.B)
            elseif tv == "CFrame" then
                propsCopy[k] = string.format("CFrame(%g, %g, %g)", v.X, v.Y, v.Z)
            elseif tv == "EnumItem" then
                propsCopy[k] = tostring(v)
            elseif tv == "number" or tv == "string" or tv == "boolean" then
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
