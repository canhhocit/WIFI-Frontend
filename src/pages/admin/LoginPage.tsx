import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, Loader2, Info, ArrowLeft, Shield, UserCheck, Wrench, Building } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { AlertBanner } from '../../components/AlertBanner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.login(username, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4f9] via-[#f8fafc] to-[#eef2f7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Government Geometric Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* National Emblem & Department Banner */}
        <div className="text-center mb-6 space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-700 text-yellow-300 font-bold text-xl shadow-md border border-yellow-300/40 mb-2">
            ★
          </div>
          <div className="text-[11px] font-bold tracking-widest text-slate-800 uppercase">
            Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
          </div>
          <div className="text-[10.5px] text-slate-600 italic">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="h-0.5 w-24 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 mx-auto my-2 rounded-full" />
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Ủy Ban Nhân Dân Thành Phố Hải Phòng
          </h2>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Cổng Quản Trị Hệ Thống Wi-Fi Công Cộng
          </h1>
          <p className="text-[11px] text-slate-500">
            Hạ tầng điều hành 1.584 điểm Nhà văn hóa & Trung tâm văn hóa cơ sở
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-300/40 overflow-hidden border border-slate-200/90">
          <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Xác thực Cán bộ Quản trị
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Bảo mật 2FA & RBAC
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <AlertBanner type="error" message={error} />}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên đăng nhập cán bộ
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-mono transition shadow-xs"
                placeholder="vd: admin hoặc canbo_haiphong"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu truy cập
                </label>
                <span className="text-[10px] text-slate-500">Khóa sau 5 lần sai (C02)</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 transition shadow-xs"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg text-xs font-bold tracking-wide transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 uppercase"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              ĐĂNG NHẬP HỆ THỐNG
            </button>
          </form>

          {/* Fast Switch Account for Audit & Testing */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 space-y-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Tài khoản mẫu phân quyền 5 cấp (Click để chọn nhanh):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin', 'admin123')}
                className={`p-2 rounded-lg border text-left transition flex items-start gap-1.5 ${
                  username === 'admin'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Quản trị Tối cao</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('sotttt_admin', 'password123')}
                className={`p-2 rounded-lg border text-left transition flex items-start gap-1.5 ${
                  username === 'sotttt_admin'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Sở TT&TT</div>
                  <div className="text-[10px] text-slate-500 font-mono">sotttt_admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('hongbang_officer', 'password123')}
                className={`p-2 rounded-lg border text-left transition flex items-start gap-1.5 ${
                  username === 'hongbang_officer'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">UBND Quận H.Bàng</div>
                  <div className="text-[10px] text-slate-500 font-mono">hongbang_officer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('vnpt_tech01', 'password123')}
                className={`p-2 rounded-lg border text-left transition flex items-start gap-1.5 ${
                  username === 'vnpt_tech01'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Kỹ sư VNPT</div>
                  <div className="text-[10px] text-slate-500 font-mono">vnpt_tech01</div>
                </div>
              </button>
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Phiên bản v2.4.0 (Chính quyền số)</span>
            <a
              href="/portal"
              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Về Cổng khách
            </a>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          © 2026 Sở Thông tin và Truyền thông Thành phố Hải Phòng. Phối hợp vận hành cùng VNPT Hải Phòng.
        </p>
      </div>
    </div>
  );
};
