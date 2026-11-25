import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  Compass, 
  ShieldCheck,
  Building,
  Wrench,
  HelpCircle,
  Radio,
  Layers
} from 'lucide-react';
import { AdminUserDto } from '../types/models';

export interface TourStep {
  id: string;
  targetSelector: string; // CSS Selector or data-tour attribute
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  badge?: string;
  groupTitle?: string;
}

export interface NavTourItem {
  to: string;
  label: string;
  tourId?: string;
}

export interface NavTourGroup {
  groupTitle: string;
  items: NavTourItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUserDto | null;
  navGroups?: NavTourGroup[];
}

// Bảng từ điển hướng dẫn chi tiết cho từng chức năng theo phân quyền
const MODULE_TOUR_DEFINITIONS: Record<string, { title: string; content: string; badge: string; placement?: 'top' | 'bottom' | 'left' | 'right' }> = {
  'nav-dashboard': {
    title: 'Trung Tâm Điều Hành Tổng Quan',
    content: 'Theo dõi nhịp đập số toàn thành phố: số lượng trạm phát hoạt động, lưu lượng data phục vụ miễn phí, số phiên truy cập đồng thời và tình trạng các điểm.',
    badge: 'Tổng quan điều hành',
    placement: 'right'
  },
  'nav-gis': {
    title: 'Bản Đồ Số GIS 1.584 Điểm Phát',
    content: 'Trực quan hóa mạng lưới điểm phát theo tọa độ GPS, ranh giới hành chính và bản đồ nhiệt mật độ thiết bị kết nối.',
    badge: 'Bản đồ GIS',
    placement: 'right'
  },
  'nav-locations': {
    title: 'Danh Bạ Nhà Văn Hóa Cơ Sở',
    content: 'Quản lý hồ sơ 1.584 điểm, phân cấp địa bàn hành chính.',
    badge: 'Danh bạ địa bàn',
    placement: 'right'
  },
  'nav-devices': {
    title: 'Quản Lý Thiết Bị',
    content: 'Giám sát trạng thái Online/Offline của trạm phát Grandstream AP, kiểm tra Ping, reboot từ xa.',
    badge: 'Hạ tầng thiết bị',
    placement: 'right'
  },
  'nav-sessions': {
    title: 'Quản Lý Phiên Truy Cập Người Dân',
    content: 'Theo dõi thời gian thực các phiên công dân đang kết nối Wi-Fi, địa chỉ MAC, lưu lượng tải, điểm phát kết nối và hỗ trợ ngắt phiên bất thường.',
    badge: 'Phiên kết nối',
    placement: 'right'
  },
  'nav-incidents': {
    title: 'Xử Lý Sự Cố Viễn Thông & SLA Cam Kết',
    content: 'Tiếp nhận phiếu sự cố tự động và phản ánh dân sinh (mất điện, đứt cáp, lỗi AP), điều phối kỹ thuật hiện trường theo thời hạn cam kết xử lý SLA.',
    badge: 'Giám sát mạng & SLA',
    placement: 'right'
  },
  'nav-blacklist': {
    title: 'Danh Sách Cấm MAC & An Ninh Mạng',
    content: 'Quản lý danh sách các thiết bị vi phạm chính sách, phát tán mã độc hoặc gian lận kết nối, tự động đồng bộ chặn trên toàn bộ hệ thống gateway.',
    badge: 'An ninh mạng',
    placement: 'right'
  },
  'nav-access-logs': {
    title: 'Nhật Ký Pháp Lý Lưu Trữ 12 Tháng',
    content: 'Lưu trữ và tra cứu lịch sử kết nối theo quy định của Bộ Thông tin & Truyền thông, phục vụ công tác an toàn thông tin và truy vết nghiệp vụ khi có yêu cầu.',
    badge: 'Pháp lý mạng',
    placement: 'right'
  },
  'nav-portal-builder': {
    title: 'Trình Dựng & Tùy Biến Cổng Chào',
    content: 'Tùy biến giao diện Cổng chào công dân (/portal), biểu trưng thành phố, biểu ngữ tuyên truyền.',
    badge: 'Cổng chào số',
    placement: 'right'
  },
  'nav-campaigns': {
    title: 'Chiến Dịch Tuyên Truyền & Chính Sách',
    content: 'Đăng tải video, áp phích tuyên truyền Dịch vụ công trực tuyến, phân bổ phát sóng chính xác theo từng Quận/Huyện/Xã.',
    badge: 'Truyền thông số',
    placement: 'right'
  },
  'nav-surveys': {
    title: 'Khảo Sát Ý Kiến Nhân Dân',
    content: 'Tạo, thu thập khảo sát ý kiến của nhân dân',
    badge: 'Khảo sát dân ý',
    placement: 'right'
  },
  'nav-dns-filtering': {
    title: 'Bộ Lọc Tên Miền DNS & Điều Hướng DVC',
    content: 'Chặn truy cập website độc hại, cấu hình danh sách ưu tiên truy cập.',
    badge: 'An toàn thông tin',
    placement: 'right'
  },
  'nav-government-report': {
    title: 'Báo Cáo Sở KH&CN & UBND Thành Phố',
    content: 'Tổng hợp số liệu chỉ tiêu phục vụ công dân, kết xuất báo cáo hành chính.',
    badge: 'Báo cáo hành chính',
    placement: 'right'
  },
  'nav-users': {
    title: 'Cán Bộ 3 Cấp & Phân Bổ Địa Bàn',
    content: 'Cấp phát và quản lý tài khoản cán bộ phân cấp 3 cấp (Admin, Sở KH&CN, Xã/Phường).',
    badge: 'Quản trị nhân sự',
    placement: 'right'
  },
  'nav-role-permissions': {
    title: 'Ma Trận Phân Quyền Vai Trò (RBAC)',
    content: 'Thiết lập quyền Xem/Sửa/Xóa chi tiết theo từng phân hệ chức năng cho từng nhóm vai trò cán bộ trong toàn hệ thống.',
    badge: 'Phân quyền RBAC',
    placement: 'right'
  },
  'nav-system-settings': {
    title: 'Cấu Hình Tham Số Hệ Thống',
    content: 'Thiết lập thời gian hết hạn phiên (Session TTL), hạn mức băng thông mặc định, cấu hình xác thực OTP Zalo/SMS.',
    badge: 'Tham số hệ thống',
    placement: 'right'
  },
  'nav-analytics': {
    title: 'Thống Kê Số Liệu & Xu Hướng Tải',
    content: 'Biểu đồ phân tích lưu lượng data theo giờ cao điểm, tỷ lệ người dùng quay lại và báo cáo tần suất truy cập các cổng dịch vụ công.',
    badge: 'Thống kê số',
    placement: 'right'
  },
  'nav-audit': {
    title: 'Nhật Ký Kiểm Toán Hệ Thống (Audit Log)',
    content: 'Ghi vết chi tiết thao tác của cán bộ trên hệ thống đảm bảo tính minh bạch.',
    badge: 'Kiểm toán hệ thống',
    placement: 'right'
  },
  'nav-gateway': {
    title: 'Chẩn Đoán Kết Nối Gateway Viễn Thông',
    content: 'Kiểm tra độ trễ mạng, tình trạng đồng bộ giữa Cổng quản trị và các Gateway OPNsense / Grandstream Cloud, giám sát cơ chế dự phòng Fail-Open.',
    badge: 'Chẩn đoán kết nối',
    placement: 'right'
  }
};

