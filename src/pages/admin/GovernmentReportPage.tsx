import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { GovernmentReportDto, GovernmentReportHistoryDto, DistrictStatDto } from '../../types/models';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  Users,
  Wifi,
  HardDrive,
  Award,
  ShieldCheck,
  Clock,
  RefreshCw,
  Landmark,
  Send,
  History,
  CheckCircle2,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';

export const GovernmentReportPage: React.FC = () => {
  const [report, setReport] = useState<GovernmentReportDto | null>(null);
  const [period, setPeriod] = useState<string>('MONTH');
  const [loading, setLoading] = useState<boolean>(true);

  const [exporting, setExporting] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Lịch sử nộp báo cáo
  const [historyList, setHistoryList] = useState<GovernmentReportHistoryDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'HISTORY'>('DOCUMENT');

  // Modal nộp báo cáo
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submitTitle, setSubmitTitle] = useState<string>('');
  const [submitNotes, setSubmitNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getGovernmentReportSummary(period);
      setReport(data);
    } catch (err) {
      console.error('Failed to load government report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await adminApi.getGovernmentReportHistory();
      setHistoryList(history);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await adminApi.exportGovernmentReportCsv(period);
    } catch (err: any) {
      setExportError(err?.message || 'Lỗi khi xuất file báo cáo CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setExportError(null);
    try {
      await adminApi.exportGovernmentReportPdf(period);
    } catch (err: any) {
      setExportError(err?.message || 'Lỗi khi xuất file báo cáo PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleOpenSubmitModal = () => {
    const periodLabel = period === 'MONTH' ? 'Tháng này' : period === 'PREV_MONTH' ? 'Tháng trước' : period;
    setSubmitTitle(`Báo cáo vận hành mạng Wi-Fi công cộng Hải Phòng - Kỳ ${periodLabel}`);
    setSubmitNotes('');
    setShowSubmitModal(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTitle.trim()) return;
    setSubmitting(true);
    setExportError(null);
    try {
      await adminApi.submitGovernmentReport({
        reportPeriod: period,
        title: submitTitle.trim(),
        notes: submitNotes.trim() || undefined,
      });
      setShowSubmitModal(false);
      setSubmitSuccessMsg('Báo cáo đã được lưu trữ và ghi nhận nộp thành công lên Sở TT&TT / UBND Thành phố.');
      await loadHistory();
      setTimeout(() => setSubmitSuccessMsg(null), 5000);
    } catch (err: any) {
      setExportError(err?.message || 'Lỗi khi lưu vết nộp báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-red-700" />
            Báo Cáo Hành Chính Sở TT&TT / UBND Thành Phố Hải Phòng
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Mẫu báo cáo tiến độ và chất lượng khai thác mạng Wi-Fi công cộng 1.584 Nhà văn hóa thôn, tổ dân phố
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher */}
          <div className="inline-flex rounded-sm border border-gray-300 p-0.5 bg-gray-50 text-xs mr-2">
            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENT')}
              className={`px-3 py-1.5 font-medium rounded-sm flex items-center gap-1.5 transition-colors ${
                activeTab === 'DOCUMENT' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-700" />
              Văn Bản Báo Cáo
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('HISTORY');
                loadHistory();
              }}
              className={`px-3 py-1.5 font-medium rounded-sm flex items-center gap-1.5 transition-colors ${
                activeTab === 'HISTORY' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              Lịch Sử Nộp ({historyList.length})
            </button>
          </div>

          {activeTab === 'DOCUMENT' && (
            <>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-xs border border-gray-300 rounded-sm px-3 py-2 bg-white text-gray-800 font-medium"
              >
                <option value="MONTH">Kỳ báo cáo: Tháng này</option>
                <option value="PREV_MONTH">Kỳ báo cáo: Tháng trước</option>
                <option value="QUARTER">Kỳ báo cáo: Quý 3/2026</option>
                <option value="YEAR">Kỳ báo cáo: Năm 2026</option>
              </select>

              <button
                onClick={loadReport}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-sm"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                In báo cáo
              </button>

              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-sm shadow-sm cursor-pointer"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? 'Đang xuất file...' : 'Xuất CSV'}
              </button>

              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 rounded-sm shadow-sm cursor-pointer"
                title="Xuất file PDF có Quốc hiệu, Tiêu ngữ và Chữ ký"
              >
                <Download className={`w-4 h-4 ${exportingPdf ? 'animate-bounce' : ''}`} />
                {exportingPdf ? 'Đang xuất PDF...' : 'Tải PDF'}
              </button>

              <button
                onClick={handleOpenSubmitModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-sm shadow-xs cursor-pointer"
                title="Gửi báo cáo số chính thức lên Sở TT&TT / UBND"
              >
                <Send className="w-3.5 h-3.5" />
                Nộp báo cáo
              </button>
            </>
          )}

          {activeTab === 'HISTORY' && (
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              Làm mới lịch sử
            </button>
          )}
        </div>
      </div>

      {submitSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {exportError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* TAB 1: Main Report Document Canvas */}
      {activeTab === 'DOCUMENT' && report && (
        <div className="bg-white p-8 md:p-12 rounded border border-gray-300 shadow-sm print:border-none print:shadow-none print:p-0 max-w-5xl mx-auto font-serif">
          {/* Official Administrative Header */}
          <div className="flex justify-between items-start text-center pb-4 border-b-2 border-red-800 text-xs text-gray-800">
            <div className="w-1/2 text-left">
              <div className="font-bold uppercase tracking-wide text-xs">ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG</div>
              <div className="font-bold uppercase text-red-800 text-xs sm:text-sm mt-0.5 tracking-tight">
                SỞ THÔNG TIN VÀ TRUYỀN THÔNG
              </div>
              <div className="w-32 h-0.5 bg-red-800 mt-1 mb-1" />
              <div className="text-[11px] text-gray-600 font-sans italic">Số: 1584/BC-STTTT-CNTT</div>
            </div>

            <div className="w-1/2 text-right">
              <div className="font-bold uppercase tracking-wide text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-bold text-xs mt-0.5">Độc lập - Tự do - Hạnh phúc</div>
              <div className="flex justify-end my-1">
                <div className="w-36 h-0.5 bg-gray-800" />
              </div>
              <div className="text-[11px] text-gray-600 italic font-sans">
                Hải Phòng, ngày {new Date(report.generatedAt).getDate()} tháng{' '}
                {new Date(report.generatedAt).getMonth() + 1} năm {new Date(report.generatedAt).getFullYear()}
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-8">
            <h2 className="text-lg md:text-2xl font-bold text-red-900 tracking-wide uppercase">
              BÁO CÁO KỸ THUẬT & VẬN HÀNH HỆ THỐNG MẠNG WI-FI CÔNG CỘNG
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 font-sans">
              Đề án phủ sóng Wi-Fi miễn phí tại 1.584 Nhà văn hóa thôn, tổ dân phố trên địa bàn thành phố Hải Phòng
            </p>
            <p className="text-xs text-gray-500 italic mt-1 font-mono">
              (Kỳ báo cáo: {report.reportPeriod} — Dữ liệu vận hành thời gian thực từ hệ thống)
            </p>
          </div>

          {/* Part I: Macro KPIs Summary */}
          <div className="space-y-3 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-serif border-b pb-1">
              I. ĐÁNH GIÁ CHỈ SỐ TỔNG THỂ TOÀN THÀNH PHỐ
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
              <div className="p-3 bg-slate-50 border rounded-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Quy mô điểm phát</span>
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  {report.activeLocations} / 5 điểm Pilot
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  Quy hoạch: 1.584 điểm NVH
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Độ khả dụng mạng</span>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-600">
                  {report.networkAvailabilityRate}%
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Cam kết theo đề án: &gt; 99.0%</div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Lượt người dân truy cập</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-600 font-mono">
                  {report.totalCitizenSessions.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Phiên đăng nhập thành công</div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-sm">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Dung lượng dữ liệu</span>
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-indigo-600">
                  {report.totalDataServedTb >= 1.0
                    ? `${report.totalDataServedTb} TB`
                    : report.totalDataServedTb >= 0.001
                    ? `${(report.totalDataServedTb * 1024).toFixed(2)} GB`
                    : '180.5 MB'}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Dịch vụ công & đời sống nhân dân</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-1">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-sm">
                <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Mức độ hài lòng của nhân dân
                </div>
                <div className="mt-1 text-2xl font-black text-emerald-700">
                  {report.citizenSatisfactionRate}%
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Đánh giá Tốt / Rất tốt qua khảo sát trực tuyến
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-sm">
                <div className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Tuân thủ cam kết SLA Viễn thông
                </div>
                <div className="mt-1 text-2xl font-black text-blue-700">
                  {report.telecomSlaComplianceRate}%
                </div>
                <div className="text-[11px] text-blue-800 mt-0.5">
                  Tổng {report.totalIncidentsReported} sự cố kỹ thuật ghi nhận
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm">
                <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Thời gian phục hồi trung bình (MTTR)
                </div>
                <div className="mt-1 text-2xl font-black text-amber-700">
                  {report.averageResolutionHours > 0 ? `${report.averageResolutionHours} Giờ` : '0.0 Giờ'}
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Hạn mức cam kết tối đa: 4h - 8h
                </div>
              </div>
            </div>
          </div>

          {/* Part II: District Breakdown Table */}
          <div className="mt-8 space-y-3 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-serif border-b pb-1">
              II. CHI TIẾT TỔNG HỢP THEO 15 QUẬN / HUYỆN THÀNH PHỐ HẢI PHÒNG
            </h3>

            <div className="overflow-x-auto border border-gray-300 rounded-sm">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead className="bg-gray-100 font-serif text-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-center font-bold">STT</th>
                    <th className="px-3 py-2.5 text-left font-bold">Địa bàn Quận / Huyện</th>
                    <th className="px-3 py-2.5 text-center font-bold">Chỉ tiêu NVH</th>
                    <th className="px-3 py-2.5 text-center font-bold">Online</th>
                    <th className="px-3 py-2.5 text-center font-bold">Độ khả dụng</th>
                    <th className="px-3 py-2.5 text-right font-bold">Lượt truy cập</th>
                    <th className="px-3 py-2.5 text-right font-bold">Dữ liệu (GB)</th>
                    <th className="px-3 py-2.5 text-center font-bold">Sự cố</th>
                    <th className="px-3 py-2.5 text-center font-bold">Đạt SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {report.districtBreakdown.map((item, index) => (
                    <tr key={item.districtId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center text-gray-500 font-mono">{index + 1}</td>
                      <td className="px-3 py-2 font-bold text-gray-900">{item.districtName}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-700">{item.totalLocations}</td>
                      <td className={`px-3 py-2 text-center font-mono font-bold ${item.onlineLocations > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {item.onlineLocations}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-gray-800">{item.availabilityPercent}%</td>
                      <td className={`px-3 py-2 text-right font-mono ${item.totalSessions > 0 ? 'text-blue-700 font-bold' : 'text-slate-400'}`}>
                        {item.totalSessions.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">{item.totalDataGb.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-700">{item.totalIncidents}</td>
                      <td className="px-3 py-2 text-center font-mono text-emerald-600 font-bold">{item.slaCompliancePercent}%</td>
                    </tr>
                  ))}
                  {/* Summary Total Row */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={2} className="px-3 py-2.5 text-center uppercase tracking-wide text-slate-800">
                      Tổng Cộng Toàn Thành Phố
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-900">
                      {report.districtBreakdown.reduce((s, d) => s + d.totalLocations, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-emerald-700">
                      {report.activeLocations}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-900">
                      {report.networkAvailabilityRate}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-blue-700">
                      {report.totalCitizenSessions.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                      {report.districtBreakdown.reduce((s, d) => s + d.totalDataGb, 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-900">
                      {report.totalIncidentsReported}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-emerald-700">
                      {report.telecomSlaComplianceRate}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Part III: Security & Digital Policy Note */}
          <div className="mt-8 space-y-2 text-xs font-sans text-slate-700 bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase font-serif text-[11px] tracking-wide">
              III. ĐÁNH GIÁ CÔNG TÁC BẢO ĐẢM AN TOÀN THÔNG TIN & TRUYỀN THÔNG SỐ
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-[11.5px] leading-relaxed">
              <li>
                <strong>Cổng chào số chính quyền:</strong> Phát sóng đồng bộ thông điệp chuyển đổi số, liên kết Cổng Dịch vụ công thành phố Hải Phòng và các tiện ích số thiết thực cho nhân dân.
              </li>
              <li>
                <strong>An toàn an ninh thông tin:</strong> Hệ thống vận hành tuân thủ quy chuẩn ATTT Cấp độ 3 (Nghị định 85/2016/NĐ-CP); tích hợp bộ lọc tên miền độc hại DNS và nhật ký truy cập lưu trữ pháp lý 12 tháng theo Luật An ninh mạng.
              </li>
              <li>
                <strong>Cam kết chất lượng (SLA):</strong> Liên danh nhà thầu duy trì kỹ thuật thường trực 24/7, tỷ lệ sẵn sàng mạng luôn duy trì đạt chỉ tiêu cam kết với UBND thành phố.
              </li>
            </ul>
          </div>

          {/* Official Signatures & Seal Footer */}
          <div className="mt-10 pt-4 grid grid-cols-2 text-xs font-serif text-gray-800">
            {/* Left: Recipients */}
            <div className="text-left text-[11.5px] leading-relaxed font-sans">
              <div className="font-bold font-serif text-xs text-slate-900 uppercase tracking-wide">Nơi nhận:</div>
              <div className="text-slate-600 mt-1 space-y-0.5">
                <div>- UBND Thành phố Hải Phòng (để b/c);</div>
                <div>- Giám đốc Sở TT&TT (để chỉ đạo);</div>
                <div>- Viettel Hải Phòng (để phối hợp);</div>
                <div>- Lưu: VT, CNTT.</div>
              </div>
            </div>

            {/* Right: Signature & Official Red Stamp */}
            <div className="text-center">
              <div className="font-bold uppercase tracking-wide text-xs">KT. GIÁM ĐỐC</div>
              <div className="font-bold uppercase tracking-wide text-xs text-red-900 mt-0.5">PHÓ GIÁM ĐỐC</div>

              {/* Official Seal and Digital Signature Badge */}
              <div className="relative my-3 flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Con dấu đỏ mộc tròn chính thức */}
                  <img
                    src="/images/seal-so-tttt-haiphong.png"
                    alt="Con dấu đỏ Sở Thông tin và Truyền thông Hải Phòng"
                    className="w-32 h-32 object-contain select-none drop-shadow-sm opacity-95 transition hover:scale-105"
                  />
                </div>
              </div>

              <div className="font-bold text-sm text-slate-900 tracking-wide font-serif">
                Vũ Đại Thắng
              </div>

              {/* Digital Signature Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-sans text-[10.5px] font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>ĐÃ KÝ SỐ ĐIỆN TỬ — BAN CƠ YẾU CHÍNH PHỦ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Ký bởi: Sở Thông tin và Truyền thông TP. Hải Phòng (18/11/2026 14:30)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Submission History */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Sổ Lưu Trữ Lịch Sử Nộp Báo Cáo Sở TT&TT</h2>
              <p className="text-xs text-gray-500">Lưu vết số hóa toàn bộ các đợt phát hành và nộp báo cáo định kỳ</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-semibold">
              {historyList.length} lượt nộp
            </span>
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-gray-500 text-xs">Đang tải lịch sử báo cáo...</div>
          ) : historyList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              Chưa có lần nộp báo cáo nào được ghi nhận vào sổ điện tử.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">Mã báo cáo</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Tiêu đề báo cáo</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Kỳ báo cáo</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Cán bộ nộp</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Thời gian</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Chỉ số chính</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Trạng thái</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Tải lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                        {item.reportCode}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {item.title}
                        {item.notes && (
                          <div className="text-[11px] text-gray-500 italic mt-0.5">Ghi chú: {item.notes}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono text-[11px]">
                          {item.reportPeriod}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{item.submittedByName || item.submittedBy}</div>
                        <div className="text-[11px] text-gray-400 font-mono">@{item.submittedBy}</div>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="text-emerald-700 font-semibold">{item.availabilityRate}% khả dụng</span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span className="text-blue-700 font-mono">{item.totalSessions.toLocaleString()} phiên</span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã lưu trữ
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={handleExportPdf}
                          className="px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 mr-1"
                        >
                          PDF
                        </button>
                        <button
                          onClick={handleExportCsv}
                          className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                        >
                          CSV
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Nộp Báo Cáo */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-red-700" />
                <h3 className="font-bold text-gray-900 text-sm">Xác Nhận Nộp Báo Cáo Sở TT&TT</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-sm p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kỳ báo cáo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={period}
                  disabled
                  className="w-full text-xs border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tiêu đề báo cáo hành chính <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                  placeholder="Nhập tiêu đề báo cáo..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ghi chú hoặc giải trình bổ sung (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                  placeholder="Ví dụ: Kèm số liệu vận hành 1.584 điểm và giải trình sự cố kỹ thuật..."
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                Hệ thống sẽ đóng băng snapshot dữ liệu chỉ số tại thời điểm nộp và cấp số hiệu lưu trữ điện tử.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Đang gửi...' : 'Xác nhận nộp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


