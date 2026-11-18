import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Megaphone, 
  ExternalLink, 
  Play, 
  Landmark,
  Film,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CampaignDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignDto;
}

export const CitizenDigitalMediaModal: React.FC<Props> = ({ isOpen, onClose, campaign }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedImageIndex(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Trích xuất danh sách tất cả hình ảnh
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (campaign.bannerUrl) list.push(campaign.bannerUrl);
    if (campaign.galleryUrls && Array.isArray(campaign.galleryUrls)) {
      campaign.galleryUrls.forEach((u) => {
        if (u && !list.includes(u)) list.push(u);
      });
    }
    return list;
  }, [campaign.bannerUrl, campaign.galleryUrls]);

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

  const hasVideo = !!campaign.videoUrl;
  const isYouTube = hasVideo && !!getEmbedUrl(campaign.videoUrl);
  const embedVideoUrl = isYouTube ? getEmbedUrl(campaign.videoUrl) : null;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden transform transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Phong cách Cổng thông tin chính quyền Thành phố */}
        <div className="bg-[#a81c1c] px-5 py-3.5 text-white flex items-center justify-between border-b border-red-900/40 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-yellow-400 text-red-950 rounded-md shadow-xs flex-shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-yellow-300 uppercase">
                  CỔNG THÔNG TIN TP. HẢI PHÒNG
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight truncate max-w-xl text-white">
                {campaign.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer flex-shrink-0"
            title="Đóng bản tin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* ================= 1. HÌNH ẢNH TUYÊN TRUYỀN & ALBUM ================= */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              {/* Media Stage */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 shadow-md flex items-center justify-center min-h-[240px] max-h-[460px] group select-none border border-slate-800">
                {/* Ambient Blurred Backdrop for visual depth */}
                <div 
                  className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-25 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${allImages[selectedImageIndex]})` }}
                />

                <img
                  src={allImages[selectedImageIndex]}
                  alt={campaign.title}
                  className="relative z-10 w-full h-auto max-h-[460px] object-contain mx-auto transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                  }}
                />

                {/* Navigation Arrows if multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                      className="absolute left-3 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition shadow-md cursor-pointer border border-white/20"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition shadow-md cursor-pointer border border-white/20"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {/* Minimalist image index counter */}
                    <div className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-white/10">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                      <span>{selectedImageIndex + 1} / {allImages.length}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails Strip if multiple images */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#a81c1c] ring-2 ring-red-500/25 scale-102 shadow-xs'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 2. VIDEO CLIP TUYÊN TRUYỀN (NẾU CÓ) ================= */}
          {hasVideo && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#a81c1c]" />
                  <span>Video clip tuyên truyền</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-full border border-slate-200">
                  {isYouTube ? 'YouTube' : 'Video phát trực tiếp'}
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-black aspect-video w-full">
                {isYouTube && embedVideoUrl ? (
                  <iframe
                    src={embedVideoUrl}
                    title={campaign.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={campaign.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                    preload="metadata"
                  >
                    Trình duyệt không hỗ trợ xem video trực tiếp.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* 3. Tiêu đề và nhãn bản tin */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-[#a81c1c] font-semibold border border-red-200/70">
                <Landmark className="w-3.5 h-3.5" />
                UBND Thành phố Hải Phòng
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                Bản tin tuyên truyền số
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {campaign.title}
            </h2>
          </div>

          {/* 4. Nội dung bài viết tuyên truyền số */}
          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 leading-relaxed text-xs sm:text-sm text-slate-700 whitespace-pre-line font-sans space-y-2">
            {campaign.description || (
              <p>
                Ủy ban Nhân dân Thành phố Hải Phòng phát động chiến dịch tuyên truyền đến toàn thể nhân dân đang sinh hoạt tại các Nhà văn hóa thôn, tổ dân phố trên địa bàn thành phố. Đề nghị bà con tích cực tham gia chuyển đổi số, sử dụng dịch vụ công trực tuyến và bảo vệ an toàn thông tin khi truy cập mạng Wi-Fi công cộng.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {campaign.actionUrl && (
              <a
                href={campaign.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#a81c1c] hover:bg-[#8f1818] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Cổng Dịch Vụ Công TP. Hải Phòng</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
