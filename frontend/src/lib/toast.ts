// Simple toast notification system
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export const toast = {
  show: ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toastElement = createToastElement(message, type);
    
    toastContainer.appendChild(toastElement);
    
    setTimeout(() => {
      toastElement.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        toastContainer.removeChild(toastElement);
      }, 300);
    }, duration);
  },
  
  success: (message: string) => toast.show({ message, type: 'success' }),
  error: (message: string) => toast.show({ message, type: 'error' }),
  info: (message: string) => toast.show({ message, type: 'info' }),
  warning: (message: string) => toast.show({ message, type: 'warning' }),
};

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
  document.body.appendChild(container);
  return container;
}

function createToastElement(message: string, type: ToastType) {
  const toast = document.createElement('div');
  toast.className = `
    px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-sm
    transition-all duration-300 transform
    ${getToastStyles(type)}
  `.trim();
  
  const icon = getToastIcon(type);
  toast.innerHTML = `
    <div class="flex items-center gap-3 min-w-[300px] max-w-md">
      <div class="shrink-0">${icon}</div>
      <div class="text-sm font-medium text-white">${message}</div>
    </div>
  `;
  
  return toast;
}

function getToastStyles(type: ToastType): string {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };
  return styles[type];
}

function getToastIcon(type: ToastType): string {
  const icons = {
    success: '<svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    error: '<svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    info: '<svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    warning: '<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
  };
  return icons[type];
}
