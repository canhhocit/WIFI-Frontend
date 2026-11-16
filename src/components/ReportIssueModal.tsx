import React, { useState } from 'react';
import {
  Wifi,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  ZapOff,
  SignalLow,
  Globe2,
  RefreshCw,
  HelpCircle,
  Phone,
  User,
  MessageSquare
} from 'lucide-react';
import { Modal } from './Modal';
import { portalApi } from '../api/portalApi';
import { CitizenIssueType, CitizenReportResponse } from '../types/models';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName?: string;
  locationId?: number;
  locationSlug?: string;
  clientMac?: string;
  clientIp?: string;
  onReportSuccess?: (res: CitizenReportResponse) => void;
}

const ISSUE_OPTIONS: { type: CitizenIssueType; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'SLOW_CONNECTION',
    title: 'Mạng chậm, tải trang quay vòng',
    desc: 'Tốc độ truy cập rất chậm hoặc không load được nội dung',
    icon: <Globe2 className="w-4 h-4 text-amber-600" />
  },
  {
    type: 'CANNOT_CONNECT',
    title: 'Không thể vào được Internet',
    desc: 'Đã kết nối Wi-Fi nhưng báo không có Internet / DNS lỗi',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />
  },
  {
    type: 'SIGNAL_WEAK',
    title: 'Sóng yếu, chập chờn',
    desc: 'Chỉ có 1-2 vạch sóng hoặc thường xuyên bị mất kết nối',
    icon: <SignalLow className="w-4 h-4 text-orange-600" />
  },
  {
    type: 'PORTAL_ERROR',
    title: 'Lỗi trang chào đăng nhập',
    desc: 'Không hiển thị trang đăng nhập hoặc báo lỗi xác thực',
    icon: <RefreshCw className="w-4 h-4 text-blue-600" />
  },
  {
    type: 'POWER_OUTAGE',
    title: 'Nghi mất điện / Thiết bị trạm tắt',
    desc: 'Không quét thấy tên mạng Wi-Fi hoặc thiết bị tắt nguồn',
    icon: <ZapOff className="w-4 h-4 text-purple-600" />
  },
  {
    type: 'OTHER',
    title: 'Vấn đề kỹ thuật khác',
    desc: 'Các sự cố khác cần bộ phận kỹ thuật hỗ trợ',
    icon: <HelpCircle className="w-4 h-4 text-slate-600" />
  }
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  locationName = 'Nhà văn hóa Hải Phòng',
  locationId,
  locationSlug,
  clientMac,
  clientIp,
  onReportSuccess
}) => {
  const [selectedIssue, setSelectedIssue] = useState<CitizenIssueType>('SLOW_CONNECTION');
  const [reporterName, setReporterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CitizenReportResponse | null>(null);

  const resetForm = () => {
    setSelectedIssue('SLOW_CONNECTION');
    setReporterName('');
    setPhoneNumber('');
    setDescription('');
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await portalApi.reportIssue({
        locationId,
        locationSlug,
        issueType: selectedIssue,
        description: description.trim() || undefined,
        reporterName: reporterName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        clientMac,
        clientIp
      });

      setResult(res);
      if (onReportSuccess) {
        onReportSuccess(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi phản ánh. Xin bà con vui lòng thử lại sau ít phút.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Phản Ánh Chất Lượng Wi-Fi Công Cộng" maxWidth="lg">
      {result ? (
        <div className="py-4 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Gửi Phản Ánh Thành Công!</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
              {result.message}
            </p>
          </div>

          {result.incidentCreated && result.ticketCode && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-left text-xs text-amber-900 space-y-1 max-w-md mx-auto">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Phiếu sự cố đã kích hoạt: {result.ticketCode}</span>
              </div>
              <p className="text-[11.5px] text-amber-700 leading-normal">
                Hệ thống đã tự động gom nhiều phản ánh gần đây tại điểm <strong>{result.locationName}</strong> và chuyển tiếp tới đội ngũ kỹ thuật địa bàn xử lý ưu tiên.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold shadow transition cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Info Banner */}
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-slate-700 flex items-start gap-2">
            <Wifi className="w-4 h-4 text-[#004b87] flex-shrink-0 mt-0.5" />
            <div>
              <span>Điểm ghi nhận: </span>
              <strong className="text-[#004b87]">{locationName}</strong>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Ý kiến đóng góp giúp nâng cao chất lượng dịch vụ Wi-Fi phục vụ Nhân dân.
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Issue Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Vui lòng chọn tình trạng bà con đang gặp phải: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ISSUE_OPTIONS.map((item) => {
                const isSelected = selectedIssue === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedIssue(item.type)}
                    className={`p-2.5 rounded border text-left transition cursor-pointer flex items-start gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#004b87] ring-1 ring-[#004b87]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${isSelected ? 'text-[#004b87]' : 'text-slate-800'}`}>
                        {item.title}
                      </div>
                      <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Contact Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Họ và tên (không bắt buộc):
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Số điện thoại liên hệ (tùy chọn):
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Note Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Mô tả chi tiết thêm (nếu có):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ví dụ: Mạng chập chờn từ lúc 14h, ngồi trong hội trường không bắt được sóng..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#a81c1c] hover:bg-[#8e1414] text-white rounded text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>GỬI PHẢN ÁNH</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
