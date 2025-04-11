import { useState } from 'react';

interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface ToastState extends ToastOptions {
  isOpen: boolean;
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState | null>(null);

  const toast = (options: ToastOptions) => {
    setToastState({ ...options, isOpen: true });
    setTimeout(() => {
      setToastState(null);
    }, 3000);
  };

  return { toast, toastState };
} 