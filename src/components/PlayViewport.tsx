import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faStop, 
  faRotateRight, 
  faCommentDots, 
  faArrowUp,
  faServer,
  faUser,
  faXmark,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { RobloxWebGLEngine } from '../engine/roblox-webgl/webgl-engine';
import { RobloxSimulationWorld } from '../engine/roblox-3d/simulation';
import type { PlayMode } from '../engine/roblox-3d/simulation';
import type { ConsoleMessage } from '../types';
import './PlayViewport.css';

export interface PlayViewportProps {
  world?: RobloxSimulationWorld;
  messages: ConsoleMessage[];
  mode: PlayMode;
  onStop: () => void;
  onToggleMode: (newMode: PlayMode) => void;
  onSendMessage?: (text: string) => void;
  engineRefProp?: React.MutableRefObject<RobloxWebGLEngine | null>;
}

export const PlayViewport: React.FC<PlayViewportProps> = ({
  messages,
  mode,
  onStop,
  onToggleMode,
  onSendMessage,
  engineRefProp,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RobloxWebGLEngine | null>(null);

  // Studio UI states
  const [isPaused, setIsPaused] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [isEscMenuOpen, setIsEscMenuOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<'client' | 'server'>('client');
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState(12);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerName, setPlayerName] = useState('Player1');

  // Chat message input state
  const [chatInputText, setChatInputText] = useState('');

  // Camera dragging state
  const isOrbitingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile joystick touch state
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickThumbOffset, setJoystickThumbOffset] = useState({ x: 0, y: 0 });
  const [isJumpActive, setIsJumpActive] = useState(false);

  // Setup WebGL Engine
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new RobloxWebGLEngine(container);
    engineRef.current = engine;
    if (engineRefProp) {
      engineRefProp.current = engine;
    }

    engine.mode = mode;
    engine.isPaused = isPaused;

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engine.resize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Sync stats interval
    const statsInterval = setInterval(() => {
      if (engineRef.current) {
        setFps(engineRef.current.fps);
        setPing(engineRef.current.ping);
        setPlayerHealth(Math.round(engineRef.current.player.health));
        setPlayerName(engineRef.current.player.name);
      }
    }, 250);

    return () => {
      clearInterval(statsInterval);
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
      if (engineRefProp) {
        engineRefProp.current = null;
      }
    };
  }, []);

  // Sync mode changes to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.mode = mode;
    }
  }, [mode]);

  // Sync pause state to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isPaused = isPaused;
    }
  }, [isPaused]);

  // Keyboard navigation & Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Escape') {
        setIsEscMenuOpen((prev) => !prev);
        return;
      }

      const eng = engineRef.current;
      if (!eng) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') eng.input.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') eng.input.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') eng.input.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') eng.input.right = true;
      if (code === 'Space') {
        e.preventDefault();
        eng.input.jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') eng.input.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') eng.input.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') eng.input.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') eng.input.right = false;
      if (code === 'Space') eng.input.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse camera orbit & zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isOrbitingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOrbitingRef.current || !engineRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    engineRef.current.rotateCamera(dx, dy);
  };

  const handleMouseUp = () => {
    isOrbitingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (engineRef.current) {
      engineRef.current.zoomCamera(e.deltaY * 0.1);
    }
  };

  // Touch Camera drag
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = Array.from(e.touches).find((t) => t.identifier !== joystickTouchIdRef.current);
    if (!touch || !engineRef.current) return;

    const dx = touch.clientX - lastMousePosRef.current.x;
    const dy = touch.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    engineRef.current.rotateCamera(dx, dy);
  };

  // Virtual Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    joystickTouchIdRef.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null || !engineRef.current) return;
    const touch = Array.from(e.touches).find((t) => t.identifier === joystickTouchIdRef.current);
    if (!touch) return;

    const maxRadius = 38;
    const dx = touch.clientX - joystickCenterRef.current.x;
    const dy = touch.clientY - joystickCenterRef.current.y;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    setJoystickThumbOffset({ x: clampedX, y: clampedY });
    engineRef.current.input.joystickX = clampedX / maxRadius;
    engineRef.current.input.joystickY = clampedY / maxRadius;
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    joystickTouchIdRef.current = null;
    setJoystickThumbOffset({ x: 0, y: 0 });
    if (engineRef.current) {
      engineRef.current.input.joystickX = 0;
      engineRef.current.input.joystickY = 0;
    }
  };

  // Jump Button Touch/Click
  const handleJumpPress = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.input.jump = true;
    }
    setIsJumpActive(true);
  }, []);

  const handleJumpRelease = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.input.jump = false;
    }
    setIsJumpActive(false);
  }, []);

  // Respawn Player
  const handleRespawn = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.respawnCharacter();
      setPlayerHealth(engineRef.current.player.maxHealth);
    }
    setIsEscMenuOpen(false);
  }, []);

  // Send chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInputText.trim();
    if (!text) return;
    if (onSendMessage) {
      onSendMessage(text);
    }
    setChatInputText('');
  };

  return (
    <div className="play-viewport-container">
      {/* Studio Simulation Top Ribbon */}
      <div className="studio-play-ribbon">
        <div className="studio-ribbon-left">
          {/* Iconic Roblox Tilt Square Logo - Toggles Esc Menu */}
          <div 
            className="roblox-logo-icon" 
            onClick={() => setIsEscMenuOpen((prev) => !prev)}
            title="Click or press Esc for Roblox Studio Experience Menu"
          >
            <svg viewBox="0 0 100 100" className="roblox-logo-svg">
              <rect
                x="15"
                y="15"
                width="70"
                height="70"
                rx="14"
                fill="#dcdde1"
                transform="rotate(-15 50 50)"
              />
              <rect
                x="36"
                y="36"
                width="28"
                height="28"
                rx="5"
                fill="#18191f"
                transform="rotate(-15 50 50)"
              />
            </svg>
          </div>

          <span
            className={`studio-mode-pill ${mode === 'run' ? 'run-mode' : ''}`}
            onClick={() => onToggleMode(mode === 'solo' ? 'run' : 'solo')}
            title="Click to toggle between Play Solo (Character) and Run (Server only)"
            style={{ cursor: 'pointer' }}
          >
            {mode === 'solo' ? '▶ PLAY SOLO' : '⚙️ RUN (SERVER)'}
          </span>
        </div>

        {/* Center Actions: Pause, Stop, Mode, Context */}
        <div className="studio-ribbon-center">
          <button
            type="button"
            className="studio-ribbon-btn"
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            <FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            className="studio-ribbon-btn btn-stop"
            onClick={onStop}
            title="Stop Play Simulation and return to code editor"
          >
            <FontAwesomeIcon icon={faStop} />
            <span>Stop</span>
          </button>

          {/* Switch Client / Server Context */}
          <button
            type="button"
            className="studio-ribbon-btn context-toggle"
            onClick={() =>
              setCurrentContext((prev) => (prev === 'client' ? 'server' : 'client'))
            }
            title="Toggle Studio View Context"
          >
            <FontAwesomeIcon icon={currentContext === 'client' ? faUser : faServer} />
            <span>Current: {currentContext === 'client' ? 'Client' : 'Server'}</span>
          </button>

          {/* Reset Character */}
          {mode === 'solo' && (
            <button
              type="button"
              className="studio-ribbon-btn"
              onClick={handleRespawn}
              title="Respawn Player Character"
            >
              <FontAwesomeIcon icon={faRotateRight} />
              <span>Respawn</span>
            </button>
          )}
        </div>

        {/* Right Stats */}
        <div className="studio-ribbon-right">
          <div className="studio-stat-item">
            <span>FPS:</span>
            <span className="studio-stat-value">{fps}</span>
          </div>
          <div className="studio-stat-item">
            <span>Ping:</span>
            <span className="studio-stat-value">{ping}ms</span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Area */}
      <div
        className="play-canvas-area"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Three.js WebGL canvas mounts inside this container */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        />

        {/* In-Game Top Bar Overlay */}
        <div className="ingame-topbar-overlay">
          <div className="ingame-topbar-left">
            {/* Chat button */}
            <button
              type="button"
              className="roblox-ingame-btn"
              onClick={() => setShowChat((prev) => !prev)}
              title="Toggle In-Game Chat"
            >
              <FontAwesomeIcon icon={faCommentDots} />
            </button>
          </div>

          {/* Leaderstats Leaderboard (Top Right) */}
          <div className="ingame-topbar-right">
            <div className="roblox-leaderboard">
              <div className="roblox-leaderboard-header">
                <span>Players</span>
                <span>Health</span>
              </div>
              <div className="roblox-leaderboard-row">
                <span>{playerName}</span>
                <span style={{ color: playerHealth > 25 ? '#2ed573' : '#ff4757' }}>
                  {playerHealth}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* In-Game Chat Box */}
        {showChat && (
          <div className="ingame-chat-box">
            <div style={{ color: '#f1c40f', fontWeight: 700, fontSize: '10px' }}>
              System: Welcome to Roblox Studio Simulation!
            </div>
            {messages.slice(-8).map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.type}`}>
                {msg.source ? `[${msg.source}]: ` : ''}
                {msg.text}
              </div>
            ))}

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChat} className="chat-input-row">
              <input
                type="text"
                placeholder="To chat, click here or press /"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                className="chat-input"
              />
              <button type="submit" className="chat-send-btn" title="Send Chat">
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Touch Controls (Virtual Joystick + Jump Button) */}
        <div className="mobile-controls-overlay">
          {/* Virtual Thumbstick */}
          <div
            className="virtual-joystick-base"
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
          >
            <div
              className="virtual-joystick-thumb"
              style={{
                transform: `translate(${joystickThumbOffset.x}px, ${joystickThumbOffset.y}px)`,
              }}
            />
          </div>

          {/* Jump Button */}
          <button
            type="button"
            className={`virtual-jump-btn ${isJumpActive ? 'active' : ''}`}
            onTouchStart={handleJumpPress}
            onTouchEnd={handleJumpRelease}
            onMouseDown={handleJumpPress}
            onMouseUp={handleJumpRelease}
            title="Jump"
          >
            <FontAwesomeIcon icon={faArrowUp} />
            <span className="jump-btn-label">Jump</span>
          </button>
        </div>

        {/* Keyboard / Orbit Controls Hint */}
        <div className="camera-controls-hint">
          <span>WASD / Joystick to Walk • Spacebar to Jump • Drag to Orbit Camera • Esc for Menu</span>
        </div>

        {/* Authentic Roblox Esc Pause Menu Modal */}
        {isEscMenuOpen && (
          <div className="roblox-esc-menu-overlay" onClick={() => setIsEscMenuOpen(false)}>
            <div className="roblox-esc-menu-card" onClick={(e) => e.stopPropagation()}>
              <div className="roblox-esc-header">
                <div className="roblox-esc-title-group">
                  <div className="roblox-logo-icon" style={{ width: 28, height: 28 }}>
                    <svg viewBox="0 0 100 100" className="roblox-logo-svg">
                      <rect
                        x="15"
                        y="15"
                        width="70"
                        height="70"
                        rx="14"
                        fill="#dcdde1"
                        transform="rotate(-15 50 50)"
                      />
                      <rect
                        x="36"
                        y="36"
                        width="28"
                        height="28"
                        rx="5"
                        fill="#18191f"
                        transform="rotate(-15 50 50)"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="roblox-esc-title">Roblox Studio Simulation</div>
                    <div className="roblox-esc-subtitle">Baseplate • Three.js WebGL Engine</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="roblox-esc-close-btn"
                  onClick={() => setIsEscMenuOpen(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="roblox-esc-body">
                <button
                  type="button"
                  className="roblox-esc-action-btn btn-resume"
                  onClick={() => setIsEscMenuOpen(false)}
                >
                  <span>Resume Experience</span>
                </button>

                {mode === 'solo' && (
                  <button
                    type="button"
                    className="roblox-esc-action-btn"
                    onClick={handleRespawn}
                  >
                    <FontAwesomeIcon icon={faRotateRight} />
                    <span>Reset Character</span>
                  </button>
                )}

                <button
                  type="button"
                  className="roblox-esc-action-btn"
                  onClick={() => {
                    setCurrentContext((prev) => (prev === 'client' ? 'server' : 'client'));
                    setIsEscMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={currentContext === 'client' ? faServer : faUser} />
                  <span>Switch to {currentContext === 'client' ? 'Server View' : 'Client View'}</span>
                </button>

                <button
                  type="button"
                  className="roblox-esc-action-btn btn-leave"
                  onClick={() => {
                    setIsEscMenuOpen(false);
                    onStop();
                  }}
                >
                  <FontAwesomeIcon icon={faStop} />
                  <span>Leave & Stop Simulation</span>
                </button>
              </div>

              <div className="roblox-esc-footer">
                Luau WebAssembly VM • 60 FPS WebGL Renderer
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayViewport;
