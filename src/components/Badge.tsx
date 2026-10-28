import React from 'react';
import { SessionStatus } from '../types/models';

interface BadgeProps {
  status: SessionStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  switch (status) {
    case 'AUTHORIZED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang kết nối
        </span>
      );
    case 'PENDING':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          Đang chờ
        </span>
      );
    case 'REVOKED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          Đã ngắt
        </span>
      );
    case 'EXPIRED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Đã hết hạn
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-600"></span>
          Thất bại
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
