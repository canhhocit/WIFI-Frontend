import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Smartphone,
  BarChart3,
  ScrollText,
  Radio,
  LogOut,
  ExternalLink,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
  Circle,
  Palette,
  Megaphone,
  ClipboardList,
  Map,
  ShieldAlert,
  Ban,
  Lock,
  Landmark,
  Globe,
  UserCheck,
  KeyRound,
  Settings,
  Activity,
  Clock,
  Compass,
  Sparkles,
} from "lucide-react";
import { authApi } from "../../api/authApi";
import { adminApi } from "../../api/adminApi";
import {
  AdminUserDto,
  GatewayStatusDto,
  RolePermissionDto,
} from "../../types/models";
import { VietnamFlag } from "../../components/VietnamFlag";
import { ChangePasswordModal } from "../../components/ChangePasswordModal";
import { InteractiveTourGuide } from "../../components/InteractiveTourGuide";

type RbacModule =
  | "LOCATIONS"
  | "DEVICES"
  | "CAMPAIGNS"
  | "INCIDENTS"
  | "USERS"
  | "SETTINGS";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  module?: RbacModule;
  tourId?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: "HẠ TẦNG & ĐIỂM PHÁT SÓNG",
    items: [
      {
        to: "/admin",
        label: "Tổng quan điều hành",
        icon: LayoutDashboard,
        end: true,
        tourId: "nav-dashboard",
      },
      {
        to: "/admin/gis",
        label: "Bản đồ số GIS",
        icon: Map,
        module: "LOCATIONS",
        tourId: "nav-gis",
      },
      {
        to: "/admin/locations",
        label: "Danh bạ Nhà văn hóa",
        icon: MapPin,
        module: "LOCATIONS",
        tourId: "nav-locations",
      },
      {
        to: "/admin/devices",
        label: "Thiết bị & AP Gateway",
        icon: Smartphone,
        module: "DEVICES",
        tourId: "nav-devices",
      },
      {
        to: "/admin/sessions",
        label: "Quản lý phiên truy cập",
        icon: Users,
        module: "LOCATIONS",
      },
    ],
  },
  {
    groupTitle: "GIÁM SÁT MẠNG & AN NINH",
    items: [
      {
        to: "/admin/incidents",
        label: "Xử lý sự cố viễn thông",
        icon: ShieldAlert,
        module: "INCIDENTS",
        tourId: "nav-incidents",
      },
      {
        to: "/admin/blacklist",
        label: "Danh sách cấm MAC",
        icon: Ban,
        module: "INCIDENTS",
      },
      {
        to: "/admin/access-logs",
        label: "Nhật ký 12 tháng pháp lý",
        icon: Lock,
        module: "INCIDENTS",
      },
    ],
  },
  {
    groupTitle: "CỔNG CHÀO & TRUYỀN THÔNG SỐ",
    items: [
      {
        to: "/admin/portal-builder",
        label: "Trình dựng Cổng chào",
        icon: Palette,
        module: "CAMPAIGNS",
      },
      {
        to: "/admin/campaigns",
        label: "Chiến dịch tuyên truyền",
        icon: Megaphone,
        module: "CAMPAIGNS",
        tourId: "nav-campaigns",
      },
      {
        to: "/admin/surveys",
        label: "Khảo sát ý kiến nhân dân",
        icon: ClipboardList,
        module: "CAMPAIGNS",
        tourId: "nav-surveys",
      },
      {
        to: "/admin/dns-filtering",
        label: "Bộ lọc tên miền DNS & DVC",
        icon: Globe,
        module: "CAMPAIGNS",
        tourId: "nav-security",
      },
    ],
  },
  {
    groupTitle: "QUẢN TRỊ CHÍNH QUYỀN & HỆ THỐNG",
    items: [
      {
        to: "/admin/government-report",
        label: "Báo cáo Sở TT&TT / UBND",
        icon: Landmark,
        module: "SETTINGS",
      },
      {
        to: "/admin/users",
        label: "Cán bộ 5 cấp & Địa bàn",
        icon: UserCheck,
        module: "USERS",
        tourId: "nav-users",
      },
      {
        to: "/admin/role-permissions",
        label: "Ma trận phân quyền RBAC",
        icon: KeyRound,
        module: "USERS",
      },
      {
        to: "/admin/system-settings",
        label: "Cấu hình tham số hệ thống",
        icon: Settings,
        module: "SETTINGS",
      },
      {
        to: "/admin/analytics",
        label: "Thống kê & Báo cáo",
        icon: BarChart3,
        module: "SETTINGS",
      },
      {
        to: "/admin/audit",
        label: "Nhật ký hệ thống",
        icon: ScrollText,
        module: "USERS",
      },
      {
        to: "/admin/gateway",
        label: "Chẩn đoán kết nối Gateway",
        icon: Radio,
        module: "DEVICES",
      },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AdminUserDto | null>(
    authApi.getCurrentUser(),
  );
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isForcePasswordOpen, setIsForcePasswordOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourWelcomePrompt, setTourWelcomePrompt] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusDto | null>(
    null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("wifi_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleDesktopSidebar = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("wifi_admin_sidebar_collapsed", String(next));
      } catch { }
      return next;
    });
  };

  // Tự động mở rộng thanh bên khi mở Tour để hiển thị rõ toàn bộ tên mục nghiệp vụ
  useEffect(() => {
    if (isTourOpen && desktopCollapsed) {
      setDesktopCollapsed(false);
    }
  }, [isTourOpen, desktopCollapsed]);

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("vi-VN"),
  );
  const [permissions, setPermissions] = useState<RolePermissionDto[]>(() => {
    try {
      const cached = localStorage.getItem("wifi_rbac_permissions");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate("/admin/login");
      return;
    }

    authApi
      .getMe()
      .then((user) => {
        setCurrentUser(user);
        if (user.mustChangePassword) {
          setIsForcePasswordOpen(true);
        } else {
          const tourDone = localStorage.getItem(`wifi_tour_completed_${user.username}`);
          if (!tourDone) {
            setTourWelcomePrompt(true);
          }
        }
      })
      .catch(() => navigate("/admin/login"));

    adminApi.getGatewayStatus().then(setGatewayStatus).catch(console.error);

    const loadPermissions = async () => {
      try {
        const perms = await adminApi.getRolePermissions();
        if (perms && Array.isArray(perms)) {
          setPermissions(perms);
          localStorage.setItem("wifi_rbac_permissions", JSON.stringify(perms));
        }
      } catch (err) {
        console.warn("Could not load dynamic role permissions:", err);
      }
    };

    loadPermissions();

    const handlePermissionsUpdated = () => {
      loadPermissions();
    };

    window.addEventListener(
      "rbac-permissions-updated",
      handlePermissionsUpdated,
    );

    const gatewayTimer = setInterval(() => {
      adminApi
        .getGatewayStatus()
        .then(setGatewayStatus)
        .catch(() => { });
    }, 30000);

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("vi-VN"));
    }, 1000);

    return () => {
      window.removeEventListener(
        "rbac-permissions-updated",
        handlePermissionsUpdated,
      );
      clearInterval(gatewayTimer);
      clearInterval(clockTimer);
    };
  }, [navigate]);

  const handleLogout = () => {
    authApi.logout();
    navigate("/admin/login");
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ROLE_SUPER_ADMIN":
      case "ROLE_ADMIN":
        return {
          label: "Quản trị hệ thống",
          scope: "Toàn quyền Hệ thống",
          color: "bg-slate-800 text-slate-100 border-slate-600",
        };
      case "ROLE_SOTTTT_ADMIN":
        return {
          label: "Sở TT&TT Hải Phòng",
          scope: "Toàn Thành phố",
          color: "bg-[#004b87] text-white border-[#003865]",
        };
      case "ROLE_DISTRICT_OFFICER":
        return {
          label: "Cán bộ Quận/Huyện",
          scope: "Địa bàn Quận / Huyện",
          color: "bg-slate-700 text-slate-100 border-slate-600",
        };
      case "ROLE_COMMUNE_OFFICER":
        return {
          label: "Cán bộ Phường/Xã",
          scope: "Cơ sở Phường / Xã",
          color: "bg-slate-700 text-slate-100 border-slate-600",
        };
      case "ROLE_VNPT_ENGINEER":
        return {
          label: "Kỹ sư VNPT",
          scope: "Hạ tầng Viễn thông",
          color: "bg-[#003865] text-blue-100 border-blue-700",
        };
      default:
        return {
          label: "Cán bộ Vận hành",
          scope: "Phân quyền Tiêu chuẩn",
          color: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);
  const userRole = currentUser?.role || "ROLE_SUPER_ADMIN";

  // Check if current user has permission to view a specific module
  const hasModulePermission = (module?: RbacModule): boolean => {
    if (!module) return true;
    if (userRole === "ROLE_SUPER_ADMIN" || userRole === "ROLE_ADMIN")
      return true;

    if (permissions && permissions.length > 0) {
      const match = permissions.find(
        (p) => p.roleName === userRole && p.moduleName === module,
      );
      if (match) {
        return Boolean(match.canView);
      }
    }

    // Default fallback if permissions have not synced from server yet
    switch (module) {
      case "LOCATIONS":
        return true;
      case "DEVICES":
        return (
          userRole === "ROLE_VNPT_ENGINEER" || userRole === "ROLE_SOTTTT_ADMIN"
        );
      case "CAMPAIGNS":
        return (
          userRole === "ROLE_SOTTTT_ADMIN" ||
          userRole === "ROLE_DISTRICT_OFFICER" ||
          userRole === "ROLE_COMMUNE_OFFICER"
        );
      case "INCIDENTS":
        return (
          userRole === "ROLE_VNPT_ENGINEER" ||
          userRole === "ROLE_SOTTTT_ADMIN" ||
          userRole === "ROLE_DISTRICT_OFFICER"
        );
      case "USERS":
        return userRole === "ROLE_SOTTTT_ADMIN";
      case "SETTINGS":
        return (
          userRole === "ROLE_SOTTTT_ADMIN" ||
          userRole === "ROLE_DISTRICT_OFFICER"
        );
      default:
        return true;
    }
  };

  // Dynamically filter navigation items based on current officer's RBAC role permissions
  const filteredNavGroups = NAV_GROUPS.map((group) => {
    const visibleItems = group.items.filter((item) =>
      hasModulePermission(item.module),
    );
    return {
      ...group,
      items: visibleItems,
    };
  }).filter((group) => group.items.length > 0);

  // Check if current URL route is permitted for current role
  const isCurrentPathAllowed = () => {
    if (userRole === "ROLE_SUPER_ADMIN" || userRole === "ROLE_ADMIN")
      return true;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        const matches = item.end
          ? location.pathname === item.to
          : location.pathname === item.to ||
          location.pathname.startsWith(`${item.to}/`);
        if (matches) {
          return hasModulePermission(item.module);
        }
      }
    }
    return true;
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0c2340] text-white px-4 py-3 flex items-center justify-between border-b border-[#18365a] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <VietnamFlag width={30} height={20} className="shadow-xs rounded-xs" />
          <span className="font-bold text-xs uppercase tracking-wide text-slate-100">
            Wi-Fi Hải Phòng • Quản Trị
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#13355e] cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-2xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen bg-[#0c2340] text-slate-300 flex flex-col border-r border-[#18365a] transition-all duration-300 ease-in-out ${mobileMenuOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0"
          } ${desktopCollapsed
            ? "md:w-16"
            : "md:w-72"
          }`}
      >
        <div className="flex flex-col h-full flex-1 w-full overflow-hidden">
          {/* Department / Brand Banner */}
          <div
            data-tour="welcome-card"
            className={`border-b border-[#18365a] bg-gradient-to-b from-[#0a1e38] via-[#091a30] to-[#071629] flex items-center transition-all ${desktopCollapsed
                ? "p-2.5 flex-col gap-2 justify-center"
                : "p-4 justify-between"
              }`}
          >
            <div
              className={`flex items-center gap-3 min-w-0 ${desktopCollapsed ? "justify-center" : ""
                }`}
            >
              <div
                className="flex-shrink-0 drop-shadow-md cursor-pointer"
                onClick={desktopCollapsed ? toggleDesktopSidebar : undefined}
                title="UBND TP. Hải Phòng - Cổng Quản Trị Wi-Fi"
              >
                <VietnamFlag
                  width={desktopCollapsed ? 34 : 45}
                  height={desktopCollapsed ? 23 : 30}
                  className="rounded-xs shadow-md border border-amber-300/40"
                />
              </div>
              {!desktopCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10.5px] font-extrabold text-amber-300 uppercase tracking-wider leading-tight truncate">
                    UBND TP. HẢI PHÒNG
                  </div>
                  <div className="text-xs text-white font-bold tracking-tight truncate mt-0.5">
                    Cổng Quản Trị Wi-Fi
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button (Chỉ hiển thị trên mobile) */}
            <div className="md:hidden flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#13355e] transition cursor-pointer"
                title="Đóng menu điều hướng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!desktopCollapsed && (
            <div className="px-4 border-b border-[#18365a] bg-[#071628] flex items-center justify-between text-[11px]">
              <div
                className={` transition-all ${desktopCollapsed ? "p-2 flex justify-center" : "p-3"
                  }`}
              >
                <a
                  href="/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={desktopCollapsed ? "Mở Cổng chào Người dân (/portal)" : undefined}
                  className={`flex items-center rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-[#13355e] transition ${desktopCollapsed
                      ? "justify-center w-full"
                      : "justify-between px-3"
                    }`}
                >
                  <span
                    className={`flex items-center gap-2 text-[11px] ${desktopCollapsed ? "justify-center" : ""
                      }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    {!desktopCollapsed && <span>Mở Trang cổng chào</span>}
                  </span>
                  {!desktopCollapsed && (
                    <span className="text-[10px] font-mono text-slate-400">
                      /portal
                    </span>
                  )}
                </a>
              </div>
            </div>
          )}

          {/* Categorized Nav Groups (Generated dynamically by Role) */}
          <nav
            className={`flex-1 overflow-y-auto custom-scrollbar transition-all ${desktopCollapsed ? "px-2 py-3 space-y-3" : "px-3 py-3 space-y-4"
              }`}
          >
            {filteredNavGroups.map((group, gIdx) => (
              <div key={group.groupTitle} className="space-y-1">
                {!desktopCollapsed ? (
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.groupTitle}
                  </div>
                ) : (
                  gIdx > 0 && <div className="h-px bg-[#18365a] my-2 mx-1" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.end
                      ? location.pathname === item.to
                      : location.pathname.startsWith(item.to);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        data-tour={item.tourId}
                        onClick={() => setMobileMenuOpen(false)}
                        title={desktopCollapsed ? item.label : undefined}
                        className={`flex items-center rounded transition group relative ${desktopCollapsed
                            ? "justify-center p-2.5"
                            : "gap-2.5 px-3 py-1.5 text-xs font-medium"
                          } ${isActive
                            ? "bg-[#004b87] text-white font-semibold shadow-xs"
                            : "text-slate-300 hover:text-white hover:bg-[#13355e]"
                          }`}
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-white"
                            }`}
                        />
                        {!desktopCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          {/* User Profile & Logout */}
          <div
            data-tour="user-profile"
            className={`border-t border-[#18365a] bg-[#071628] flex items-center transition-all ${desktopCollapsed
                ? "p-2 flex-col gap-2 justify-center"
                : "p-3 justify-between gap-2"
              }`}
          >
            {!desktopCollapsed ? (
              <>
                <div className="truncate pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {currentUser?.fullName ||
                        currentUser?.username ||
                        "Cán bộ Quản trị"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {currentUser?.email || "admin@haiphong.gov.vn"}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    title="Đổi mật khẩu tài khoản"
                    className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-[#13355e] border border-transparent hover:border-amber-900/30 transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất an toàn"
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-[#13355e] border border-transparent hover:border-red-900/30 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full py-1">
                <div
                  className="w-8 h-8 rounded-full bg-[#13355e] border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold text-xs"
                  title={`${currentUser?.fullName || currentUser?.username || "Cán bộ"} (${currentUser?.email || "admin@haiphong.gov.vn"})`}
                >
                  {(
                    currentUser?.fullName ||
                    currentUser?.username ||
                    "AD"
                  )
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  title="Đổi mật khẩu tài khoản"
                  className="p-2 rounded text-slate-400 hover:text-amber-400 hover:bg-[#13355e] transition cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất an toàn"
                  className="p-2 rounded text-slate-400 hover:text-red-400 hover:bg-[#13355e] transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Container with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-12 shrink-0 bg-white border-b border-slate-300 px-4 lg:px-6 items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Desktop Menu Close / Open Toggle Button */}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="p-1.5 -ml-1 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              title={desktopCollapsed ? "Mở rộng thanh menu bên" : "Thu gọn thanh menu bên (dạng icon)"}
            >
              {desktopCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-[#004b87]" />
                  <span className="text-[11.5px] text-[#004b87]">Mở rộng</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-600" />
                  <span className="text-[11.5px] text-slate-600">Thu gọn</span>
                </>
              )}
            </button>

            <span className="h-4 w-px bg-slate-200" />

            <span className="text-xs font-semibold text-slate-500">
              Trung tâm Điều hành:
            </span>
            <span className="text-xs font-bold text-slate-800">
              Hệ thống Wi-Fi Công cộng thành phố Hải Phòng
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Tour Guide Button */}
            <button
              type="button"
              data-tour="tour-button"
              onClick={() => setIsTourOpen(true)}
              className="text-xs font-semibold px-2.5 py-1 rounded-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#004b87] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Khám phá các tính năng theo phân quyền của bạn"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Tour Hướng Dẫn</span>
            </button>

            {/* Clock UTC+7 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-sm font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime} </span>
            </div>

            {/* Officer Role Badge */}
            <div
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-sm border flex items-center gap-1.5 ${roleInfo.color}`}
              title={`Quyền hạn: ${roleInfo.scope}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{roleInfo.label}</span>
            </div>
          </div>
        </header>

        {/* Page Body with RBAC Route Guard */}
        <main className="min-h-0 flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto overscroll-contain bg-slate-100">
          {!isCurrentPathAllowed() ? (
            <div className="max-w-xl mx-auto mt-12 p-6 bg-white border border-slate-300 rounded shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Quyền Hạn Truy Cập Bị Giới Hạn
                </h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Tài khoản của bạn đăng nhập với vai trò{" "}
                  <strong>{roleInfo.label}</strong> ({roleInfo.scope}). Tính
                  năng này yêu cầu đặc quyền phân quyền cao hơn theo Ma trận
                  phân quyền RBAC Thành phố.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate("/admin")}
                  className="px-4 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition"
                >
                  Trở Về Bảng Điều Hành Trung Tâm
                </button>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Welcome Tour Invitation Dialog */}
      {tourWelcomePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#004b87] to-[#002d54] p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Compass className="w-6 h-6 text-amber-300 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                    Chào Mừng Đến Với Hệ Thống!
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Hệ thống Quản lý Wi-Fi Công cộng TP. Hải Phòng
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Xin chào <strong>{currentUser?.fullName || currentUser?.username}</strong> ({roleInfo.label}). Hệ thống đã chuẩn bị sẵn một <strong>Chuyến tham quan tương tác (Interactive Tour)</strong> được thiết kế riêng cho bạn.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Trải nghiệm này nhằm:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11.5px] pl-1 text-slate-600">
                  <li>Làm quen các nghiệp vụ chính theo đúng quyền .</li>
                  <li>Chỉ dẫn vị trí các chức năng trọng yếu trên giao diện.</li>
                  <li>Chỉ mất khoảng 1 phút và có thể mở lại bất cứ lúc nào.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTourWelcomePrompt(false);
                    if (currentUser?.username) {
                      localStorage.setItem(`wifi_tour_completed_${currentUser.username}`, "true");
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-sm border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTourWelcomePrompt(false);
                    setIsTourOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-sm bg-[#004b87] hover:bg-[#003865] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Khám phá ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force Change Password Modal for First Time Login */}
      <ChangePasswordModal
        isOpen={isForcePasswordOpen}
        onClose={() => {}}
        forceFirstTime={true}
        onSuccess={() => {
          setIsForcePasswordOpen(false);
          const tourDone = localStorage.getItem(`wifi_tour_completed_${currentUser?.username}`);
          if (!tourDone) {
            setTourWelcomePrompt(true);
          }
        }}
      />

      {/* User-initiated Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Interactive Guided Tour */}
      <InteractiveTourGuide
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
