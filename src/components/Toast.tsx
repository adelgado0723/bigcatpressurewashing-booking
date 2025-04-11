import { useEffect } from 'react';
import { X } from 'lucide-react';

export type ToastType = {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
  className?: string;
}

const typeClasses = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  info: 'bg-blue-50 border-blue-500 text-blue-800',
};

export function Toast({ 
  message, 
  type, 
  visible, 
  onHide,
  duration = 5000,
  className = ''
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onHide]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg border shadow-lg flex items-center justify-between ${typeClasses[type]} ${className}`}
    >
      <p className="mr-4">{message}</p>
      <button
        type="button"
        onClick={onHide}
        className="text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}