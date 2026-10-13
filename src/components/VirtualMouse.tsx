import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComputerMouse, 
  faArrowPointer, 
  faChevronUp, 
  faChevronDown, 
  faMinus, 
  faArrowsUpDownLeftRight,
  faCube
} from '@fortawesome/free-solid-svg-icons';
import './VirtualMouse.css';

interface VirtualMouseProps {
  isEnabled: boolean;
  isDark: boolean;
  onOpenEndBlock?: (targetLine: number) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  isRightClick: boolean;
}

export const VirtualMouse: React.FC<VirtualMouseProps> = ({ 
  isEnabled, 
  isDark,
  onOpenEndBlock 
}) => {
  // Cursor coordinate state (starts at center of screen)
  const [cursorPos, setCursorPos] = useState(() => ({
    x: Math.max(20, Math.floor(window.innerWidth / 2)),
    y: Math.max(20, Math.floor(window.innerHeight / 2)),
  }));

  // Floating controls pill position
  const [pillPos, setPillPos] = useState(() => ({
    x: Math.max(10, Math.floor((window.innerWidth - 300) / 2)),
    y: Math.max(10, window.innerHeight - 90),
  }));

  const [isPillMinimized, setIsPillMinimized] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isClickingVisual, setIsClickingVisual] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isDraggingCursor, setIsDraggingCursor] = useState(false);

  // 2.6s Hover countdown state
  const [hoverProgress, setHoverProgress] = useState(0); // 0 to 1
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [isHoveringScript, setIsHoveringScript] = useState(false);

  // Refs for tracking drag and hover
  const cursorPosRef = useRef(cursorPos);
  cursorPosRef.current = cursorPos;

  const dragStartTouchRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartTimeRef = useRef<number>(0);

  const isDraggingPillRef = useRef(false);
  const pillDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverAnimRef = useRef<number | null>(null);
  const hoverStartRef = useRef<number>(0);
  const lastHoverPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
        // Fallback
      }

      target.dispatchEvent(new MouseEvent(type, mouseInit));

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

    let parent: HTMLElement | null = target as HTMLElement;
    while (parent && parent !== document.body) {
      if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
        parent.scrollBy({ top: deltaY, behavior: 'smooth' });
        break;
      }
      parent = parent.parentElement;
    }
  }, []);

  // =========================================================================
  // DIRECT TOUCH DRAG ON MOUSE CURSOR (NO TOUCH PAD NEEDED)
  // =========================================================================
  const handleCursorTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    dragStartTouchRef.current = { x: touch.clientX, y: touch.clientY };
    dragStartCursorRef.current = { ...cursorPosRef.current };
    touchStartTimeRef.current = Date.now();
    setIsDraggingCursor(true);
    resetHoverCountdown();
  };

  const handleCursorTouchMove = (e: React.TouchEvent) => {
    if (!dragStartTouchRef.current) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartTouchRef.current.x;
    const dy = touch.clientY - dragStartTouchRef.current.y;

    // Direct 1:1 finger tracking with ergonomic finger offset
    // The cursor tip is slightly above finger so thumb doesn't block view of code
    const newX = clamp(dragStartCursorRef.current.x + dx, 4, window.innerWidth - 6);
    const newY = clamp(dragStartCursorRef.current.y + dy, 4, window.innerHeight - 6);

    setCursorPos({ x: newX, y: newY });

    // Emit synthetic mousemove for real-time hover
    const target = document.elementFromPoint(newX, newY);
    if (target) {
      target.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: newX,
          clientY: newY,
          buttons: isDragMode ? 1 : 0,
        })
      );
    }

    resetHoverCountdown();
  };

  const handleCursorTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingCursor(false);

    // If quick tap on the cursor itself (< 200ms and minimal movement), perform a Left Click
    if (dragStartTouchRef.current) {
      const dt = Date.now() - touchStartTimeRef.current;
      const touch = e.changedTouches[0];
      const dist = Math.hypot(
        touch.clientX - dragStartTouchRef.current.x,
        touch.clientY - dragStartTouchRef.current.y
      );

      if (dt < 220 && dist < 12) {
        handleLeftClick();
      }
    }

    dragStartTouchRef.current = null;
    startHoverCheckAtPosition(cursorPosRef.current.x, cursorPosRef.current.y);
  };

  // =========================================================================
  // 2.6 SECONDS HOVER COUNTDOWN OVER SCRIPT
  // =========================================================================
  const resetHoverCountdown = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (hoverAnimRef.current) {
      cancelAnimationFrame(hoverAnimRef.current);
      hoverAnimRef.current = null;
    }
    setHoverProgress(0);
    setIsHoveringScript(false);
    setHoverLine(null);
  }, []);

  const detectScriptLineAtCoords = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;

    // Check if inside CodeMirror (.cm-editor) or Monaco (.monaco-editor)
    const isEditor = el.closest('.cm-editor') || el.closest('.monaco-editor');
    if (!isEditor) return null;

    // Query active editor via custom event
    const detail = { x, y, line: null as number | null };

    window.dispatchEvent(
      new CustomEvent('query-editor-line-at-coords', {
        detail,
      })
    );

    if (detail.line && typeof detail.line === 'number') {
      return detail.line;
    }

    // Fallback: CodeMirror line element detection
    const cmLine = el.closest('.cm-line');
    if (cmLine) {
      // Count preceding sibling lines
      let count = 1;
      let sibling = cmLine.previousElementSibling;
      while (sibling) {
        if (sibling.classList.contains('cm-line')) count++;
        sibling = sibling.previousElementSibling;
      }
      return count;
    }

    // Fallback: Monaco view-line
    const monacoLine = el.closest('.view-line');
    if (monacoLine) {
      const top = (monacoLine as HTMLElement).offsetTop;
      const lineH = parseFloat(getComputedStyle(monacoLine).lineHeight) || 19;
      return Math.max(1, Math.round(top / lineH) + 1);
    }

    return 1;
  }, []);

  const startHoverCheckAtPosition = useCallback((x: number, y: number) => {
    resetHoverCountdown();
    lastHoverPosRef.current = { x, y };

    const line = detectScriptLineAtCoords(x, y);
    if (!line) return;

    setIsHoveringScript(true);
    setHoverLine(line);
    hoverStartRef.current = performance.now();

    const DURATION = 2600; // Exact 2.6 seconds

    const animate = (now: number) => {
      const elapsed = now - hoverStartRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      setHoverProgress(progress);

      if (progress < 1) {
        hoverAnimRef.current = requestAnimationFrame(animate);
      } else {
        // 2.6 SECONDS COMPLETED! Open the End Block Thing!
        addRipple(x, y, false);
        if (onOpenEndBlock) {
          onOpenEndBlock(line);
        } else {
          window.dispatchEvent(
            new CustomEvent('open-end-block-inspector', {
              detail: { line, x, y },
            })
          );
        }
        resetHoverCountdown();
      }
    };

    hoverAnimRef.current = requestAnimationFrame(animate);
  }, [detectScriptLineAtCoords, onOpenEndBlock, resetHoverCountdown, addRipple]);

  // When cursor stops moving, start hover check
  useEffect(() => {
    const timer = setTimeout(() => {
      startHoverCheckAtPosition(cursorPos.x, cursorPos.y);
    }, 150);
    return () => clearTimeout(timer);
  }, [cursorPos, startHoverCheckAtPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => resetHoverCountdown();
  }, [resetHoverCountdown]);

  // Keep within bounds on window resize
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

  // Pill Drag Handlers (reposition floating action pill)
  const handlePillTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDraggingPillRef.current = true;
    pillDragOffsetRef.current = {
      x: touch.clientX - pillPos.x,
      y: touch.clientY - pillPos.y,
    };
  };

  const handlePillTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingPillRef.current) return;
    const touch = e.touches[0];
    setPillPos({
      x: clamp(touch.clientX - pillDragOffsetRef.current.x, 10, window.innerWidth - 180),
      y: clamp(touch.clientY - pillDragOffsetRef.current.y, 10, window.innerHeight - 60),
    });
  };

  const handlePillTouchEnd = () => {
    isDraggingPillRef.current = false;
  };

  if (!isEnabled) return null;

  // SVG Circular countdown math (radius = 16, circumference = 2 * PI * 16 ≈ 100.53)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - hoverProgress * circumference;

  return (
    <>
      {/* ========================================================================= */}
      {/* DIRECT-TOUCH PC MOUSE CURSOR WITH 2.6s HOVER PROGRESS RING               */}
      {/* ========================================================================= */}
      <div
        className={`virtual-mouse-cursor ${isClickingVisual ? 'is-clicking' : ''} ${isDragMode ? 'is-dragging' : ''} ${isDraggingCursor ? 'is-grabbed' : ''}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
        onTouchStart={handleCursorTouchStart}
        onTouchMove={handleCursorTouchMove}
        onTouchEnd={handleCursorTouchEnd}
      >
        {/* 2.6s Hover Circular Progress Ring */}
        {isHoveringScript && hoverProgress > 0 && (
          <div className="vm-hover-gauge">
            <svg className="vm-gauge-svg" width="40" height="40" viewBox="0 0 40 40">
              <circle
                className="vm-gauge-bg"
                cx="20"
                cy="20"
                r={radius}
              />
              <circle
                className="vm-gauge-fill"
                cx="20"
                cy="20"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="vm-gauge-label">
              <FontAwesomeIcon icon={faCube} style={{ marginRight: '2px' }} />
              {hoverLine ? `L${hoverLine} • ` : ''}{(2.6 * (1 - hoverProgress)).toFixed(1)}s
            </span>
          </div>
        )}

        {/* PC Mouse Pointer Arrow SVG */}
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

        {/* Ergonomic Touch Halo / Handle below arrow tip */}
        <div className="vm-touch-halo" title="Touch & Drag Mouse Directly">
          <div className="vm-halo-dot" />
          <span className="vm-halo-hint">Drag</span>
        </div>
      </div>

      {/* Click Ripple Feedback */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className={`virtual-mouse-ripple ${r.isRightClick ? 'right-click' : ''}`}
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        />
      ))}

      {/* ========================================================================= */}
      {/* SLEEK FLOATING CONTROL PILL (NO BULKY TOUCHPAD BOX!)                      */}
      {/* ========================================================================= */}
      {isPillMinimized ? (
        <div
          className="vm-pill-badge"
          style={{ left: `${pillPos.x}px`, top: `${pillPos.y}px` }}
          onClick={() => setIsPillMinimized(false)}
          title="Expand Mouse Controls"
        >
          <FontAwesomeIcon icon={faComputerMouse} />
          <span>Mouse</span>
        </div>
      ) : (
        <div
          className={`vm-action-pill ${isDark ? 'dark' : 'light'}`}
          style={{ left: `${pillPos.x}px`, top: `${pillPos.y}px` }}
        >
          {/* Drag Handle */}
          <div
            className="vm-pill-drag-handle"
            onTouchStart={handlePillTouchStart}
            onTouchMove={handlePillTouchMove}
            onTouchEnd={handlePillTouchEnd}
            title="Drag to reposition toolbar"
          >
            <FontAwesomeIcon icon={faArrowsUpDownLeftRight} />
          </div>

          {/* Mouse Buttons */}
          <button
            type="button"
            className="vm-pill-btn"
            onClick={handleLeftClick}
            title="Left Click (LMB)"
          >
            <FontAwesomeIcon icon={faArrowPointer} />
            <span>LMB</span>
          </button>

          <button
            type="button"
            className={`vm-pill-btn ${isDragMode ? 'active' : ''}`}
            onClick={handleToggleDragMode}
            title="Toggle Click-and-Hold Drag"
          >
            <span>{isDragMode ? 'Release' : 'Hold'}</span>
          </button>

          <button
            type="button"
            className="vm-pill-btn"
            onClick={handleRightClick}
            title="Right Click (RMB)"
          >
            <span>RMB</span>
          </button>

          <div className="vm-pill-divider" />

          {/* Scroll Buttons */}
          <button
            type="button"
            className="vm-pill-btn scroll"
            onClick={() => handleScroll(-120)}
            title="Scroll Up"
          >
            <FontAwesomeIcon icon={faChevronUp} />
          </button>

          <button
            type="button"
            className="vm-pill-btn scroll"
            onClick={() => handleScroll(120)}
            title="Scroll Down"
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </button>

          {/* Minimize Button */}
          <button
            type="button"
            className="vm-pill-btn minimize"
            onClick={() => setIsPillMinimized(true)}
            title="Minimize"
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
        </div>
      )}
    </>
  );
};

export default VirtualMouse;
