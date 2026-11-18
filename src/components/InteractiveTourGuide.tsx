import React, { useState, useEffect, useCallback } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { AdminUserDto } from '../types/models';

export interface TourStep {
  id: string;
  targetSelector: string; // CSS Selector or data-tour attribute
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  badge?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUserDto | null;
}

export const InteractiveTourGuide: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const role = currentUser?.role || 'ROLE_ADMIN';

  // Determine steps tailored for specific role
  const getStepsForRole = (): TourStep[] => {
    if (role === 'ROLE_COMMUNE_OFFICER') {
      return [
        {
          id: 'welcome',
          targetSelector: '[data-tour="welcome-card"]',
          title: 'Chào Mừng Cán Bộ Cơ Sở',
          content: 'Không gian làm việc được tối ưu cho cán bộ phụ trách Văn hóa - Xã hội tại Xã/Phường để theo dõi sát sao điểm phát Nhà văn hóa địa bàn.',
          placement: 'bottom',
          badge: 'Khởi đầu'
        },
        {
          id: 'locations',
          targetSelector: '[data-tour="nav-locations"]',
          title: 'Danh Bạ Nhà Văn Hóa Cơ Sở',
          content: 'Theo dõi tình trạng hoạt động, cấu hình tên mạng Wi-Fi và băng thông của các Nhà văn hóa trong địa bàn do đồng chí phụ trách.',
          placement: 'right',
          badge: 'Địa bàn'
        },
        {
          id: 'incidents',
          targetSelector: '[data-tour="nav-incidents"]',
          title: 'Tiếp Nhận Phản Ánh Dân Sinh',
          content: 'Lắng nghe phản ánh của bà con (mất mạng, sóng yếu, lỗi trang chào) để kịp thời phối hợp với kỹ thuật viên xử lý theo hạn SLA.',
          placement: 'right',
          badge: 'Ý kiến dân'
        },
        {
          id: 'surveys',
          targetSelector: '[data-tour="nav-surveys"]',
          title: 'Khảo Sát Ý Kiến Công Dân',
          content: 'Xem kết quả khảo sát mức độ hài lòng của người dân về các dịch vụ công và đời sống văn hóa tại Nhà văn hóa.',
          placement: 'right',
          badge: 'Khảo sát'
        },
        {
          id: 'finish',
          targetSelector: '[data-tour="user-profile"]',
          title: 'Hoàn Tất & Bắt Đầu Tác Nghiệp',
          content: 'Đồng chí có thể mở lại Tour hướng dẫn này bất kỳ lúc nào tại thanh công cụ phía trên.',
          placement: 'bottom',
          badge: 'Sẵn sàng'
        }
      ];
    }

    if (role === 'ROLE_TECH_SUPPORT') {
      return [
        {
          id: 'welcome',
          targetSelector: '[data-tour="welcome-card"]',
          title: 'Không Gian Kỹ Thuật Viễn Thông',
          content: 'Hệ thống hỗ trợ kỹ thuật viên giám sát 1.584 Gateway OPNsense và trạm phát Grandstream AP trên toàn thành phố.',
          placement: 'bottom',
          badge: 'Kỹ thuật'
        },
        {
          id: 'devices',
          targetSelector: '[data-tour="nav-devices"]',
          title: 'Quản Lý Thiết Bị & Hoán Đổi (Swap)',
          content: 'Xem tình trạng Online/Offline, kiểm tra Ping, reboot từ xa và thao tác hoán đổi thiết bị hỏng (Device Swap) chỉ bằng 1 cú nhấp.',
          placement: 'right',
          badge: 'Thiết bị'
        },
        {
          id: 'incidents',
          targetSelector: '[data-tour="nav-incidents"]',
          title: 'Phiếu Sự Cố & Hạn Cam Kết SLA',
          content: 'Nhận phiếu sự cố mạng, xác định nguyên nhân (đứt cáp quang, mất điện, lỗi AP) và cập nhật tiến độ khắc phục hiện trường.',
          placement: 'right',
          badge: 'SLA Cam kết'
        },
        {
          id: 'gis',
          targetSelector: '[data-tour="nav-gis"]',
          title: 'Bản Đồ Số Định Vị Hiện Trường',
          content: 'Định vị chính xác tọa độ GPS của trạm phát trên nền bản đồ số, chỉ dẫn đường đi cho đội cơ động khi xử lý sự cố.',
          placement: 'right',
          badge: 'Bản đồ số'
        },
        {
          id: 'finish',
          targetSelector: '[data-tour="user-profile"]',
          title: 'Sẵn Sàng Hỗ Trợ 24/7',
          content: 'Hệ thống đã sẵn sàng cho quy trình ứng cứu thông tin và vận hành kỹ thuật.',
          placement: 'bottom',
          badge: 'Hoàn tất'
        }
      ];
    }

    // Default for SUPER_ADMIN / ADMIN / LEADS
    return [
      {
        id: 'overview',
        targetSelector: '[data-tour="nav-dashboard"]',
        title: 'Trung Tâm Điều Hành Tổng Quan',
        content: 'Theo dõi toàn diện nhịp đập số: số lượng trạm phát hoạt động, số công dân đang online và lưu lượng data phục vụ miễn phí.',
        placement: 'right',
        badge: 'Tổng quan'
      },
      {
        id: 'gis',
        targetSelector: '[data-tour="nav-gis"]',
        title: 'Bản Đồ Số GIS Toàn Thành Phố',
        content: 'Trực quan hóa mạng lưới 1.584 Nhà văn hóa theo bản đồ nhiệt và ranh giới hành chính 15 Quận / Huyện TP Hải Phòng.',
        placement: 'right',
        badge: 'Bản đồ GIS'
      },
      {
        id: 'locations',
        targetSelector: '[data-tour="nav-locations"]',
        title: 'Danh Bạ & Cấu Hình Điểm Phát',
        content: 'Quản lý danh sách điểm phát, phân cấp địa bàn Quận/Xã/Thôn, xuất nhập Excel và kiểm soát hạn mức băng thông từng điểm.',
        placement: 'right',
        badge: 'Danh bạ điểm'
      },
      {
        id: 'campaigns',
        targetSelector: '[data-tour="nav-campaigns"]',
        title: 'Truyền Thông & Chính Sách Số',
        content: 'Đăng tải video, áp phích tuyên truyền Dịch vụ công, phân bổ nội dung tiếp sóng chính xác theo từng phường xã.',
        placement: 'right',
        badge: 'Truyền thông'
      },
      {
        id: 'incidents',
        targetSelector: '[data-tour="nav-incidents"]',
        title: 'Giám Sát Sự Cố & Phản Ánh Dân',
        content: 'Theo dõi phiếu sự cố mạng, điều phối kỹ thuật theo hạn cam kết SLA và tiếp nhận phản ánh chất lượng mạng từ nhân dân.',
        placement: 'right',
        badge: 'Sự cố SLA'
      },
      {
        id: 'security',
        targetSelector: '[data-tour="nav-security"]',
        title: 'An Toàn Thông Tin & Phân Quyền',
        content: 'Lọc tên miền độc hại DNS, chặn truy cập cờ bạc/lừa đảo, quản trị ma trận phân quyền 5 cấp và lưu nhật ký kiểm toán.',
        placement: 'right',
        badge: 'An toàn mạng'
      },
      {
        id: 'finish',
        targetSelector: '[data-tour="tour-button"]',
        title: 'Hoàn Tất Chuyến Tham Quan!',
        content: 'Hệ thống đã sẵn sàng phục vụ. Quý cán bộ có thể mở lại Tour này bất cứ lúc nào qua nút "Tour hướng dẫn" trên thanh tiêu đề.',
        placement: 'bottom',
        badge: 'Hoàn tất'
      }
    ];
  };

  const steps = getStepsForRole();
  const currentStep = steps[currentStepIndex] || steps[0];

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } else {
      // Fallback if target element not found on page
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  // Keyboard navigation (Escape, ArrowRight, ArrowLeft)
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
  }, [isOpen, currentStepIndex]);

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

  // Compute tooltip position
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

    const margin = 16;
    const tooltipWidth = 340;
    const placement = currentStep.placement || 'right';

    let top = 0;
    let left = 0;

    if (placement === 'right') {
      left = targetRect.right + margin;
      top = targetRect.top + targetRect.height / 2 - 80;
    } else if (placement === 'bottom') {
      top = targetRect.bottom + margin;
      left = Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2);
    } else if (placement === 'top') {
      top = targetRect.top - 200 - margin;
      left = Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2);
    } else {
      // left
      left = Math.max(16, targetRect.left - tooltipWidth - margin);
      top = targetRect.top + targetRect.height / 2 - 80;
    }

    // Window boundaries check
    const maxTop = window.innerHeight - 240;
    const maxLeft = window.innerWidth - tooltipWidth - 16;

    top = Math.max(16, Math.min(top, maxTop));
    left = Math.max(16, Math.min(left, maxLeft));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 1000,
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* 1. Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={handleFinish}
      />

      {/* 2. Target Spotlight cutout / highlight ring */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 rounded-lg ring-4 ring-[#004b87] ring-offset-2 ring-offset-white shadow-2xl z-50 bg-transparent animate-pulse"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* 3. Floating Tooltip Card */}
      <div
        style={getTooltipStyle()}
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with Step indicator */}
        <div className="bg-[#004b87] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold font-mono">
              {currentStepIndex + 1}
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-blue-200">
                {currentStep.badge || `Bước ${currentStepIndex + 1} / ${steps.length}`}
              </span>
              <h4 className="font-bold text-xs text-white leading-tight">
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

        {/* Body content */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            {currentStep.content}
          </p>

          {/* Progress dots bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === currentStepIndex
                      ? 'w-5 bg-[#004b87]'
                      : i < currentStepIndex
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {currentStepIndex + 1}/{steps.length}
            </span>
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#004b87] hover:bg-[#003865] text-white font-bold text-xs shadow-xs transition cursor-pointer"
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
  );
};
