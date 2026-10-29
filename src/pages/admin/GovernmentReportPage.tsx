import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { GovernmentReportDto, DistrictStatDto } from '../../types/models';
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
  Landmark
} from 'lucide-react';

export const GovernmentReportPage: React.FC = () => {
  const [report, setReport] = useState<GovernmentReportDto | null>(null);
  const [period, setPeriod] = useState<string>('MONTH');
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    loadReport();
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.open(`/api/v1/admin/reports/government/export/csv?period=${encodeURIComponent(period)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden when printing) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-red-700" />
            Báo Cáo Hành Chính Sở TT&TT / UBND Thành Phố Hải Phòng
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Mẫu báo cáo tiến độ và chất lượng khai thác mạng Wi-Fi công cộng tại 1.584 Nhà văn hóa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 font-medium"
          >
            <option value="MONTH">Kỳ báo cáo: Tháng này</option>
            <option value="PREV_MONTH">Kỳ báo cáo: Tháng trước</option>
            <option value="QUARTER">Kỳ báo cáo: Quý 3/2026</option>
            <option value="YEAR">Kỳ báo cáo: Năm 2026</option>
          </select>

          <button
            onClick={loadReport}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            In báo cáo
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4" />
            Xuất file CSV
          </button>
        </div>
      </div>

      {/* Main Report Document Canvas */}
      {report && (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-300 shadow-sm print:border-none print:shadow-none print:p-0 max-w-5xl mx-auto">
          {/* Official Administrative Header */}
          <div className="flex justify-between items-start text-center pb-6 border-b-2 border-red-800 text-xs text-gray-800 font-serif">
            <div className="w-1/2 text-left">
              <div className="font-bold uppercase tracking-wider">{report.cityTitle}</div>
              <div className="font-extrabold uppercase text-red-800 text-sm mt-0.5">{report.authorityName}</div>
              <div className="text-[11px] text-gray-600 mt-1">Số: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /BC-STTTT-CNTT</div>
            </div>

            <div className="w-1/2 text-right">
              <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-bold underline mt-0.5">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-[11px] text-gray-500 italic mt-2">
                Hải Phòng, ngày {new Date(report.generatedAt).getDate()} tháng{' '}
                {new Date(report.generatedAt).getMonth() + 1} năm {new Date(report.generatedAt).getFullYear()}
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase font-serif">
              Báo Cáo Kỹ Thuật & Vận Hành Hệ Thống Mạng Wi-Fi Công Cộng
            </h2>
            <p className="text-sm font-semibold text-red-800 mt-1">
              Phục vụ chuyển đổi số và đời sống văn hóa nhân dân tại 1.584 Nhà văn hóa thôn, tổ dân phố
            </p>
            <p className="text-xs text-gray-500 italic mt-1 font-mono">
              (Kỳ báo cáo: {report.reportPeriod} - Dữ liệu thực thi thời gian thực)
            </p>
          </div>

          {/* Part I: Macro KPIs Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-serif border-b pb-1">
              I. ĐÁNH GIÁ CHỈ SỐ TỔNG THỂ TOÀN THÀNH PHỐ
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Quy mô điểm phát</span>
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  {report.activeLocations} / {report.totalTargetLocations}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  Đạt 100% chỉ tiêu quy hoạch
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Độ khả dụng mạng</span>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-600">
                  {report.networkAvailabilityRate}%
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Cam kết theo đề án: &gt; 99.0%</div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Lượt người dân truy cập</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-600 font-mono">
                  {report.totalCitizenSessions.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Phiên đăng nhập thành công</div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>Dung lượng dữ liệu</span>
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-indigo-600">
                  {report.totalDataServedTb} TB
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Phục vụ dịch vụ công & tin tức</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Mức độ hài lòng của nhân dân
                </div>
                <div className="mt-1 text-2xl font-black text-emerald-700">
                  {report.citizenSatisfactionRate}%
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Đánh giá Tốt / Rất tốt qua khảo sát ý kiến
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
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

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Thời gian phục hồi trung bình (MTTR)
                </div>
                <div className="mt-1 text-2xl font-black text-amber-700">
                  {report.averageResolutionHours} Giờ
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Hạn mức cam kết tối đa: 4h - 8h
                </div>
              </div>
            </div>
          </div>

          {/* Part II: District Breakdown Table */}
          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-serif border-b pb-1">
              II. CHI TIẾT TỔNG HỢP THEO 15 QUẬN / HUYỆN THÀNH PHỐ HẢI PHÒNG
            </h3>

            <div className="overflow-x-auto border border-gray-300 rounded-xl">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead className="bg-gray-100 font-serif text-gray-800">
                  <tr>
                    <th className="px-3 py-2.5 text-center font-bold">STT</th>
                    <th className="px-3 py-2.5 text-left font-bold">Địa bàn Quận / Huyện</th>
                    <th className="px-3 py-2.5 text-center font-bold">Tổng số NVH</th>
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
                      <td className="px-3 py-2 text-center font-mono text-emerald-700 font-bold">{item.onlineLocations}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-800">{item.availabilityPercent}%</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-700">{item.totalSessions.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">{item.totalDataGb.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-700">{item.totalIncidents}</td>
                      <td className="px-3 py-2 text-center font-mono text-emerald-600 font-bold">{item.slaCompliancePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures Footer */}
          <div className="mt-12 pt-6 grid grid-cols-2 text-center text-xs font-serif text-gray-800">
            <div>
              <div className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</div>
              <div className="text-[11px] text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-20" />
              <div className="font-bold">Đội Quản Trị Hệ Thống Wi-Fi</div>
            </div>

            <div>
              <div className="font-bold uppercase">GIÁM ĐỐC SỞ THÔNG TIN VÀ TRUYỀN THÔNG</div>
              <div className="text-[11px] text-gray-500 italic mt-0.5">(Ký tên và đóng dấu)</div>
              <div className="h-20" />
              <div className="font-bold uppercase text-red-800">ĐÃ PHÊ DUYỆT BÁO CÁO</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
