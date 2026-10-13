import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComputerMouse, 
  faArrowPointer, 
  faChevronUp, 
  faChevronDown, 
  faMinus, 
  faArrowsUpDownLeftRight,
  faHandPointer
} from '@fortawesome/free-solid-svg-icons';
import './VirtualMouse.css';

interface VirtualMouseProps {
  isEnabled: boolean;
  isDark: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  isRightClick: boolean;
}

export const VirtualMouse: React.FC<VirtualMouseProps> = ({ isEnabled, isDark }) => {
  // Cursor coordinate state (starts at center of screen)
  const [cursorPos, setCursorPos] = useState(() => ({
    x: Math.max(20, Math.floor(window.innerWidth / 2)),
    y: Math.max(20, Math.floor(window.innerHeight / 2)),
  }));

  // Trackpad floating position
  const [panelPos, setPanelPos] = useState(() => ({
    x: Math.max(10, window.innerWidth - 280),
    y: Math.max(10, window.innerHeight - 260),
  }));

  const [isMinimized, setIsMinimized] = useState(false);
  const [isTouchingTouchpad, setIsTouchingTouchpad] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isClickingVisual, setIsClickingVisual] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Refs for touch gesture math
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingPanelRef = useRef(false);
  const panelDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cursorPosRef = useRef(cursorPos);
  cursorPosRef.current = cursorPos;

  // Clamp helper
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  // Trigger click ripple effect
  const addRipple = useCallback((x: number, y: number, isRightClick = false) => {
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y, isRightClick }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 400);
  }, []);

  // Dispatch synthetic mouse / pointer event to whatever element is under the cursor
  const dispatchSyntheticEvent = useCallback(
    (
      type: 'click' | 'mousedown' | 'mouseup' | 'contextmenu',
      button = 0,
      overrideX?: number,
      overrideY?: number
    ) => {
      const x = overrideX ?? cursorPosRef.current.x;
      const y = overrideY ?? cursorPosRef.current.y;

      const target = document.elementFromPoint(x, y);
      if (!target) return;

      const mouseInit: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        button: button,
        buttons: button === 0 ? 1 : 2,
      };

      if (type === 'contextmenu') {
        target.dispatchEvent(new MouseEvent('contextmenu', mouseInit));
        addRipple(x, y, true);
        return;
      }

      // Pointer event for modern browsers & editors (Monaco/CodeMirror)
      try {
        const pointerType = type === 'mousedown' ? 'pointerdown' : type === 'mouseup' ? 'pointerup' : null;
        if (pointerType) {
          target.dispatchEvent(
            new PointerEvent(pointerType, {
              ...mouseInit,
              pointerId: 1,
              pointerType: 'mouse',
              isPrimary: true,
            })
          );
        }
      } catch {
        // Fallback gracefully
      }

      // Mouse event
      target.dispatchEvent(new MouseEvent(type, mouseInit));

      // Handle focus and text inputs / code editors
      if (type === 'click' || type === 'mousedown') {
        if (typeof (target as HTMLElement).focus === 'function') {
          (target as HTMLElement).focus();
        }
      }

      if (type === 'click') {
        addRipple(x, y, false);
      }
    },
    [addRipple]
  );

  // Left Click
  const handleLeftClick = useCallback(() => {
    setIsClickingVisual(true);
    dispatchSyntheticEvent('mousedown', 0);
    dispatchSyntheticEvent('mouseup', 0);
    dispatchSyntheticEvent('click', 0);
    setTimeout(() => setIsClickingVisual(false), 120);
  }, [dispatchSyntheticEvent]);

  // Right Click
  const handleRightClick = useCallback(() => {
    setIsClickingVisual(true);
    dispatchSyntheticEvent('contextmenu', 2);
    setTimeout(() => setIsClickingVisual(false), 120);
  }, [dispatchSyntheticEvent]);

  // Toggle Drag Mode
  const handleToggleDragMode = useCallback(() => {
    setIsDragMode((prev) => {
      const next = !prev;
      if (next) {
        dispatchSyntheticEvent('mousedown', 0);
      } else {
        dispatchSyntheticEvent('mouseup', 0);
      }
      return next;
    });
  }, [dispatchSyntheticEvent]);

  // Scroll element under cursor
  const handleScroll = useCallback((deltaY: number) => {
    const x = cursorPosRef.current.x;
    const y = cursorPosRef.current.y;
    const target = document.elementFromPoint(x, y);
    if (!target) return;

    target.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY,
        clientX: x,
        clientY: y,
      })
    );

    // Also directly scroll scrollable container
    let parent: HTMLElement | null = target as HTMLElement;
    while (parent && parent !== document.body) {
      if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
        parent.scrollBy({ top: deltaY, behavior: 'smooth' });
        break;
      }
      parent = parent.parentElement;
    }
  }, []);

  // Touchpad touch handlers
  const handleTouchpadStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsTouchingTouchpad(true);
  };

  const handleTouchpadMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lastTouchRef.current.x;
    const dy = touch.clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

    const sensitivity = 1.35;
    setCursorPos((prev) => {
      const newX = clamp(prev.x + dx * sensitivity, 4, window.innerWidth - 6);
      const newY = clamp(prev.y + dy * sensitivity, 4, window.innerHeight - 6);
      return { x: newX, y: newY };
    });

    if (isDragMode) {
      const target = document.elementFromPoint(cursorPosRef.current.x, cursorPosRef.current.y);
      if (target) {
        target.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: cursorPosRef.current.x,
            clientY: cursorPosRef.current.y,
            buttons: 1,
          })
        );
      }
    }
  };

  const handleTouchpadEnd = () => {
    setIsTouchingTouchpad(false);
    if (touchStartPosRef.current && lastTouchRef.current) {
      const dt = Date.now() - touchStartPosRef.current.time;
      const dist = Math.hypot(
        lastTouchRef.current.x - touchStartPosRef.current.x,
        lastTouchRef.current.y - touchStartPosRef.current.y
      );

      // Fast tap without moving = Left Click
      if (dt < 250 && dist < 10) {
        handleLeftClick();
      }
    }
    lastTouchRef.current = null;
    touchStartPosRef.current = null;
  };

  // Header Drag Handlers to reposition panel
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDraggingPanelRef.current = true;
    panelDragOffsetRef.current = {
      x: touch.clientX - panelPos.x,
      y: touch.clientY - panelPos.y,
    };
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingPanelRef.current) return;
    const touch = e.touches[0];
    setPanelPos({
      x: clamp(touch.clientX - panelDragOffsetRef.current.x, 0, window.innerWidth - 240),
      y: clamp(touch.clientY - panelDragOffsetRef.current.y, 0, window.innerHeight - 100),
    });
  };

  const handleHeaderTouchEnd = () => {
    isDraggingPanelRef.current = false;
  };

  // Keep within screen bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setCursorPos((prev) => ({
        x: clamp(prev.x, 4, window.innerWidth - 6),
        y: clamp(prev.y, 4, window.innerHeight - 6),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isEnabled) return null;

  return (
    <>
      {/* On-Screen PC Mouse Cursor Pointer */}
      <div
        className={`virtual-mouse-cursor ${isClickingVisual ? 'is-clicking' : ''} ${isDragMode ? 'is-dragging' : ''}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      >
        <svg
          className="virtual-mouse-cursor-svg"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 2L18.5 14L11.5 15.5L8.5 21.5L6.5 20.5L9.5 14.5L3 2Z"
            fill={isDragMode ? '#89b4fa' : '#ffffff'}
            stroke="#11111b"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Click Ripple Feedback */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className={`virtual-mouse-ripple ${r.isRightClick ? 'right-click' : ''}`}
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        />
      ))}

      {/* Minimized Floating Badge */}
      {isMinimized ? (
        <div
          className="virtual-mouse-badge"
          style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px` }}
          onClick={() => setIsMinimized(false)}
          title="Expand Virtual Mouse Trackpad"
        >
          <FontAwesomeIcon icon={faComputerMouse} />
          <span>Virtual Mouse</span>
        </div>
      ) : (
        /* Floating Trackpad & Buttons Panel */
        <div
          className={`virtual-mouse-floating-panel ${isDark ? 'dark' : 'light'}`}
          style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px` }}
        >
          {/* Draggable Header */}
          <div
            className="vm-panel-header"
            onTouchStart={handleHeaderTouchStart}
            onTouchMove={handleHeaderTouchMove}
            onTouchEnd={handleHeaderTouchEnd}
          >
            <div className="vm-title">
              <FontAwesomeIcon icon={faComputerMouse} />
              <span>Virtual Mouse</span>
            </div>
            <div className="vm-header-actions">
              <button
                type="button"
                className="vm-btn-icon"
                title="Drag to reposition panel"
              >
                <FontAwesomeIcon icon={faArrowsUpDownLeftRight} />
              </button>
              <button
                type="button"
                className="vm-btn-icon"
                onClick={() => setIsMinimized(true)}
                title="Minimize trackpad"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
            </div>
          </div>

          {/* Touchpad Surface */}
          <div
            className={`vm-touchpad-area ${isTouchingTouchpad ? 'is-active' : ''}`}
            onTouchStart={handleTouchpadStart}
            onTouchMove={handleTouchpadMove}
            onTouchEnd={handleTouchpadEnd}
          >
            <div className="vm-touchpad-hint">
              <FontAwesomeIcon icon={faHandPointer} style={{ marginRight: '4px' }} />
              <span>Touch & Drag to move cursor</span>
              <br />
              <small>Tap once to click</small>
            </div>
            <div className="vm-coords-pill">
              {Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}
            </div>
          </div>

          {/* Mouse Buttons */}
          <div className="vm-buttons-row">
            <button
              type="button"
              className="vm-mouse-btn"
              onClick={handleLeftClick}
              title="Left Click at cursor position"
            >
              <FontAwesomeIcon icon={faArrowPointer} />
              <span>LMB (Click)</span>
            </button>
            <button
              type="button"
              className={`vm-mouse-btn ${isDragMode ? 'active' : ''}`}
              onClick={handleToggleDragMode}
              title="Toggle Click-and-Hold Drag"
            >
              <span>{isDragMode ? 'Release' : 'Hold/Drag'}</span>
            </button>
            <button
              type="button"
              className="vm-mouse-btn rmb"
              onClick={handleRightClick}
              title="Right Click (Context menu)"
            >
              <span>RMB (Right)</span>
            </button>
          </div>

          {/* Scroll Buttons */}
          <div className="vm-scroll-row">
            <button
              type="button"
              className="vm-scroll-btn"
              onClick={() => handleScroll(-120)}
              title="Scroll Up under cursor"
            >
              <FontAwesomeIcon icon={faChevronUp} />
              <span>Scroll Up</span>
            </button>
            <button
              type="button"
              className="vm-scroll-btn"
              onClick={() => handleScroll(120)}
              title="Scroll Down under cursor"
            >
              <FontAwesomeIcon icon={faChevronDown} />
              <span>Scroll Down</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VirtualMouse;
