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
import { ImageUploadInput } from '../../components/ImageUploadInput';

export const PortalBuilderPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [template, setTemplate] = useState<PortalTemplateDto>({
    name: 'Giao diện Nhà văn hóa Tiêu chuẩn',
    templateType: 'CULTURAL',
    themeColor: '#0284c7',
    backgroundColor: '#0c2340',
    backgroundImageUrl: '/banners/haiphong_city_bg.jpg',
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
      setSuccessMsg('Đã lưu và áp dụng giao diện Cổng chào thành công trên toàn hệ thống!');
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

              <div className="space-y-4 pt-1">
                {/* Background Image with Local Upload & Quick Presets */}
                <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                  <ImageUploadInput
                    value={template.backgroundImageUrl || ''}
                    onChange={(url) => setTemplate({ ...template, backgroundImageUrl: url })}
                    label="Hình nền Cổng chào toàn TP (Background Wallpaper)"
                    helperText="Tải ảnh nền từ máy tính hoặc dán URL (Độ phân giải khuyến nghị: 1920x1080)"
                    category="banners"
                  />
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Gợi ý hình nền biểu tượng Hải Phòng:
                    </span>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setTemplate({ ...template, backgroundImageUrl: '/banners/haiphong_city_bg.jpg' })}
                        className={`px-2.5 py-1 rounded border transition font-medium cursor-pointer ${
                          template.backgroundImageUrl === '/banners/haiphong_city_bg.jpg'
                            ? 'bg-[#004b87] text-white border-[#004b87]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        🌉 Cầu Hoàng Văn Thụ (Đêm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplate({ ...template, backgroundImageUrl: '/banners/haiphong_culture_house.jpg' })}
                        className={`px-2.5 py-1 rounded border transition font-medium cursor-pointer ${
                          template.backgroundImageUrl === '/banners/haiphong_culture_house.jpg'
                            ? 'bg-[#004b87] text-white border-[#004b87]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        🏛️ Nhà văn hóa Hải Phòng
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplate({ ...template, backgroundImageUrl: '/banners/central.jpg' })}
                        className={`px-2.5 py-1 rounded border transition font-medium cursor-pointer ${
                          template.backgroundImageUrl === '/banners/central.jpg'
                            ? 'bg-[#004b87] text-white border-[#004b87]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        🏙️ Trung tâm Thành phố
                      </button>
                    </div>
                  </div>
                </div>

                <ImageUploadInput
                  value={template.bannerUrl || ''}
                  onChange={(url) => setTemplate({ ...template, bannerUrl: url })}
                  label="Hình ảnh Banner đầu trang (Hiển thị chung toàn TP)"
                  helperText="Tải banner từ máy tính hoặc nhập liên kết ảnh"
                  category="banners"
                />

                <ImageUploadInput
                  value={template.logoUrl || ''}
                  onChange={(url) => setTemplate({ ...template, logoUrl: url })}
                  label="Biểu trưng chính thức (Logo)"
                  helperText="Tải logo từ máy tính hoặc nhập liên kết ảnh"
                  category="logos"
                />
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

              {/* Dynamic Preview Content with Real Background Wallpaper */}
              <div className="flex-1 overflow-y-auto p-3 pt-7 flex flex-col justify-between relative">
                {/* Background Wallpaper Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: `url('${template.backgroundImageUrl || '/banners/haiphong_city_bg.jpg'}')`,
                    backgroundColor: template.backgroundColor || '#0c2340',
                  }}
                />
                {/* GovTech dark overlay with slight blur */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/75 to-slate-950/85 backdrop-blur-[1px]" />

                {/* Central Welcome Card */}
                <div className="relative z-10 bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden my-auto space-y-0">
                  {/* Card Red Header */}
                  <div className="bg-[#a81c1c] text-white text-center p-3 border-b border-[#881313]">
                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-xs bg-red-800 text-yellow-300 font-bold text-[10px] mb-1 border border-amber-300/40">
                      ★
                    </div>
                    <div className="text-[8.5px] font-bold tracking-widest text-yellow-300 uppercase">
                      UBND THÀNH PHỐ HẢI PHÒNG
                    </div>
                    <h2 className="text-xs font-extrabold uppercase text-white mt-0.5">
                      {template.title}
                    </h2>
                  </div>

                  {/* Banner Photo */}
                  {template.bannerUrl && (
                    <div className="relative overflow-hidden border-b border-slate-200">
                      <img src={template.bannerUrl} alt="Banner" className="w-full h-24 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <span className="text-[10px] font-bold text-white drop-shadow-xs">Ảnh thực tế Nhà văn hóa</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 space-y-3">
                    {/* Welcome Message Card */}
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-sans">
                      {template.welcomeText}
                    </div>

                    {/* Mock Terms Checkbox */}
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                      <div className="w-3 h-3 rounded border border-slate-300 bg-white mt-0.5 flex-shrink-0 flex items-center justify-center text-[#004b87] text-[8px] font-bold">
                        ✓
                      </div>
                      <span className="leading-tight">Đồng ý quy chế truy cập Wi-Fi công cộng TP Hải Phòng.</span>
                    </div>

                    {/* Connect Button */}
                    <button
                      type="button"
                      className="w-full py-2.5 rounded text-white font-bold text-xs shadow-md transition"
                      style={{ backgroundColor: template.themeColor }}
                    >
                      {template.buttonText}
                    </button>
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="relative z-10 text-center pt-2 text-[9px] text-slate-300 drop-shadow-xs font-mono">
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
