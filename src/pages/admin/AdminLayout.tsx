import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Shield,
  Circle,
  Palette,
  Megaphone,
  ClipboardList,
  Map,
  BellRing,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Ban,
  Lock,
  Server,
  Landmark,
  Globe,
  UserCheck,
  KeyRound,
  Settings,
  Activity,
  Clock,
} from 'lucide-react';
import { authApi } from '../../api/authApi';
import { adminApi } from '../../api/adminApi';
import { AdminUserDto, GatewayStatusDto } from '../../types/models';

interface NavGroup {
  groupTitle: string;
  items: Array<{
    to: string;
    label: string;
    icon: any;
    end?: boolean;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'HẠ TẦNG & ĐIỂM PHÁT SÓNG',
    items: [
      { to: '/admin', label: 'Tổng quan điều hành', icon: LayoutDashboard, end: true },
      { to: '/admin/gis', label: 'Bản đồ số GIS 1.584 Điểm', icon: Map },
      { to: '/admin/locations', label: 'Danh bạ Nhà văn hóa', icon: MapPin },
      { to: '/admin/devices', label: 'Thiết bị & AP Gateway', icon: Smartphone },
      { to: '/admin/sessions', label: 'Quản lý phiên truy cập', icon: Users },
    ],
  },
  {
    groupTitle: 'GIÁM SÁT MẠNG & SỰ CỐ SLA',
    items: [
      { to: '/admin/alerts', label: 'Đo kiểm & Cảnh báo', icon: BellRing },
      { to: '/admin/incidents', label: 'Xử lý sự cố viễn thông', icon: ShieldAlert },
      { to: '/admin/sla', label: 'Cam kết SLA & MTTR', icon: ShieldCheck },
      { to: '/admin/network-policies', label: 'Chính sách QoS băng thông', icon: Gauge },
      { to: '/admin/blacklist', label: 'Danh sách cấm MAC', icon: Ban },
      { to: '/admin/access-logs', label: 'Nhật ký 12 tháng pháp lý', icon: Lock },
      { to: '/admin/radius-gateway', label: 'RADIUS & OPNsense', icon: Server },
    ],
  },
  {
    groupTitle: 'CỔNG CHÀO & TRUYỀN THÔNG SỐ',
    items: [
      { to: '/admin/portal-builder', label: 'Trình dựng Cổng chào', icon: Palette },
      { to: '/admin/campaigns', label: 'Chiến dịch tuyên truyền', icon: Megaphone },
      { to: '/admin/surveys', label: 'Khảo sát ý kiến nhân dân', icon: ClipboardList },
      { to: '/admin/dns-filtering', label: 'Bộ lọc tên miền DNS & DVC', icon: Globe },
    ],
  },
  {
    groupTitle: 'QUẢN TRỊ CHÍNH QUYỀN & HỆ THỐNG',
    items: [
      { to: '/admin/government-report', label: 'Báo cáo Sở TT&TT / UBND', icon: Landmark },
      { to: '/admin/users', label: 'Cán bộ 5 cấp & Địa bàn', icon: UserCheck },
      { to: '/admin/role-permissions', label: 'Ma trận phân quyền RBAC', icon: KeyRound },
      { to: '/admin/system-settings', label: 'Cấu hình tham số hệ thống', icon: Settings },
      { to: '/admin/analytics', label: 'Thống kê & Báo cáo', icon: BarChart3 },
      { to: '/admin/audit', label: 'Nhật ký kiểm toán an toàn', icon: ScrollText },
      { to: '/admin/gateway', label: 'Chẩn đoán kết nối Gateway', icon: Radio },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AdminUserDto | null>(authApi.getCurrentUser());
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusDto | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    authApi.getMe()
      .then(setCurrentUser)
      .catch(() => navigate('/admin/login'));

    adminApi.getGatewayStatus()
      .then(setGatewayStatus)
      .catch(console.error);

    const gatewayTimer = setInterval(() => {
      adminApi.getGatewayStatus().then(setGatewayStatus).catch(() => {});
    }, 30000);

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);

    return () => {
      clearInterval(gatewayTimer);
      clearInterval(clockTimer);
    };
  }, [navigate]);

  const handleLogout = () => {
    authApi.logout();
    navigate('/admin/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ROLE_SUPER_ADMIN':
        return { label: 'Quản trị Tối cao', color: 'bg-slate-800 text-slate-100 border-slate-600' };
      case 'ROLE_SOTTTT_ADMIN':
        return { label: 'Sở TT&TT Hải Phòng', color: 'bg-[#004b87] text-white border-[#003865]' };
      case 'ROLE_DISTRICT_OFFICER':
        return { label: 'Cán bộ Quận/Huyện', color: 'bg-slate-700 text-slate-100 border-slate-600' };
      case 'ROLE_COMMUNE_OFFICER':
        return { label: 'Cán bộ Phường/Xã', color: 'bg-slate-700 text-slate-100 border-slate-600' };
      case 'ROLE_VNPT_ENGINEER':
        return { label: 'Kỹ sư VNPT', color: 'bg-[#003865] text-blue-100 border-blue-700' };
      default:
        return { label: 'Cán bộ Vận hành', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0c2340] text-white px-4 py-3 flex items-center justify-between border-b border-[#18365a] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#a81c1c] text-yellow-300 font-bold flex items-center justify-center text-xs border border-amber-300/40">
            ★
          </div>
          <span className="font-bold text-xs uppercase tracking-wide">Wi-Fi Hải Phòng • Quản Trị</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#13355e] cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-72 bg-[#0c2340] text-slate-300 flex flex-col border-r border-[#18365a] transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Department / Brand Banner */}
        <div className="p-4 border-b border-[#18365a] bg-[#091a30]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 aspect-square rounded-sm bg-[#a81c1c] border border-yellow-400/50 text-yellow-300 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              ★ HP
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest leading-none">
                UBND TP. HẢI PHÒNG
              </div>
              <div className="text-[10.5px] text-slate-300 font-medium truncate mt-1">
                Cổng Quản Trị Wi-Fi Công Cộng
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Gateway Telemetry Status Strip */}
        <div className="px-4 py-2 border-b border-[#18365a] bg-[#071628] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Gateway OPNsense</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Circle className="w-2 h-2 fill-current text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold text-[10px]">Trực tuyến (24/7)</span>
          </div>
        </div>

        {/* Categorized Nav Groups */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.groupTitle}
              </div>
              <div className="space-y-0.5">
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
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                        isActive
                          ? 'bg-[#004b87] text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-[#13355e]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Direct Link to Guest Portal */}
        <div className="p-3 border-t border-[#18365a] bg-[#091a30]">
          <a
            href="/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-[#13355e] border border-[#18365a] transition"
          >
            <span className="flex items-center gap-2 text-[11px]">
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              Mở Cổng chào Người dân
            </span>
            <span className="text-[10px] font-mono text-slate-400">/portal</span>
          </a>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-[#18365a] bg-[#071628] flex items-center justify-between gap-2">
          <div className="truncate pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200 truncate">
                {currentUser?.fullName || currentUser?.username || 'Cán bộ Quản trị'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
              {currentUser?.email || 'admin@haiphong.gov.vn'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất an toàn"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-[#13355e] border border-transparent hover:border-red-900/30 transition cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Container with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-12 bg-white border-b border-slate-300 px-6 items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Trung tâm Điều hành:</span>
            <span className="text-xs font-bold text-slate-800">
              Mạng Wi-Fi Công cộng 1.584 Nhà Văn Hóa Hải Phòng
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Clock UTC+7 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-sm font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime} (GMT+7)</span>
            </div>

            {/* Officer Role Badge */}
            <div
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-sm border flex items-center gap-1.5 ${roleInfo.color}`}
            >
              <Shield className="w-3 h-3" />
              <span>{roleInfo.label}</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto bg-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
