import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTriangleExclamation, 
  faCircleInfo, 
  faCircleCheck, 
  faTrash,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import '../components/CustomDialog.css';

export interface AlertOptions {
  title?: string;
  message: string;
  okText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  type?: 'warning' | 'danger' | 'info';
}

interface DialogState {
  isOpen: boolean;
  isConfirm: boolean;
  title: string;
  message: string;
  okText: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  type: 'info' | 'warning' | 'error' | 'success' | 'danger';
  resolve: (value: boolean) => void;
}

export interface DialogContextType {
  showAlert: (options: AlertOptions | string) => Promise<void>;
  showConfirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

export const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const showAlert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts: AlertOptions = typeof options === 'string' ? { message: options } : options;
      setDialogState({
        isOpen: true,
        isConfirm: false,
        title: opts.title || 'Notification',
        message: opts.message,
        okText: opts.okText || 'OK',
        confirmText: 'OK',
        cancelText: 'Cancel',
        danger: opts.type === 'error',
        type: opts.type || 'info',
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
      setDialogState({
        isOpen: true,
        isConfirm: true,
        title: opts.title || 'Confirm Action',
        message: opts.message,
        okText: 'OK',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        danger: opts.danger ?? (opts.type === 'danger'),
        type: opts.type || (opts.danger ? 'danger' : 'warning'),
        resolve: (val: boolean) => resolve(val),
      });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (dialogState) {
      dialogState.resolve(result);
      setDialogState(null);
    }
  }, [dialogState]);

  // Keyboard navigation: Enter to confirm, Escape to cancel
  useEffect(() => {
    if (!dialogState?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState?.isOpen, handleClose]);

  // Autofocus the action button
  useEffect(() => {
    if (dialogState?.isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [dialogState?.isOpen]);

  // Choose icon based on type
  const getIcon = () => {
    if (!dialogState) return faCircleInfo;
    if (dialogState.danger || dialogState.type === 'danger') return faTrash;
    if (dialogState.type === 'warning') return faTriangleExclamation;
    if (dialogState.type === 'error') return faTriangleExclamation;
    if (dialogState.type === 'success') return faCircleCheck;
    return faCircleInfo;
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {dialogState?.isOpen && (
        <div 
          className="custom-dialog-backdrop"
          onClick={() => handleClose(false)}
        >
          <div 
            className="custom-dialog-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="custom-dialog-header">
              <div className={`custom-dialog-icon-badge ${dialogState.type}`}>
                <FontAwesomeIcon icon={getIcon()} />
              </div>
              <div className="custom-dialog-title-group">
                <h3 className="custom-dialog-title">{dialogState.title}</h3>
                <p className="custom-dialog-message">{dialogState.message}</p>
              </div>
            </div>

            <div className="custom-dialog-footer">
              {dialogState.isConfirm && (
                <button
                  type="button"
                  className="custom-dialog-btn custom-dialog-btn-cancel"
                  onClick={() => handleClose(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                  <span>{dialogState.cancelText}</span>
                </button>
              )}
              <button
                ref={confirmBtnRef}
                type="button"
                className={`custom-dialog-btn ${dialogState.danger ? 'custom-dialog-btn-danger' : 'custom-dialog-btn-confirm'}`}
                onClick={() => handleClose(true)}
              >
                <span>{dialogState.isConfirm ? dialogState.confirmText : dialogState.okText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
