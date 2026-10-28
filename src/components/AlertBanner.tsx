import React from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  className = '',
}) => {
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
  }[type];

  const icons = {
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
    error: <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />,
  }[type];

  return (
    <div className={`p-4 rounded-xl border flex gap-3 items-start text-sm ${styles} ${className}`}>
      {icons}
      <div>
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <p className="leading-relaxed opacity-95">{message}</p>
      </div>
    </div>
  );
};
