import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  subtitle?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast = ({ toast, onClose }: ToastProps) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#2A7A50] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#C53030] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#2B6CB0] shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-[#F4F9F5] border-[#2A7A50]/30 text-[#1B4D35]',
    error: 'bg-[#FFF5F5] border-[#E53E3E]/30 text-[#9B2C2C]',
    info: 'bg-[#EBF8FF] border-[#3182CE]/30 text-[#2B6CB0]',
  };

  return (
    <div className="fixed top-5 right-5 left-5 md:left-auto md:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-sm ${bgStyles[toast.type]}`}>
        {icons[toast.type]}
        <div className="flex-1">
          <p className="font-semibold text-sm md:text-base leading-snug">{toast.message}</p>
          {toast.subtitle && (
            <p className="text-xs md:text-sm text-gray-600 mt-0.5">{toast.subtitle}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-1 -mr-1 -mt-1 rounded-lg"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
