import React from 'react';
import { SessionStatus } from '../types/models';

interface BadgeProps {
  status: SessionStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'AUTHORIZED':
      return (
        <span className={`inline-flex items-center font-medium rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-300/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-xs bg-emerald-600 animate-pulse"></span>
          Đang kết nối
        </span>
      );
    case 'PENDING':
      return (
        <span className={`inline-flex items-center font-medium rounded-sm bg-amber-50 text-amber-800 border border-amber-300/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-xs bg-amber-600"></span>
          Đang chờ
        </span>
      );
    case 'REVOKED':
      return (
        <span className={`inline-flex items-center font-medium rounded-sm bg-rose-50 text-rose-800 border border-rose-300/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-xs bg-rose-600"></span>
          Đã ngắt
        </span>
      );
    case 'EXPIRED':
      return (
        <span className={`inline-flex items-center font-medium rounded-sm bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-xs bg-slate-500"></span>
          Đã hết hạn
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center font-medium rounded-sm bg-red-50 text-red-800 border border-red-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-xs bg-red-600"></span>
          Thất bại
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-sm bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
