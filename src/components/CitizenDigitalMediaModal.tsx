import React from 'react';
import { 
  X, 
  Megaphone, 
  ExternalLink, 
  Play, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Share2, 
  Sparkles,
  Landmark,
  Tv
} from 'lucide-react';
import { CampaignDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignDto;
}

export const CitizenDigitalMediaModal: React.FC<Props> = ({ isOpen, onClose, campaign }) => {
  if (!isOpen) return null;

  // Trích xuất link embed YouTube nếu có
  const getEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    if (url.includes('youtube.com/embed')) return url;
    return null;
  };

  const embedVideoUrl = getEmbedUrl(campaign.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Phong cách Truyền thông số Chính quyền */}
        <div className="bg-gradient-to-r from-[#a81c1c] via-[#881313] to-[#004b87] px-5 py-3.5 text-white flex items-center justify-between border-b border-red-900 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-yellow-400 text-red-900 rounded-md shadow-xs">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-yellow-300 uppercase">
                  TRUYỀN THÔNG SỐ TP. HẢI PHÒNG
                </span>
                
              </div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate max-w-lg mt-0.5 text-white">
                {campaign.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng bản tin số"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Trình chiếu đa phương tiện số */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          {/* 1. Khung Video Clip tuyên truyền nếu có */}
          {embedVideoUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-300 shadow-md bg-black aspect-video w-full">
              <iframe
                src={embedVideoUrl}
                title={campaign.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : campaign.bannerUrl ? (
            /* 2. Ảnh Poster / Banner Truyền thông số kích thước lớn */
            <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-md max-h-80 bg-slate-900 group">
              <img
                src={campaign.bannerUrl}
                alt={campaign.title}
                className="w-full h-auto max-h-80 object-contain mx-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : null}

          {/* 3. Tiêu đề và thông tin chiến dịch */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Chính sách & Tuyên truyền số
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                <Landmark className="w-3 h-3 text-blue-600" />
                UBND Thành Phố Hải Phòng
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {campaign.title}
            </h2>
          </div>

          {/* 4. Nội dung bài viết tuyên truyền số */}
          <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 leading-relaxed text-xs sm:text-sm text-slate-700 whitespace-pre-line font-sans space-y-2">
            {campaign.description || (
              <p>
                Ủy ban Nhân dân Thành phố Hải Phòng phát động chiến dịch tuyên truyền đến toàn thể nhân dân đang sinh hoạt tại 1.584 Nhà văn hóa thôn, tổ dân phố trên địa bàn 15 quận, huyện. Đề nghị bà con tích cực tham gia chuyển đổi số, sử dụng dịch vụ công trực tuyến và bảo vệ an toàn thông tin khi truy cập mạng Wi-Fi công cộng.
              </p>
            )}
          </div>

          {/* 5. Khung hướng dẫn hành động công dân */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#004b87] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong>Hướng dẫn người dân:</strong> Quý vị có thể mở trực tiếp trang chỉ đạo / Cổng Dịch vụ công thành phố bên dưới để tra cứu chi tiết hoặc nộp hồ sơ trực tuyến hoàn toàn miễn phí ngay tại Nhà văn hóa.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded text-xs font-semibold cursor-pointer transition"
          >
            Đóng bản tin
          </button>

          <div className="flex items-center gap-2">
            {campaign.actionUrl && (
              <a
                href={campaign.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Mở Cổng Thông Tin / Dịch Vụ Công</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
