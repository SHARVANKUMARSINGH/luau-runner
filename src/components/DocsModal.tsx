import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faBan, 
  faCode, 
  faServer, 
  faDesktop, 
  faPuzzlePiece,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import './Modal.css';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose, isDark }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'apis' | 'scripts' | 'unsupported'>('overview');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container modal-lg ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={faBook} className="modal-title-icon" />
            <span>Roblox Simulator & Luau Reference</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="docs-nav-tabs">
          <button 
            className={`docs-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`docs-nav-btn ${activeTab === 'scripts' ? 'active' : ''}`}
            onClick={() => setActiveTab('scripts')}
          >
            4 Script Types
          </button>
          <button 
            className={`docs-nav-btn ${activeTab === 'apis' ? 'active' : ''}`}
            onClick={() => setActiveTab('apis')}
          >
            Supported APIs
          </button>
          <button 
            className={`docs-nav-btn ${activeTab === 'unsupported' ? 'active' : ''}`}
            onClick={() => setActiveTab('unsupported')}
          >
            Unsupported Features
          </button>
        </div>

        <div className="modal-body docs-body">
          {activeTab === 'overview' && (
            <div className="docs-section">
              <h3>Genuine Luau WebAssembly Runtime</h3>
              <p>
                This application executes your code inside a real browser-compatible <strong>Luau WebAssembly VM</strong> powered by <code>luau-web</code>.
                It is <strong>not</strong> translated to JavaScript, and results are never faked.
              </p>

              <h4>Luau Language Features Supported:</h4>
              <ul className="docs-list">
                <li><strong>Gradual Type Annotations:</strong> <code>type Player = &#123; name: string, level: number &#125;</code></li>
                <li><strong>String Interpolation:</strong> <code>\`Hello &#123;player.name&#125;!\`</code></li>
                <li><strong>Compound Assignment Operators:</strong> <code>+=</code>, <code>-=</code>, <code>*=</code>, <code>/=</code>, <code>//=</code>, <code>%=</code>, <code>^=</code>, <code>..=</code></li>
                <li><strong>If-Expressions:</strong> <code>local status = if health &gt; 0 then "Alive" else "Dead"</code></li>
                <li><strong>Generalized Iteration:</strong> <code>for i, v in ipairs(items) do ... end</code> and <code>for k, v in pairs(table) do ... end</code></li>
                <li><strong>Standard Luau Libraries:</strong> <code>math</code>, <code>string</code>, <code>table</code>, <code>coroutine</code>, <code>os.clock</code>, <code>tick</code>, <code>time</code></li>
              </ul>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="docs-section">
              <h3>The Four Roblox Script Types</h3>
              <p>Every script belongs to one of the four genuine script types with independent contexts:</p>

              <div className="script-type-doc-card">
                <div className="card-heading">
                  <FontAwesomeIcon icon={faCode} className="type-icon type-Script" />
                  <strong>1. Script (Standard)</strong>
                </div>
                <p>Runs in a general Luau context. Accessible to both simulated server and client utilities. Useful for standalone algorithms, data structures, and general testing.</p>
              </div>

              <div className="script-type-doc-card">
                <div className="card-heading">
                  <FontAwesomeIcon icon={faServer} className="type-icon type-ServerScript" />
                  <strong>2. Server Script</strong>
                </div>
                <p>Simulates server-side execution. Has full access to <code>ServerStorage</code>, <code>ServerScriptService</code>, <code>workspace</code>, and server events.</p>
              </div>

              <div className="script-type-doc-card">
                <div className="card-heading">
                  <FontAwesomeIcon icon={faDesktop} className="type-icon type-LocalScript" />
                  <strong>3. Local Script</strong>
                </div>
                <p>Simulates client-side execution. Has access to <code>Players.LocalPlayer</code> and <code>StarterGui</code>. Client-server boundaries are enforced: accessing <code>ServerStorage</code> or <code>ServerScriptService</code> warns of security violation.</p>
              </div>

              <div className="script-type-doc-card">
                <div className="card-heading">
                  <FontAwesomeIcon icon={faPuzzlePiece} className="type-icon type-ModuleScript" />
                  <strong>4. Module Script</strong>
                </div>
                <p>Returns a table or function. When required using <code>require("ModuleScript")</code> or <code>require(instance)</code>, it executes once in Luau VM and caches its returned export for subsequent calls.</p>
              </div>
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="docs-section">
              <h3>Implemented Roblox DataModel APIs</h3>
              <div className="api-grid">
                <div className="api-item">
                  <span className="api-name"><code>game:GetService(name)</code></span>
                  <span className="api-desc">Returns Workspace, Players, TweenService, HttpService, DataStoreService, CollectionService, Debris, UserInputService, MarketplaceService, Lighting, RunService, and more.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>TweenService:Create(...)</code></span>
                  <span className="api-desc"><strong>Fully operational!</strong> Smoothly interpolates Position, Size, Color3, CFrame, Transparency over time with easing curves and fires <code>Completed</code> event.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>HttpService</code></span>
                  <span className="api-desc">Working <code>:JSONEncode(tbl)</code>, <code>:JSONDecode(str)</code>, <code>:GenerateGUID()</code>, and <code>:UrlEncode(str)</code>.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>DataStoreService</code></span>
                  <span className="api-desc">Working <code>:GetDataStore(name)</code> with <code>:GetAsync()</code>, <code>:SetAsync()</code>, <code>:UpdateAsync()</code>, and <code>:IncrementAsync()</code>.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>CollectionService & Debris</code></span>
                  <span className="api-desc">Tag-based grouping with <code>:AddTag()</code>, <code>:HasTag()</code>, <code>:GetTagged()</code>, plus scheduled cleanup with <code>Debris:AddItem(item, time)</code>.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>Instance.new(className, parent?)</code></span>
                  <span className="api-desc">Instantiates Part, MeshPart, Model, Folder, Humanoid, Tool, Sound, RemoteEvent, ScreenGui, Frame, TextLabel, Value objects.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>workspace & Raycast</code></span>
                  <span className="api-desc">Root Workspace with <code>workspace:Raycast(origin, dir, params)</code>, Gravity, and CurrentCamera.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>task Library</code></span>
                  <span className="api-desc"><code>task.wait(sec)</code> (yields via Asyncify), <code>task.spawn(fn)</code>, <code>task.delay(sec, fn)</code>, <code>task.defer(fn)</code>.</span>
                </div>
                <div className="api-item">
                  <span className="api-name"><code>Vector3, Vector2, CFrame, Color3, UDim2, TweenInfo</code></span>
                  <span className="api-desc">Complete geometric, color, and animation parameter types with mathematical operators and methods.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'unsupported' && (
            <div className="docs-section">
              <h3>Notice: What Is Not Implemented</h3>
              <p>This is a code-only runner and educational simulator. It is <strong>not</strong> a full game engine client.</p>

              <div className="unsupported-list">
                <div className="unsupported-item">
                  <FontAwesomeIcon icon={faBan} className="unsupported-icon" />
                  <div>
                    <strong>3D Rendering & Viewport:</strong> No WebGL 3D canvas, mesh rendering, or terrain shaders. The simulated hierarchy is viewed exclusively in the Explorer tree.
                  </div>
                </div>
                <div className="unsupported-item">
                  <FontAwesomeIcon icon={faBan} className="unsupported-icon" />
                  <div>
                    <strong>Physics Simulation:</strong> Part collision impulses, raycasting, joints, and physical gravity are not simulated.
                  </div>
                </div>
                <div className="unsupported-item">
                  <FontAwesomeIcon icon={faBan} className="unsupported-icon" />
                  <div>
                    <strong>Real Roblox Servers & Networking:</strong> RemoteEvents simulate client-server signaling locally in-memory; no actual WebSocket connections to Roblox servers.
                  </div>
                </div>
                <div className="unsupported-item">
                  <FontAwesomeIcon icon={faBan} className="unsupported-icon" />
                  <div>
                    <strong>Cloud Services:</strong> <code>DataStoreService</code>, <code>HttpService</code> (real external HTTP calls), and <code>MarketplaceService</code> are not backed by Roblox cloud servers.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocsModal;
