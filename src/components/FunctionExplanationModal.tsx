import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen, 
  faXmark, 
  faCopy, 
  faCheck, 
  faCode, 
  faLayerGroup 
} from '@fortawesome/free-solid-svg-icons';
import type { FunctionExplanation } from '../utils/function-explainer';
import './FunctionExplanationModal.css';

interface FunctionExplanationModalProps {
  explanation: FunctionExplanation | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const FunctionExplanationModal: React.FC<FunctionExplanationModalProps> = ({
  explanation,
  isOpen,
  onClose,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !explanation) return null;

  const handleCopyExample = () => {
    if (explanation.example) {
      navigator.clipboard.writeText(explanation.example);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={`function-explanation-overlay ${isDark ? 'dark' : 'light'}`} onClick={onClose}>
      <div 
        className="function-explanation-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Function Explanation"
      >
        {/* Header */}
        <div className="fe-header">
          <div className="fe-title-group">
            <span className="fe-icon-badge">
              <FontAwesomeIcon icon={faBookOpen} />
            </span>
            <div>
              <h3 className="fe-title">Function Explanation</h3>
              <span className="fe-subtitle">{explanation.name}</span>
            </div>
          </div>
          <div className="fe-header-right">
            <span className={`fe-type-tag type-${explanation.type}`}>{explanation.typeLabel}</span>
            <button 
              type="button" 
              className="fe-close-btn" 
              onClick={onClose}
              title="Close (Esc)"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        {/* Signature Bar */}
        <div className="fe-signature-box">
          <div className="fe-signature-label">
            <FontAwesomeIcon icon={faCode} style={{ marginRight: '6px' }} />
            <span>Signature</span>
          </div>
          <pre className="fe-signature-code"><code>{explanation.signature}</code></pre>
        </div>

        {/* Description / Summary */}
        <div className="fe-body">
          <div className="fe-section">
            <h4 className="fe-section-heading">Description</h4>
            <p className="fe-summary-text">{explanation.summary}</p>
          </div>

          {/* Parameters */}
          {explanation.parameters && explanation.parameters.length > 0 && (
            <div className="fe-section">
              <h4 className="fe-section-heading">Parameters</h4>
              <div className="fe-params-list">
                {explanation.parameters.map((p, idx) => (
                  <div key={idx} className="fe-param-item">
                    <span className="fe-param-name">
                      <code>{p.name}</code>
                      {p.type && <span className="fe-param-type">({p.type})</span>}
                    </span>
                    <span className="fe-param-desc">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Value */}
          {explanation.returns && (
            <div className="fe-section">
              <h4 className="fe-section-heading">Returns</h4>
              <p className="fe-returns-text">{explanation.returns}</p>
            </div>
          )}

          {/* Code Example */}
          {explanation.example && (
            <div className="fe-section">
              <div className="fe-example-header">
                <h4 className="fe-section-heading">Example Usage</h4>
                <button 
                  type="button" 
                  className="fe-copy-btn" 
                  onClick={handleCopyExample}
                  title="Copy example code"
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                  <span>{copied ? 'Copied!' : 'Copy Example'}</span>
                </button>
              </div>
              <pre className="fe-example-code"><code>{explanation.example}</code></pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fe-footer">
          {explanation.definedLine ? (
            <span className="fe-footer-info">
              <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: '5px' }} />
              Defined on Line {explanation.definedLine} in active script
            </span>
          ) : (
            <span className="fe-footer-info">
              Roblox & Luau Engine API Documentation
            </span>
          )}
          <button type="button" className="fe-done-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunctionExplanationModal;
