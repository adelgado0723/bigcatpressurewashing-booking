import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function Toast({
  message,
  type,
  onClose,
  duration = 5000,
  icon,
  action,
  className = ''
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg border shadow-lg flex items-center justify-between ${typeClasses[type]} ${className}`}
      style={{ maxWidth: '400px', textOverflow: 'ellipsis' }}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <p className="text-sm">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium hover:opacity-80"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:opacity-80"
          aria-label="close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}