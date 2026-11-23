import React from 'react';
import { CheckCircle2, XCircle, Loader2, HelpCircle, AlertTriangle, Radio } from 'lucide-react';

interface Props {
  status: string;
  monitoringSource?: string;
  compact?: boolean;
}

/**
 * Trạng thái thiết bị kèm nguồn dữ liệu.
 * AP chưa được giám sát trực tiếp hiển thị "CHƯA GIÁM SÁT" thay vì trạng thái lưu tĩnh trong CSDL.
 */
export const DeviceStatusBadge: React.FC<Props> = ({ status, monitoringSource, compact }) => {
  const base = `inline-flex items-center gap-1 font-semibold border rounded-sm ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'}`;

  if (monitoringSource === 'NOT_MONITORED') {
    return (
      <span
        className={`${base} text-slate-600 bg-slate-50 border-slate-300`}
        title="Máy chủ này chưa có đường mạng tới thiết bị để đọc trạng thái trực tiếp"
      >
        <HelpCircle className="w-3 h-3 text-slate-400" /> CHƯA GIÁM SÁT
      </span>
    );
  }
  if (monitoringSource === 'MESH_PENDING') {
    return (
      <span className={`${base} text-slate-600 bg-slate-50 border-slate-300`} title="Đang chờ lượt đọc đầu tiên từ thiết bị">
        <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> ĐANG ĐỌC
      </span>
    );
  }

  const live = monitoringSource === 'MESH_LIVE' || monitoringSource === 'GWN_CLOUD';
  const liveTag = live ? (
    <span title="Dữ liệu đọc trực tiếp từ thiết bị" className="inline-flex items-center">
      <Radio className="w-3 h-3 ml-0.5 opacity-70" />
    </span>
  ) : null;

  switch (status) {
    case 'ONLINE':
      return (
        <span className={`${base} text-emerald-800 bg-emerald-50 border-emerald-300`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ONLINE{liveTag}
        </span>
      );
    case 'REBOOTING':
      return (
        <span className={`${base} text-sky-800 bg-sky-50 border-sky-300 animate-pulse`}>
          <Loader2 className="w-3 h-3 text-sky-600 animate-spin" /> REBOOTING
        </span>
      );
    case 'OFFLINE':
      return (
        <span className={`${base} text-rose-800 bg-rose-50 border-rose-300`}>
          <XCircle className="w-3 h-3 text-rose-600" /> OFFLINE{liveTag}
        </span>
      );
    case 'DEGRADED':
      return (
        <span
          className={`${base} text-amber-800 bg-amber-50 border-amber-300`}
          title={monitoringSource === 'MESH_AUTH_FAILED' ? 'Thiết bị từ chối đăng nhập quản trị' : 'Thiết bị phản hồi nhưng không đọc được dữ liệu'}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {monitoringSource === 'MESH_AUTH_FAILED' ? 'SAI MẬT KHẨU' : 'LỖI ĐỌC'}
        </span>
      );
    case 'UNKNOWN':
      return (
        <span className={`${base} text-slate-600 bg-slate-50 border-slate-300`}>
          <HelpCircle className="w-3 h-3 text-slate-400" /> CHƯA XÁC ĐỊNH
        </span>
      );
    default:
      return <span className={`${base} text-amber-800 bg-amber-50 border-amber-300`}>{status}</span>;
  }
};
