import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Wifi,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { CampaignDto } from '../types/models';
import {
  normalizeMediaUrl,
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  inferVideoMimeType,
} from '../utils/mediaUrl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignDto;
  /** Optional callback on Captive Portal to authenticate Wi-Fi and immediately unlock/open external video */
  onConnectToWatchVideo?: (externalVideoUrl?: string) => void;
  isConnectingWifi?: boolean;
}

export const CitizenDigitalMediaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  campaign,
  onConnectToWatchVideo,
  isConnectingWifi = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  // For YouTube videos: primary mode is 'proxy-mp4' (streamed as same-origin MP4 from Backend /api/portal/media/yt-video/{id}
  // so citizens can watch directly inside the Captive Portal even when the phone has "Không có kết nối Internet"!).
  // If proxy-mp4 fails and the phone has Internet, it falls back to 'iframe'.
  const [ytPlaybackMode, setYtPlaybackMode] = useState<'proxy-mp4' | 'iframe' | 'error'>('proxy-mp4');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const normalizedBannerUrl = useMemo(
    () => normalizeMediaUrl(campaign.bannerUrl),
    [campaign.bannerUrl]
  );

  const normalizedVideoUrl = useMemo(
    () => normalizeMediaUrl(campaign.videoUrl),
    [campaign.videoUrl]
  );

  // Trích xuất danh sách tất cả hình ảnh (chuẩn hóa về same-origin /uploads/... để không bị chặn bởi Walled Garden)
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (normalizedBannerUrl) list.push(normalizedBannerUrl);
    if (campaign.galleryUrls && Array.isArray(campaign.galleryUrls)) {
      campaign.galleryUrls.forEach((u) => {
        const norm = normalizeMediaUrl(u);
        if (norm && !list.includes(norm)) list.push(norm);
      });
    }
    return list;
  }, [normalizedBannerUrl, campaign.galleryUrls]);

  const hasVideo = Boolean(normalizedVideoUrl);
  const youtubeId = useMemo(() => extractYouTubeId(normalizedVideoUrl), [normalizedVideoUrl]);
  const isYouTube = Boolean(youtubeId);
  const sameOriginYouTubeMp4Url = useMemo(
    () => (youtubeId ? `/uploads/campaign_videos/yt_${youtubeId}.mp4` : null),
    [youtubeId]
  );
  const embedVideoUrl = useMemo(
    () => (isYouTube ? getYouTubeEmbedUrl(normalizedVideoUrl, false) : null),
    [isYouTube, normalizedVideoUrl]
  );
  const youtubeWatchUrl = useMemo(
    () => getYouTubeWatchUrl(normalizedVideoUrl) || normalizedVideoUrl,
    [normalizedVideoUrl]
  );
  const videoPosterUrl = useMemo(() => {
    if (normalizedBannerUrl) return normalizedBannerUrl;
    if (allImages.length > 0) return allImages[0];
    const ytThumb = getYouTubeThumbnailUrl(normalizedVideoUrl, true);
    if (ytThumb) return ytThumb;
    return '/banners/haiphong_city_bg.jpg';
  }, [normalizedBannerUrl, allImages, normalizedVideoUrl]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    setSelectedImageIndex(0);
    setVideoLoading(true);
    setVideoError(false);
    setYtPlaybackMode('proxy-mp4');

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isYouTube, normalizedVideoUrl]);

  // If the same-origin YouTube MP4 proxy fails for any reason, probe if direct YouTube internet access is available
  const handleYouTubeProxyMp4Error = () => {
    const probeImg = new Image();
    let handled = false;
    const timer = window.setTimeout(() => {
      if (!handled) {
        handled = true;
        setVideoLoading(false);
        setYtPlaybackMode('error');
      }
    }, 2500);

    probeImg.onload = () => {
      if (!handled) {
        handled = true;
        window.clearTimeout(timer);
        setVideoLoading(true);
        setYtPlaybackMode('iframe');
      }
    };
    probeImg.onerror = () => {
      if (!handled) {
        handled = true;
        window.clearTimeout(timer);
        setVideoLoading(false);
        setYtPlaybackMode('error');
      }
    };
    probeImg.src = `https://www.youtube.com/favicon.ico?_t=${Date.now()}`;
  };

  const handleRetryVideo = () => {
    setVideoError(false);
    setVideoLoading(true);
    if (isYouTube) {
      setYtPlaybackMode('proxy-mp4');
    }
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

  const effectiveDirectVideoUrl = isYouTube && sameOriginYouTubeMp4Url ? sameOriginYouTubeMp4Url : normalizedVideoUrl;
  const effectiveMimeType = isYouTube ? 'video/mp4' : inferVideoMimeType(normalizedVideoUrl);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-5 bg-black/75 animate-in fade-in duration-150">
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
        <div className="bg-[#a81c1c] px-4 sm:px-5 py-3 text-white flex items-center justify-between border-b border-red-900/40 shadow-sm flex-shrink-0">
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
              <h3 className="font-bold text-xs sm:text-base tracking-tight truncate max-w-xl text-white">
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-slate-800">
          {/* ================= 1. VIDEO CLIP TUYÊN TRUYỀN (ƯU TIÊN ĐẦU TIÊN KHI CÓ VIDEO) ================= */}
          {hasVideo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#a81c1c]" />
                  <span>Video clip tuyên truyền</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                  Phát trực tiếp trên Cổng Wi-Fi
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 aspect-video w-full">
                {isYouTube && ytPlaybackMode === 'iframe' && embedVideoUrl ? (
                  /* Fallback YouTube iframe nếu thiết bị đã có Internet và luồng MP4 proxy đang bận */
                  <iframe
                    src={embedVideoUrl}
                    title={campaign.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    onLoad={() => setVideoLoading(false)}
                  />
                ) : (isYouTube && ytPlaybackMode === 'error') || (!isYouTube && videoError) ? (
                  /* Fallback khi có lỗi mạng tạm thời */
                  <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4 text-white">
                    <img
                      src={videoPosterUrl}
                      alt={campaign.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-45"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/80" />
                    <div className="relative z-10 max-w-md space-y-2.5">
                      <p className="text-xs font-bold text-amber-300">
                        Đang đồng bộ luồng video tuyên truyền
                      </p>
                      <p className="text-[11px] text-slate-200 leading-relaxed">
                        Quý vị có thể bấm thử phát lại hoặc kết nối Wi-Fi miễn phí để xem video tốc độ cao.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRetryVideo}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#a81c1c] hover:bg-[#8f1818] text-white text-xs font-bold transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Thử phát lại</span>
                        </button>
                        {onConnectToWatchVideo && (
                          <button
                            type="button"
                            disabled={isConnectingWifi}
                            onClick={() => onConnectToWatchVideo(isYouTube ? youtubeWatchUrl : normalizedVideoUrl)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold transition cursor-pointer"
                          >
                            <Wifi className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Kết nối Wi-Fi & Mở Video</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Trình phát HTML5 <video> đồng nguồn (Phát trực tiếp cả video tải lên VÀ video YouTube qua Backend MP4 Streamer ngay cả khi điện thoại chưa có Internet!) */
                  <video
                    ref={videoRef}
                    key={effectiveDirectVideoUrl}
                    controls
                    playsInline
                    // @ts-ignore - Required for iOS WebKit & Captive Network Assistant (CNA) WebView
                    webkit-playsinline="true"
                    poster={videoPosterUrl}
                    preload="metadata"
                    className="w-full h-full object-contain bg-slate-950"
                    onLoadedMetadata={() => setVideoLoading(false)}
                    onCanPlay={() => setVideoLoading(false)}
                    onError={() => {
                      if (isYouTube) {
                        handleYouTubeProxyMp4Error();
                      } else {
                        setVideoLoading(false);
                        setVideoError(true);
                      }
                    }}
                  >
                    <source src={effectiveDirectVideoUrl} type={effectiveMimeType} />
                    <source src={effectiveDirectVideoUrl} />
                    Trình duyệt không hỗ trợ xem video trực tiếp.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* ================= 2. HÌNH ẢNH TUYÊN TRUYỀN & ALBUM ================= */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              {hasVideo && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#a81c1c]" />
                    <span>Hình ảnh bản tin tuyên truyền</span>
                  </span>
                  {allImages.length > 1 && (
                    <span className="text-[10px] font-medium text-slate-500">
                      {allImages.length} ảnh đính kèm
                    </span>
                  )}
                </div>
              )}

              {/* Media Stage */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 shadow-md flex items-center justify-center min-h-[200px] max-h-[420px] group select-none border border-slate-800">
                <img
                  src={allImages[selectedImageIndex]}
                  alt={campaign.title}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full h-auto max-h-[420px] object-contain mx-auto transition-transform duration-300"
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
                      className="absolute left-3 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition shadow-md cursor-pointer border border-white/20"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition shadow-md cursor-pointer border border-white/20"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 z-20 bg-black/60 text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-white/10">
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
                      <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
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

            <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
              {campaign.title}
            </h2>
          </div>

          {/* 4. Nội dung bài viết tuyên truyền số */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 leading-relaxed text-xs sm:text-sm text-slate-700 whitespace-pre-line font-sans space-y-2">
            {campaign.description || (
              <p>
                Ủy ban Nhân dân Thành phố Hải Phòng phát động chiến dịch tuyên truyền đến toàn thể nhân dân đang sinh hoạt tại các Nhà văn hóa thôn, tổ dân phố trên địa bàn thành phố. Đề nghị bà con tích cực tham gia chuyển đổi số, sử dụng dịch vụ công trực tuyến và bảo vệ an toàn thông tin khi truy cập mạng Wi-Fi công cộng.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
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
