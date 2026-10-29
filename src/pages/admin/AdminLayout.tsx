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
} from 'lucide-react';
import { authApi } from '../../api/authApi';
import { adminApi } from '../../api/adminApi';
import { AdminUserDto, GatewayStatusDto } from '../../types/models';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AdminUserDto | null>(authApi.getCurrentUser());
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusDto | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    // Refresh user profile and gateway status
    authApi.getMe()
      .then(setCurrentUser)
      .catch(() => navigate('/admin/login'));

    adminApi.getGatewayStatus()
      .then(setGatewayStatus)
      .catch(console.error);

    // Periodic gateway status poll every 30s
    const interval = setInterval(() => {
      adminApi.getGatewayStatus().then(setGatewayStatus).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    authApi.logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/admin/sessions', label: 'Phiên truy cập', icon: Users },
    { to: '/admin/locations', label: '1.584 Điểm phát', icon: MapPin },
    { to: '/admin/gis', label: 'Bản đồ số GIS', icon: Map },
    { to: '/admin/devices', label: 'Thiết bị & Hạ tầng', icon: Smartphone },
    { to: '/admin/portal-builder', label: 'Trình dựng Cổng chào', icon: Palette },
    { to: '/admin/campaigns', label: 'Chiến dịch truyền thông', icon: Megaphone },
    { to: '/admin/surveys', label: 'Khảo sát ý kiến', icon: ClipboardList },
    { to: '/admin/alerts', label: 'Cảnh báo & Đo kiểm', icon: BellRing },
    { to: '/admin/incidents', label: 'Sự cố & Điều phối', icon: ShieldAlert },
    { to: '/admin/sla', label: 'Cam kết SLA & MTTR', icon: ShieldCheck },
    { to: '/admin/network-policies', label: 'Chính sách QoS', icon: Gauge },
    { to: '/admin/blacklist', label: 'Danh sách cấm MAC', icon: Ban },
    { to: '/admin/access-logs', label: 'Nhật ký 12 tháng', icon: Lock },
    { to: '/admin/radius-gateway', label: 'RADIUS & OPNsense', icon: Server },
    { to: '/admin/analytics', label: 'Báo cáo & Thống kê', icon: BarChart3 },
    { to: '/admin/audit', label: 'Nhật ký hệ thống', icon: ScrollText },
    { to: '/admin/gateway', label: 'Chẩn đoán Gateway', icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-sky-400" />
          <span className="font-bold text-sm">Quản Trị Wi-Fi Portal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Wi-Fi Chùa</h1>
            <span className="text-[11px] text-slate-400 font-medium">Hệ Thống Quản Trị</span>
          </div>
        </div>

        {/* Gateway Health Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Hệ thống mạng</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Circle className="w-2 h-2 fill-current text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Trực tuyến</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick link to Portal */}
        <div className="p-3 border-t border-slate-800/80">
          <a
            href="/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Mở Cổng khách (Portal)
            </span>
          </a>
        </div>

        {/* Current User & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <div className="truncate pr-2">
            <span className="block text-xs font-bold text-slate-200 truncate">
              {currentUser?.fullName || currentUser?.username || 'Quản trị viên'}
            </span>
            <span className="block text-[10px] text-slate-400 font-mono truncate">
              {currentUser?.email || 'admin@captive.local'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
