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
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* National Emblem & Department Banner */}
        <div className="text-center mb-5 space-y-1">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded bg-red-700 text-yellow-300 font-bold text-lg border border-amber-300/40 mb-1.5 shadow-xs">
            ★ HP
          </div>
          <div className="text-[11px] font-bold tracking-widest text-slate-800 uppercase">
            Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
          </div>
          <div className="text-[10px] text-slate-600 italic">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="h-0.5 w-20 bg-red-700 mx-auto my-1.5" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ủy Ban Nhân Dân Thành Phố Hải Phòng
          </h2>
          <h1 className="text-base font-extrabold text-[#004b87] uppercase tracking-tight">
            Hệ Thống Quản Trị Wi-Fi Công Cộng
          </h1>
          <p className="text-[11px] text-slate-500">
            Hạ tầng điều hành 1.584 điểm Nhà văn hóa & Trung tâm văn hóa cơ sở
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
          {/* Official Top Accent Line */}
          <div className="h-1 bg-[#004b87] w-full" />

          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#004b87]" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Xác thực Cán bộ Quản trị
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-sm">
              Tiêu chuẩn ATTT Cấp độ 3
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {error && <AlertBanner type="error" message={error} />}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tên đăng nhập cán bộ
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] text-slate-900 font-mono transition"
                placeholder="vd: admin hoặc sotttt_admin"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu truy cập
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Khóa sau 5 lần sai (C02)</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] text-slate-900 transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#004b87] hover:bg-[#003865] active:bg-[#002848] text-white rounded-sm text-xs font-bold tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 uppercase"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              ĐĂNG NHẬP HỆ THỐNG
            </button>
          </form>

          {/* Fast Switch Account for Audit & Testing */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Tài khoản kiểm thử phân quyền 5 cấp:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin', 'admin123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'admin'
                    ? 'border-[#004b87] bg-blue-50 text-[#004b87] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Quản trị Tối cao</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('sotttt_admin', 'password123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'sotttt_admin'
                    ? 'border-[#004b87] bg-blue-50 text-[#004b87] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Sở TT&TT</div>
                  <div className="text-[10px] text-slate-500 font-mono">sotttt_admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('hongbang_officer', 'password123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'hongbang_officer'
                    ? 'border-[#004b87] bg-blue-50 text-[#004b87] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">UBND Q.Hồng Bàng</div>
                  <div className="text-[10px] text-slate-500 font-mono">hongbang_officer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('vnpt_tech01', 'password123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'vnpt_tech01'
                    ? 'border-[#004b87] bg-blue-50 text-[#004b87] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Kỹ sư VNPT</div>
                  <div className="text-[10px] text-slate-500 font-mono">vnpt_tech01</div>
                </div>
              </button>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Phiên bản v2.4.0 (GovTech)</span>
            <a
              href="/portal"
              className="text-[#004b87] hover:underline font-semibold inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cổng chào người dân
            </a>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          © 2026 Sở Thông tin và Truyền thông Thành phố Hải Phòng
        </p>
      </div>
    </div>
  );
};
