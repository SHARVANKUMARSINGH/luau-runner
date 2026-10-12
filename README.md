# Online Luau Runner — Professional Roblox Scripting IDE

A professional, online Luau code runner and Roblox scripting environment built with **React**, **Vite**, **TypeScript**, and a real **Luau WebAssembly runtime** (`luau-web`).

Deployable directly to **Cloudflare Pages**, installable as a **PWA (Progressive Web App)** from Google Chrome on desktop and Android mobile devices.

---

## ✨ Features

- **Genuine Luau WebAssembly Runtime**:
  - Direct execution via WebAssembly compiled Luau (`luau-web`).
  - No translation to JavaScript; no faked results.
  - Supports Luau syntax: gradual type annotations, string interpolation (`` `...` ``), if-expressions, compound operators (`+=`, `-=`), generalized iteration.
  - Asynchronous yielding via `task.wait()` powered by Emscripten Asyncify.
  - Task scheduling: `task.wait()`, `task.spawn()`, `task.delay()`, `task.defer()`.
  - Coroutine library (`coroutine.create`, `coroutine.yield`, `coroutine.resume`).
  - Native line-numbered syntax and runtime error reporting.

- **Roblox DataModel Simulator**:
  - Services: `Workspace`, `Players`, `ReplicatedStorage`, `ServerStorage`, `ServerScriptService`, `StarterGui`, `StarterPlayer`, `Lighting`, `RunService`.
  - Global references: `game`, `workspace`, `Instance.new(className, parent)`.
  - Instance properties and methods: `Name`, `ClassName`, `Parent`, `Size`, `Position`, `Anchored`, `CanCollide`, `Value`, `Text`, `FindFirstChild()`, `WaitForChild()`, `GetChildren()`, `GetDescendants()`, `IsA()`, `Clone()`, `Destroy()`.
  - Signal system: `Changed`, `ChildAdded`, `ChildRemoved`, `Connect()`, `Once()`, `Wait()`.
  - Client-Server Remotes: `RemoteEvent:FireServer()`, `:FireClient()`, `:FireAllClients()`, `.OnServerEvent`, `.OnClientEvent`.
  - Math types: `Vector3`, `CFrame`, `Color3`, `UDim2`.
  - ModuleScript `require()` loading and caching.

- **Four Dedicated Script Types**:
  1. **Script (Standard)**: Neutral context for general algorithms.
  2. **Server Script**: Runs in simulated server context with access to `ServerStorage`.
  3. **Local Script**: Runs in simulated client context with `Players.LocalPlayer` and `StarterGui`.
  4. **Module Script**: Returns a table or value reusable via `require()`.
  - Create additional custom script files assigned to any of these four types.

- **Roblox Explorer Panel (Hidden by Default)**:
  - Toggled exclusively via the small **Globe / Earth icon (`faGlobe`)** in the runner toolbar.
  - Displays the live simulated hierarchy of Workspace, Services, and created Instances.
  - Inspect Instance properties (`ClassName`, `Name`, `Position`, `Size`, `Value`, etc.) live.
  - **No 3D viewport**: purely focused on code execution and data hierarchy.

- **Custom CodeMirror 6 Editor Engine (No Monaco)**:
  - Official Luau language syntax highlighting (`@fazelstudio/codemirror-lang-luau`).
  - IntelliSense & context-aware autocomplete for Luau keywords and Roblox APIs.
  - Auto-closing brackets, parentheses, and quotes.
  - Matching bracket highlight, folding, indentation guides, search & replace (`Ctrl+F`).
  - Shortcuts: `Ctrl+Enter` / `Cmd+Enter` to run, `Ctrl+S` to save.

- **Collapsible Console Output**:
  - Captures real `print()`, `warn()`, `error()`, and system logs with timestamps.
  - Filters: All, Output, Warnings, Errors.
  - Copy to clipboard and Clear actions.

- **Progressive Web App (PWA)**:
  - Installable in Google Chrome on Desktop, Chrome on Android, and iOS Safari.
  - Responsive dark and light themes (Catppuccin Mocha & Latte).

---

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Start Local Development Server
\`\`\`bash
npm run dev
\`\`\`
Open the local URL in your browser (e.g. `http://localhost:5173`).

### 3. Build for Production
```bash
npm run build
```
The optimized production bundle is generated in the `dist/` directory.

### 4. Push to GitHub (Automated)
To automatically create a new repository on your GitHub account (named `Luau-runner`) and push all project files:
```bash
npm run push-github
```
*Or directly:*
```bash
./push-to-github.sh
```
The script will prompt for your **GitHub Personal Access Token**, create the repository on your account via GitHub's REST API, initialize git, commit all files, push the `main` branch, and safely clean the token from git configuration.

---

## ☁️ Deployment to Cloudflare Pages

This application is ready to deploy directly to Cloudflare Pages:

### Method A: Git Integration
1. Push this repository to GitHub or GitLab.
2. In Cloudflare Dashboard, navigate to **Compute (Workers) > Pages**.
3. Select **Connect to Git** and choose the repository.
4. Set the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

### Method B: Direct Upload via Wrangler
\`\`\`bash
npx wrangler pages deploy dist --project-name luau-runner
\`\`\`

---

## 📱 Installing as a PWA

1. Open the runner in Google Chrome on your PC, Mac, or Android device.
2. In the Chrome URL bar (desktop) or menu (Android), click **Install App** or **Add to Home screen**.
3. The app will launch in a standalone, distraction-free window.

---

## 📦 Project Structure

\`\`\`
lauau/
├── public/
│   ├── manifest.webmanifest   # PWA Web App Manifest
│   ├── sw.js                  # Service Worker for PWA
│   └── luau-runner.zip        # Exportable package archive
├── src/
│   ├── components/
│   │   ├── CodeEditor.tsx     # CodeMirror 6 Luau editor
│   │   ├── Console.tsx        # Collapsible output console
│   │   ├── DocsModal.tsx      # Comprehensive API & simulator docs
│   │   ├── ExamplesModal.tsx  # Preset working script templates
│   │   ├── Explorer.tsx       # Simulated hierarchy tree & inspector
│   │   ├── NewScriptModal.tsx # Dialog to create new script files
│   │   ├── RenameModal.tsx    # Dialog to rename scripts
│   │   ├── ScriptTabBar.tsx   # Tabs for the 4 script types
│   │   ├── SettingsModal.tsx  # Font size, timeout, theme preferences
│   │   └── Toolbar.tsx        # Real Font Awesome runner toolbar
│   ├── editor/
│   │   ├── completions.ts     # Luau & Roblox autocomplete database
│   │   └── setup.ts           # CodeMirror 6 extensions & theme setup
│   ├── engine/
│   │   ├── luau-engine.ts     # luau-web WASM execution runner
│   │   ├── roblox-preamble.ts # Luau-native DataModel simulator runtime
│   │   └── roblox-sim.ts      # TypeScript DataModel & instance tree
│   ├── types/
│   │   └── index.ts           # Central TypeScript type definitions
│   ├── utils/
│   │   ├── scripts.ts         # Default scripts & example templates
│   │   └── storage.ts         # LocalStorage persistence manager
│   ├── App.tsx                # Main IDE coordinator
│   ├── App.css                # Layout & theme variables
│   ├── index.css              # Reset & typography
│   └── main.tsx               # React root mount & SW registration
├── index.html                 # HTML shell with favicon & manifest
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite bundler configuration
\`\`\`
