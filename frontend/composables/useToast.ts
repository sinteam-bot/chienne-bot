export interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

export function useToast() {
  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info', duration = 4000) {
    const id = nextId++;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  function removeToast(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id);
    if (idx !== -1) {
      toasts.value.splice(idx, 1);
    }
  }

  return {
    toasts: readonly(toasts),
    showToast,
    removeToast
  };
}
