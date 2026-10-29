import React, { useEffect, useState } from 'react';
import {
  Palette,
  Eye,
  Save,
  CheckCircle2,
  Smartphone,
  Loader2,
  RefreshCw,
  Image,
  Type,
  Layout,
  ExternalLink
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { PortalTemplateDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';

export const PortalBuilderPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [template, setTemplate] = useState<PortalTemplateDto>({
    name: 'Giao diện Nhà văn hóa Tiêu chuẩn',
    templateType: 'CULTURAL',
    themeColor: '#0284c7',
    backgroundColor: '#f8fafc',
    logoUrl: '',
    bannerUrl: '',
    title: 'Cổng Thông Tin Wi-Fi Nhà Văn Hóa',
    welcomeText: 'Chào mừng quý công dân và du khách đến với Nhà văn hóa. Vui lòng bấm Kết nối để sử dụng mạng Internet công cộng tốc độ cao.',
    buttonText: 'Bắt Đầu Kết Nối Wi-Fi',
    termsText: 'Bằng việc truy cập mạng Wi-Fi công cộng này, quý vị đồng ý tuân thủ quy tắc ứng xử trên không gian mạng và các quy định pháp luật hiện hành.',
    active: true,
  });

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const active = await adminApi.getActivePortalTemplate();
      if (active) {
        setTemplate(active);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải cấu hình giao diện Cổng chào.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setError(null);
    try {
      const saved = await adminApi.savePortalTemplate(template);
      setTemplate(saved);
      setSuccessMsg('Đã lưu và áp dụng giao diện Cổng chào thành công trên toàn hệ thống 1.584 điểm phát!');
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu cấu hình giao diện.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trình Dựng Cổng Chào Wi-Fi (Portal Builder)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tùy biến giao diện Captive Portal, màu sắc nhận diện, biểu trưng (Logo), lời chào mừng và quy định sử dụng cho công dân.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/portal"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#004b87]" /> Xem trực tiếp Cổng khách
          </a>
          <button
            onClick={loadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Khôi phục
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {successMsg && <AlertBanner type="success" message={successMsg} />}

      {loading ? (
        <div className="bg-white p-12 rounded border border-slate-200 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
          Đang tải cấu hình giao diện...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Layout & Color Settings (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded border border-slate-300 shadow-xs">
            <form onSubmit={handleSave} className="space-y-5 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 font-bold text-slate-800 text-sm">
                <Palette className="w-4 h-4 text-[#004b87]" /> Thiết Lập Phong Cách & Nội Dung
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bộ mẫu giao diện</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-[#004b87]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Màu chủ đạo (Theme Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.themeColor}
                      onChange={(e) => setTemplate({ ...template, themeColor: e.target.value })}
                      className="w-9 h-9 rounded-sm border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={template.themeColor}
                      onChange={(e) => setTemplate({ ...template, themeColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Màu nền trang (Background)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={template.backgroundColor}
                      onChange={(e) => setTemplate({ ...template, backgroundColor: e.target.value })}
                      className="w-9 h-9 rounded-sm border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={template.backgroundColor}
                      onChange={(e) => setTemplate({ ...template, backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề Cổng chào (H1)</label>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                  placeholder="Ví dụ: Cổng Thông Tin Wi-Fi Nhà Văn Hóa"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-[#004b87] font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lời chào mừng công dân</label>
                <textarea
                  rows={2}
                  value={template.welcomeText || ''}
                  onChange={(e) => setTemplate({ ...template, welcomeText: e.target.value })}
                  placeholder="Thông điệp chào mừng hiển thị phía trên nút kết nối..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-[#004b87]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dòng chữ nút kết nối chính</label>
                <input
                  type="text"
                  value={template.buttonText}
                  onChange={(e) => setTemplate({ ...template, buttonText: e.target.value })}
                  placeholder="Ví dụ: Bắt Đầu Kết Nối Wi-Fi"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-[#004b87] font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Biểu trưng (Logo)</label>
                  <input
                    type="text"
                    value={template.logoUrl || ''}
                    onChange={(e) => setTemplate({ ...template, logoUrl: e.target.value })}
                    placeholder="https://... hoặc /logo.png"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Banner đầu trang</label>
                  <input
                    type="text"
                    value={template.bannerUrl || ''}
                    onChange={(e) => setTemplate({ ...template, bannerUrl: e.target.value })}
                    placeholder="https://... hoặc /banner.jpg"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Điều khoản & Quy định an toàn mạng</label>
                <textarea
                  rows={3}
                  value={template.termsText || ''}
                  onChange={(e) => setTemplate({ ...template, termsText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition shadow-sm shadow-sky-600/20 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu & Xuất Bản Toàn Hệ Thống
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Preview: Smartphone Mockup (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
              <Smartphone className="w-4 h-4" /> Xem Trước Trên Màn Hình Điện Thoại (375x667)
            </div>

            {/* Phone Bezel */}
            <div className="w-[340px] h-[640px] rounded-[40px] border-[10px] border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col relative">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Dynamic Preview Content */}
              <div
                className="flex-1 overflow-y-auto p-5 pt-8 flex flex-col justify-between"
                style={{ backgroundColor: template.backgroundColor }}
              >
                <div className="space-y-4">
                  {/* Logo or Badge */}
                  <div className="text-center pt-2">
                    {template.logoUrl ? (
                      <img src={template.logoUrl} alt="Logo" className="h-10 mx-auto object-contain" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded mx-auto flex items-center justify-center text-white shadow-md font-bold text-lg"
                        style={{ backgroundColor: template.themeColor }}
                      >
                        HP
                      </div>
                    )}
                    <h2 className="text-base font-bold text-slate-900 mt-2 tracking-tight leading-snug">
                      {template.title}
                    </h2>
                    <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                      Nhà Văn Hóa Thôn / Tổ Dân Phố
                    </span>
                  </div>

                  {/* Banner */}
                  {template.bannerUrl && (
                    <div className="rounded-sm overflow-hidden shadow-xs border border-slate-200">
                      <img src={template.bannerUrl} alt="Banner" className="w-full h-28 object-cover" />
                    </div>
                  )}

                  {/* Welcome Message Card */}
                  <div className="p-3.5 rounded-sm bg-white border border-slate-300 shadow-xs text-[11px] text-slate-600 leading-relaxed">
                    {template.welcomeText}
                  </div>

                  {/* Mock Terms Checkbox */}
                  <div className="flex items-start gap-2 pt-1 text-[10px] text-slate-500">
                    <div className="w-3.5 h-3.5 rounded border border-slate-300 bg-white mt-0.5 flex-shrink-0 flex items-center justify-center text-[#004b87]">
                      ✓
                    </div>
                    <span>Tôi đồng ý với Quy chế sử dụng mạng Internet công cộng TP Hải Phòng.</span>
                  </div>

                  {/* Connect Button */}
                  <button
                    type="button"
                    className="w-full py-3 rounded-sm text-white font-bold text-xs shadow-md transition"
                    style={{ backgroundColor: template.themeColor }}
                  >
                    {template.buttonText}
                  </button>
                </div>

                {/* Footer Notice */}
                <div className="text-center pt-4 text-[9px] text-slate-400">
                  Hệ thống Quản lý Wi-Fi Công cộng TP. Hải Phòng
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
