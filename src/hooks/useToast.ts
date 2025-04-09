import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast(duration = 5000) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
    duration,
  };
}