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
  const [ytReachability, setYtReachability] = useState<'checking' | 'reachable' | 'blocked'>('checking');
  const [ytPlayerStarted, setYtPlayerStarted] = useState(false);
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
  const isYouTube = Boolean(youtubeId) || (hasVideo && Boolean(getYouTubeEmbedUrl(normalizedVideoUrl)));
  const embedVideoUrl = useMemo(
    () => (isYouTube ? getYouTubeEmbedUrl(normalizedVideoUrl, ytPlayerStarted) : null),
    [isYouTube, normalizedVideoUrl, ytPlayerStarted]
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
    setYtPlayerStarted(false);

    if (isYouTube) {
      setYtReachability('checking');
      let finished = false;
      const probeImg = new Image();
      const timer = window.setTimeout(() => {
        if (!finished) {
          finished = true;
          setYtReachability('blocked');
        }
      }, 2800);

      probeImg.onload = () => {
        if (!finished) {
          finished = true;
          window.clearTimeout(timer);
          setYtReachability('reachable');
        }
      };
      probeImg.onerror = () => {
        if (!finished) {
          finished = true;
          window.clearTimeout(timer);
          setYtReachability('blocked');
        }
      };
      probeImg.src = `https://www.youtube.com/favicon.ico?_t=${Date.now()}`;

      return () => {
        finished = true;
        window.clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isYouTube, normalizedVideoUrl]);

  const handleRetryVideo = () => {
    setVideoError(false);
    setVideoLoading(true);
    if (isYouTube) {
      setYtReachability('reachable');
      setYtPlayerStarted(true);
    } else if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

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
                <div className="flex items-center gap-2">
                  {isYouTube && youtubeWatchUrl && (
                    <a
                      href={youtubeWatchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a81c1c] hover:underline"
                    >
                      <span>Mở YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-full border border-slate-200">
                    {isYouTube ? 'YouTube' : 'Video trực tiếp'}
                  </span>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 aspect-video w-full">
                {isYouTube && embedVideoUrl ? (
                  ytReachability === 'blocked' ? (
                    /* Fallback khi thiết bị đang trong Captive Portal Walled Garden chưa mở mạng ra YouTube */
                    <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4 text-white">
                      <img
                        src={videoPosterUrl}
                        alt={campaign.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-45"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/75 to-slate-950/60" />

                      <div className="relative z-10 max-w-md space-y-3">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center mx-auto shadow-lg border border-white/20">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            Video phát từ YouTube cần kết nối Internet
                          </h4>
                          <p className="text-[11px] text-slate-200 leading-relaxed">
                            Thiết bị của quý vị đang ở màn hình chờ Cổng Wi-Fi nên chưa mở đường truyền ra YouTube. Vui lòng bấm kết nối Wi-Fi miễn phí để xem ngay video này.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          {onConnectToWatchVideo ? (
                            <button
                              type="button"
                              disabled={isConnectingWifi}
                              onClick={() => onConnectToWatchVideo(youtubeWatchUrl)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ee0033] hover:bg-[#c4002b] text-white text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-60"
                            >
                              {isConnectingWifi ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang mở kết nối Wi-Fi...</span>
                                </>
                              ) : (
                                <>
                                  <Wifi className="w-3.5 h-3.5 text-yellow-300" />
                                  <span>Kết nối Wi-Fi & Xem Video Ngay</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <a
                              href={youtubeWatchUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#ee0033] hover:bg-[#c4002b] text-white text-xs font-bold shadow-lg transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Mở Video trên YouTube</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={handleRetryVideo}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Thử phát tại đây</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Trình phát YouTube chuẩn Mobile (playsinline=1, strict-origin-when-cross-origin, có lớp poster chống đen màn hình) */
                    <div className="relative w-full h-full">
                      {videoLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white">
                          <img
                            src={videoPosterUrl}
                            alt={campaign.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                            }}
                          />
                          <div className="relative z-10 flex flex-col items-center gap-2 bg-black/60 px-4 py-2.5 rounded-xl backdrop-blur-xs">
                            <Loader2 className="w-6 h-6 animate-spin text-yellow-300" />
                            <span className="text-[11px] font-semibold">Đang tải trình phát video...</span>
                          </div>
                        </div>
                      )}
                      <iframe
                        src={embedVideoUrl}
                        title={campaign.title}
                        className="w-full h-full border-0 relative z-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        onLoad={() => setVideoLoading(false)}
                      />
                    </div>
                  )
                ) : videoError ? (
                  /* Fallback khi file video MP4 bị lỗi hoặc không tương thích codec trên trình duyệt di động */
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
                        Không thể phát trực tiếp luồng video trên thiết bị này
                      </p>
                      <p className="text-[11px] text-slate-200">
                        Quý vị có thể bấm thử tải lại hoặc mở trực tiếp tệp video bằng trình phát của điện thoại.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRetryVideo}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#a81c1c] hover:bg-[#8f1818] text-white text-xs font-bold transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Thử phát lại</span>
                        </button>
                        <a
                          href={normalizedVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở trình phát thiết bị</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Trình phát HTML5 <video> chuẩn iOS Safari & Android Chrome với HTTP 206 Byte-Range & Poster */
                  <video
                    ref={videoRef}
                    key={normalizedVideoUrl}
                    controls
                    playsInline
                    // @ts-ignore - Required for older iOS WebKit & Captive Network Assistant WebView
                    webkit-playsinline="true"
                    poster={videoPosterUrl}
                    preload="metadata"
                    className="w-full h-full object-contain bg-slate-950"
                    onLoadedMetadata={() => setVideoLoading(false)}
                    onCanPlay={() => setVideoLoading(false)}
                    onError={() => {
                      setVideoLoading(false);
                      setVideoError(true);
                    }}
                  >
                    <source src={normalizedVideoUrl} type={inferVideoMimeType(normalizedVideoUrl)} />
                    <source src={normalizedVideoUrl} />
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
