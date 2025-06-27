// src/lib/stores/toast.ts
import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    add: (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        duration: 5000,
        ...toast
      };

      update(toasts => [...toasts, newToast]);

      // Auto-remove after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          update(toasts => toasts.filter(t => t.id !== id));
        }, newToast.duration);
      }

      return id;
    },
    remove: (id: string) => {
      update(toasts => toasts.filter(toast => toast.id !== id));
    },
    clear: () => {
      update(() => []);
    }
  };
}

export const toasts = createToastStore();

// Convenience methods
export const showToast = {
  success: (title: string, message?: string) => 
    toasts.add({ type: 'success', title, message }),
  error: (title: string, message?: string) => 
    toasts.add({ type: 'error', title, message }),
  warning: (title: string, message?: string) => 
    toasts.add({ type: 'warning', title, message }),
  info: (title: string, message?: string) => 
    toasts.add({ type: 'info', title, message })
};