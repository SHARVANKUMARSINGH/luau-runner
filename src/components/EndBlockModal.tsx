import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCube, 
  faXmark, 
  faArrowDown, 
  faArrowUp, 
  faFolderOpen, 
  faPlus, 
  faCopy, 
  faCheck, 
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import type { LuauBlock } from '../utils/block-analyzer';
import './EndBlockModal.css';

interface EndBlockModalProps {
  block: LuauBlock | null;
  targetLine: number;
  isOpen: boolean;
  onClose: () => void;
  onJumpToLine: (lineNumber: number) => void;
  onUnfoldBlock?: (lineNumber: number) => void;
  onInsertEnd?: (startLine: number, closerText: string) => void;
  isDark: boolean;
}

export const EndBlockModal: React.FC<EndBlockModalProps> = ({
  block,
  targetLine,
  isOpen,
  onClose,
  onJumpToLine,
  onUnfoldBlock,
  onInsertEnd,
  isDark,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !block) return null;

  const handleCopyBlock = () => {
    const fullBlockText = `${block.startCode}\n${block.innerCode}\n${block.endCode || block.suggestedCloser}`;
    navigator.clipboard.writeText(fullBlockText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`end-block-modal-overlay ${isDark ? 'dark' : 'light'}`} onClick={onClose}>
      <div 
        className="end-block-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="End Block Inspector"
      >
        {/* Header */}
        <div className="eb-header">
          <div className="eb-title-group">
            <span className="eb-icon-badge">
              <FontAwesomeIcon icon={faCube} />
            </span>
            <div>
              <h3 className="eb-title">End Block Inspector</h3>
              <span className="eb-subtitle">Hovered at Line {targetLine}</span>
            </div>
          </div>
          <div className="eb-header-right">
            <span className="eb-type-tag">{block.typeLabel}</span>
            <button 
              type="button" 
              className="eb-close-btn" 
              onClick={onClose}
              title="Close (Esc)"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`eb-status-banner ${block.isClosed ? 'closed' : 'warning'}`}>
          <FontAwesomeIcon icon={block.isClosed ? faCheck : faTriangleExclamation} />
          <span>
            {block.isClosed 
              ? `Block is properly closed with '${block.endCode}' (${block.lineCount} lines total)`
              : `Block is unclosed! Missing '${block.suggestedCloser}'`}
          </span>
        </div>

        {/* Block Breakdown */}
        <div className="eb-breakdown">
          {/* Opener */}
          <div className="eb-section">
            <div className="eb-section-header">
              <span className="eb-section-title">Block Opener</span>
              <span className="eb-line-pill start">Line {block.startLine}</span>
            </div>
            <pre className="eb-code-snippet"><code>{block.startCode}</code></pre>
          </div>

          {/* Flow indicator */}
          <div className="eb-flow-line">
            <span className="eb-flow-dots">⋮ {block.lineCount - 2 > 0 ? `${block.lineCount - 2} inner lines` : 'inner body'} ⋮</span>
          </div>

          {/* Closer / End Block */}
          <div className="eb-section closer">
            <div className="eb-section-header">
              <span className="eb-section-title">End Block</span>
              {block.isClosed && block.endLine ? (
                <span className="eb-line-pill end">Line {block.endLine}</span>
              ) : (
                <span className="eb-line-pill missing">Missing Closer</span>
              )}
            </div>
            <pre className="eb-code-snippet closer">
              <code>{block.isClosed ? block.endCode : `[Missing ${block.suggestedCloser}]`}</code>
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="eb-actions">
          {block.isClosed && block.endLine && (
            <button
              type="button"
              className="eb-btn eb-btn-primary"
              onClick={() => {
                onJumpToLine(block.endLine!);
                onClose();
              }}
              title={`Jump to line ${block.endLine}`}
            >
              <FontAwesomeIcon icon={faArrowDown} />
              <span>Jump to 'end' (L{block.endLine})</span>
            </button>
          )}

          <button
            type="button"
            className="eb-btn eb-btn-secondary"
            onClick={() => {
              onJumpToLine(block.startLine);
              onClose();
            }}
            title={`Jump to line ${block.startLine}`}
          >
            <FontAwesomeIcon icon={faArrowUp} />
            <span>Jump to Start (L{block.startLine})</span>
          </button>

          {onUnfoldBlock && (
            <button
              type="button"
              className="eb-btn eb-btn-secondary"
              onClick={() => {
                onUnfoldBlock(block.startLine);
                onClose();
              }}
              title="Expand / Unfold block in editor"
            >
              <FontAwesomeIcon icon={faFolderOpen} />
              <span>Unfold Block</span>
            </button>
          )}

          {!block.isClosed && onInsertEnd && (
            <button
              type="button"
              className="eb-btn eb-btn-accent"
              onClick={() => {
                onInsertEnd(block.startLine, block.suggestedCloser);
                onClose();
              }}
              title={`Insert '${block.suggestedCloser}' to close block`}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Insert '{block.suggestedCloser}'</span>
            </button>
          )}

          <button
            type="button"
            className="eb-btn eb-btn-icon"
            onClick={handleCopyBlock}
            title="Copy entire block code"
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndBlockModal;
