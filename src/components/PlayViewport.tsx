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
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { Roblox3DRenderer } from '../engine/roblox-3d/renderer';
import { RobloxSimulationWorld } from '../engine/roblox-3d/simulation';
import type { PlayMode, SimulationInput } from '../engine/roblox-3d/simulation';
import type { ConsoleMessage } from '../types';
import './PlayViewport.css';

interface PlayViewportProps {
  world: RobloxSimulationWorld;
  messages: ConsoleMessage[];
  mode: PlayMode;
  onStop: () => void;
  onToggleMode: (newMode: PlayMode) => void;
}

export const PlayViewport: React.FC<PlayViewportProps> = ({
  world,
  messages,
  mode,
  onStop,
  onToggleMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Roblox3DRenderer | null>(null);

  // Studio UI states
  const [isPaused, setIsPaused] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [currentContext, setCurrentContext] = useState<'client' | 'server'>('client');
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState(12);

  // Active inputs
  const inputRef = useRef<SimulationInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    joystickX: 0,
    joystickY: 0,
  });

  // Camera dragging state
  const isOrbitingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile joystick touch state
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickThumbOffset, setJoystickThumbOffset] = useState({ x: 0, y: 0 });
  const [isJumpActive, setIsJumpActive] = useState(false);

  // Setup Canvas & Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (rendererRef.current) {
        rendererRef.current.resize(canvas.width, canvas.height);
      }
    };

    rendererRef.current = new Roblox3DRenderer(ctx, canvas.width, canvas.height);
    updateSize();

    window.addEventListener('resize', updateSize);

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      world.mode = mode;
      world.isPaused = isPaused;
      world.step(dt, inputRef.current);

      if (rendererRef.current) {
        rendererRef.current.render(
          world.parts,
          mode === 'solo' ? world.character : null,
          world.camera.eye,
          world.camera.target
        );
      }

      setFps(world.fps);
      setPing(world.ping);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateSize);
    };
  }, [world, mode, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.right = true;
      if (code === 'Space') {
        e.preventDefault();
        inputRef.current.jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.right = false;
      if (code === 'Space') inputRef.current.jump = false;
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
    // Both right click and left click on canvas orbit camera
    isOrbitingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOrbitingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    world.rotateCamera(dx, dy);
  };

  const handleMouseUp = () => {
    isOrbitingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    world.zoomCamera(e.deltaY * 0.1);
  };

  // Touch Camera drag
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Ignore if touch belongs to joystick
    const touch = Array.from(e.touches).find((t) => t.identifier !== joystickTouchIdRef.current);
    if (!touch) return;

    const dx = touch.clientX - lastMousePosRef.current.x;
    const dy = touch.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    world.rotateCamera(dx, dy);
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
    if (joystickTouchIdRef.current === null) return;
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
    inputRef.current.joystickX = clampedX / maxRadius;
    inputRef.current.joystickY = clampedY / maxRadius;
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    joystickTouchIdRef.current = null;
    setJoystickThumbOffset({ x: 0, y: 0 });
    inputRef.current.joystickX = 0;
    inputRef.current.joystickY = 0;
  };

  // Jump Button Touch/Click
  const handleJumpPress = useCallback(() => {
    inputRef.current.jump = true;
    setIsJumpActive(true);
  }, []);

  const handleJumpRelease = useCallback(() => {
    inputRef.current.jump = false;
    setIsJumpActive(false);
  }, []);

  return (
    <div className="play-viewport-container">
      {/* Studio Simulation Top Ribbon */}
      <div className="studio-play-ribbon">
        <div className="studio-ribbon-left">
          {/* Iconic Roblox Tilt Square Logo */}
          <div className="roblox-logo-icon" title="Roblox Studio Engine">
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
              onClick={() => world.respawnCharacter()}
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

      {/* 3D Canvas Area */}
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
        <canvas ref={canvasRef} className="roblox-3d-canvas" />

        {/* In-Game Top Bar Overlay */}
        <div className="ingame-topbar-overlay">
          <div className="ingame-topbar-left">
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
                <span>{world.character.name}</span>
                <span style={{ color: '#2ed573' }}>
                  {Math.round(world.character.health)}/100
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
          <span>WASD / Joystick to Walk • Spacebar / Button to Jump • Drag to Orbit Camera</span>
        </div>
      </div>
    </div>
  );
};

export default PlayViewport;