export const InteractiveTourGuide: React.FC<Props> = ({ isOpen, onClose, currentUser, navGroups = [] }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = useMemo(() => {
    const dynamicSteps: TourStep[] = [];

    dynamicSteps.push({
      id: 'welcome',
      targetSelector: '[data-tour="welcome-card"]',
      title: 'Chào Mừng Đến Với Hệ Thống Quản Lý Wi-Fi Công Cộng TP Hải Phòng',
      content: `Xin chào ${currentUser?.fullName || currentUser?.username || 'Cán bộ'}! Sau đây là chuyến tham quan đầy đủ toàn bộ các chức năng mà tài khoản của bạn được phân quyền tác nghiệp trên hệ thống.`,
      placement: 'bottom',
      badge: ''
    });

    if (navGroups && navGroups.length > 0) {
      navGroups.forEach((group) => {
        group.items.forEach((item) => {
          if (item.tourId && MODULE_TOUR_DEFINITIONS[item.tourId]) {
            const def = MODULE_TOUR_DEFINITIONS[item.tourId];
            dynamicSteps.push({
              id: item.tourId,
              targetSelector: `[data-tour="${item.tourId}"]`,
              title: def.title || item.label,
              content: def.content,
              placement: def.placement || 'right',
              badge: def.badge,
              groupTitle: group.groupTitle
            });
          }
        });
      });
    }

    dynamicSteps.push({
      id: 'user-profile',
      targetSelector: '[data-tour="user-profile"]',
      title: 'Tài Khoản Tác Nghiệp & Đổi Mật Khẩu',
      content: 'Xem thông tin vai trò, phạm vi phụ trách và thực hiện đổi mật khẩu.',
      placement: 'bottom',
      badge: 'Tài khoản'
    });

    dynamicSteps.push({
      id: 'tour-button',
      targetSelector: '[data-tour="tour-button"]',
      title: 'Hoàn Tất!',
      content: 'Bạn vừa lướt qua toàn bộ chức năng nghiệp vụ theo đúng quyền hạn. Bạn có thể mở lại chuyến tham quan này bất cứ lúc nào qua nút "Tour Hướng Dẫn" trên thanh tiêu đề.',
      placement: 'bottom',
      badge: 'Sẵn sàng'
    });

    return dynamicSteps;
  }, [currentUser, navGroups]);

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      el.classList.add('tour-spotlight-active');
      return () => {
        el.classList.remove('tour-spotlight-active');
      };
    }
  }, [isOpen, currentStep]);

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // Fallback if target element not found on page
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    const timer = setTimeout(updateTargetPosition, 60);
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (currentUser?.username) {
      localStorage.setItem(`wifi_tour_completed_${currentUser.username}`, 'true');
    }
    setCurrentStepIndex(0);
    onClose();
  };

  if (!isOpen) return null;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Centered fallback
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      };
    }

    const margin = 18;
    const tooltipWidth = 360;
    const placement = currentStep.placement || 'right';

    let top = 0;
    let left = 0;

    if (placement === 'right') {
      left = targetRect.right + margin;
      top = targetRect.top + targetRect.height / 2 - 90;
    } else if (placement === 'bottom') {
      top = targetRect.bottom + margin;
      left = Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2);
    } else if (placement === 'top') {
      top = targetRect.top - 220 - margin;
      left = Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2);
    } else {
      // left
      left = Math.max(16, targetRect.left - tooltipWidth - margin);
      top = targetRect.top + targetRect.height / 2 - 90;
    }

    // Window boundaries check
    const maxTop = window.innerHeight - 260;
    const maxLeft = window.innerWidth - tooltipWidth - 16;

    top = Math.max(16, Math.min(top, maxTop));
    left = Math.max(16, Math.min(left, maxLeft));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 1000,
      transition: 'top 0.35s cubic-bezier(0.16, 1, 0.3, 1), left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Dynamic CSS styles for the targeted element */}
      <style>{`
        .tour-spotlight-active {
          position: relative !important;
          z-index: 55 !important;
          background: linear-gradient(135deg, #005fa3 0%, #003865 100%) !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          box-shadow: 0 0 20px rgba(0, 150, 255, 0.8), 0 0 0 2px #38bdf8 !important;
          border-radius: 6px !important;
          transition: all 0.25s ease-in-out !important;
        }
        .tour-spotlight-active * {
          color: #ffffff !important;
        }
        .tour-spotlight-active svg {
          stroke: #ffffff !important;
          color: #ffffff !important;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8)) !important;
        }
      `}</style>

      {/* 1. Backdrop Overlay with SVG Cutout Mask: dims everything EXCEPT targetRect */}
      <svg
        className="fixed inset-0 w-full h-full z-40 transition-all duration-300 pointer-events-auto"
        style={{ width: '100vw', height: '100vh' }}
        onClick={handleFinish}
      >
        <defs>
          <mask id="tour-spotlight-mask" x="0" y="0" width="100%" height="100%">
            {/* White area = visible dark backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {/* Black cutout = completely transparent hole revealing target element */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - 6)}
                y={Math.max(0, targetRect.top - 6)}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="8"
                ry="8"
                fill="#000000"
                style={{ transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            )}
          </mask>
        </defs>
        {/* Dark backdrop rect with mask applied */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* 2. Target Spotlight cutout glowing border & high-visibility beacon */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-lg ring-2 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.65)] z-50 animate-pulse"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            transition: 'top 0.35s cubic-bezier(0.16, 1, 0.3, 1), left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s ease, height 0.35s ease',
          }}
        >
          {/* Beacon Floating Tag */}
          <div className="absolute -top-3 -right-3 flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg border-2 border-white uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-slate-950" />
            <span>Mục này</span>
          </div>
        </div>
      )}

      {/* 3. Floating Tooltip Card */}
      <div
        style={getTooltipStyle()}
        className="pointer-events-auto bg-white rounded-xl border border-slate-200/90 shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="rounded-xl overflow-hidden">
          {/* Header with Step indicator & Group Title */}
          <div className="bg-[#004b87] px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                {currentStepIndex + 1}
              </div>
              <div key={`header-${currentStep.id}`} className="animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-300">
                    {currentStep.badge}
                  </span>
                  {currentStep.groupTitle && (
                    <>
                      <span className="text-[9px] text-blue-300">•</span>
                      <span className="text-[9px] uppercase font-medium text-blue-200 truncate max-w-[150px]">
                        {currentStep.groupTitle}
                      </span>
                    </>
                  )}
                </div>
                <h4 className="font-bold text-xs text-white leading-tight mt-0.5">
                  {currentStep.title}
                </h4>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Đóng tour hướng dẫn (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content with smooth step transition */}
          <div className="p-4 space-y-3.5">
            <div key={`body-${currentStep.id}`} className="animate-in fade-in slide-in-from-right-2 duration-250">
              <p className="text-xs text-slate-700 leading-relaxed font-sans min-h-[40px]">
                {currentStep.content}
              </p>
            </div>

            {/* Continuous Sleek Progress Bar */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#004b87] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="truncate max-w-[200px] text-[10.5px] font-sans">
                  {currentStep.groupTitle ? `Nhóm: ${currentStep.groupTitle}` : 'Tiến trình hướng dẫn'}
                </span>
                <span className="font-semibold text-slate-700">
                  {currentStepIndex + 1} / {steps.length} mục
                </span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleFinish}
              className="text-slate-400 hover:text-slate-700 text-xs font-medium transition cursor-pointer"
            >
              Bỏ qua
            </button>

            <div className="flex items-center gap-1.5">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-[#004b87] hover:bg-[#003865] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {currentStepIndex === steps.length - 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" /> Bắt đầu ngay
                  </>
                ) : (
                  <>
                    Tiếp tục <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
