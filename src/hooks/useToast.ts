import { useState } from 'react';
import type { ToastType } from '../components/Toast';

export function useToast() {
  const [toast, setToast] = useState<ToastType | null>(null);

  const showToast = ({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) => {
    setToast({
      message,
      type,
      visible: true
    });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
}