import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  show: boolean;
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // Milliseconds before auto-closing (default: 3000)
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  message,
  title,
  type = 'success',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  const typeConfig = {
    success: {
      bg: 'bg-white border-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      defaultTitle: 'Thao tác thành công',
      barColor: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-white border-rose-500',
      iconBg: 'bg-rose-50 text-rose-600',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      defaultTitle: 'Có lỗi xảy ra',
      barColor: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-white border-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      defaultTitle: 'Cảnh báo',
      barColor: 'bg-amber-500',
    },
    info: {
      bg: 'bg-white border-sky-500',
      iconBg: 'bg-sky-50 text-sky-600',
      icon: <Info className="w-5 h-5 text-sky-600" />,
      defaultTitle: 'Thông tin hệ thống',
      barColor: 'bg-sky-500',
    },
  }[type];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full transition-all duration-300 ease-out transform translate-y-0 opacity-100">
      <div
        className={`relative overflow-hidden rounded-md border-l-4 ${typeConfig.bg} shadow-2xl p-4 text-xs flex items-start gap-3 border border-slate-200/90`}
        role="alert"
      >
        {/* Type Icon */}
        <div className={`p-1.5 rounded-full ${typeConfig.iconBg} flex-shrink-0 mt-0.5`}>
          {typeConfig.icon}
        </div>

        {/* Content */}
        <div className="flex-1 pr-4">
          <h4 className="font-bold text-slate-900 text-xs mb-0.5">
            {title || typeConfig.defaultTitle}
          </h4>
          <p className="text-slate-600 text-[11.5px] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer flex-shrink-0 -mr-1 -mt-1"
          aria-label="Đóng thông báo"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Subtle Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className={`h-full ${typeConfig.barColor}`}
            style={{
              animation: `shrinkWidth ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

