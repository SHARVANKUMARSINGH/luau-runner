import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faChevronDown, 
  faChevronUp, 
  faTerminal, 
  faCopy, 
  faCheck,
  faTriangleExclamation,
  faCircleXmark,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import type { ConsoleMessage } from '../types';
import './Console.css';

interface ConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
}

type FilterType = 'all' | 'output' | 'warn' | 'error';

const Console: React.FC<ConsoleProps> = ({ messages, onClear, isOpen, onToggle, isDark }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [copied, setCopied] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, filter]);

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    if (filter === 'output') return msg.type === 'output' || msg.type === 'system';
    return msg.type === filter;
  });

  const getMessageClass = (type: ConsoleMessage['type']): string => {
    switch (type) {
      case 'error': return 'console-msg-error';
      case 'warn': return 'console-msg-warn';
      case 'info': return 'console-msg-info';
      case 'system': return 'console-msg-system';
      default: return 'console-msg-output';
    }
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleCopy = () => {
    const text = messages.map(m => `[${formatTime(m.timestamp)}] [${m.type.toUpperCase()}] ${m.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorCount = messages.filter(m => m.type === 'error').length;
  const warnCount = messages.filter(m => m.type === 'warn').length;

  return (
    <div className={`console-panel ${isOpen ? 'console-open' : 'console-closed'} ${isDark ? 'dark' : 'light'}`}>
      <div className="console-header" onClick={onToggle}>
        <div className="console-header-left">
          <FontAwesomeIcon icon={faTerminal} className="console-header-icon" />
          <span className="console-title">Console Output</span>
          {messages.length > 0 && (
            <span className="console-badge">{messages.length}</span>
          )}
          {errorCount > 0 && (
            <span className="console-badge-error" title={`${errorCount} error(s)`}>
              <FontAwesomeIcon icon={faCircleXmark} /> {errorCount}
            </span>
          )}
          {warnCount > 0 && (
            <span className="console-badge-warn" title={`${warnCount} warning(s)`}>
              <FontAwesomeIcon icon={faTriangleExclamation} /> {warnCount}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="console-filters" onClick={(e) => e.stopPropagation()}>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              title="All messages"
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'output' ? 'active' : ''}`}
              onClick={() => setFilter('output')}
              title="Standard output only"
            >
              Output
            </button>
            <button
              className={`filter-btn ${filter === 'warn' ? 'active' : ''}`}
              onClick={() => setFilter('warn')}
              title="Warnings only"
            >
              Warnings
            </button>
            <button
              className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
              title="Errors only"
            >
              Errors
            </button>
          </div>
        )}

        <div className="console-header-actions" onClick={(e) => e.stopPropagation()}>
          {isOpen && messages.length > 0 && (
            <button
              className="console-action-btn"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy console output"}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              <span className="btn-label">{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
          {isOpen && (
            <button
              className="console-action-btn"
              onClick={onClear}
              title="Clear console"
            >
              <FontAwesomeIcon icon={faTrash} />
              <span className="btn-label">Clear</span>
            </button>
          )}
          <button 
            className="console-toggle-btn" 
            onClick={onToggle}
            title={isOpen ? 'Collapse console' : 'Expand console'}
          >
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronUp} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="console-body" ref={scrollRef}>
          {filteredMessages.length === 0 ? (
            <div className="console-empty">
              <FontAwesomeIcon icon={faInfoCircle} className="console-empty-icon" />
              <span>{messages.length === 0 ? 'No output yet. Run a script to see prints, warnings, and errors.' : 'No messages matching current filter.'}</span>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className={`console-msg ${getMessageClass(msg.type)}`}>
                <span className="console-timestamp">{formatTime(msg.timestamp)}</span>
                <span className="console-text">{msg.text}</span>
                {msg.source && (
                  <span className="console-source">
                    {msg.source}{msg.line ? `:${msg.line}` : ''}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Console;
