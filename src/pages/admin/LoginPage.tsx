import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, Loader2, Info, ArrowLeft, Shield, UserCheck, Wrench, Building } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { AlertBanner } from '../../components/AlertBanner';
import { VietnamFlag } from '../../components/VietnamFlag';
import { ViettelLogo } from '../../components/ViettelLogo';

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
        {/* National Emblem & Viettel Telecom Co-Branding Banner */}
        <div className="text-center mb-6 space-y-2">
          {/* Dual Emblem Bar */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <VietnamFlag width={56} height={37} className="rounded-xs shadow-md border border-amber-300/40" />
            <div className="h-8 w-px bg-slate-300" />
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
              <ViettelLogo height={24} variant="simple" color="red" showTagline={false} />
            </div>
          </div>

          <div className="text-[11px] font-bold tracking-widest text-slate-800 uppercase">
            Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
          </div>
          <div className="text-[10px] text-slate-500 italic">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="h-0.5 w-20 bg-[#ee0033] mx-auto my-1.5" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            UBND TP. HẢI PHÒNG × VIETTEL HẢI PHÒNG
          </h2>
          <h1 className="text-base sm:text-lg font-black text-[#ee0033] uppercase tracking-tight">
            Hệ Thống Quản Trị Wi-Fi Công Cộng
          </h1>
          <p className="text-[11px] text-slate-500">
            Hạ tầng viễn thông số phục vụ Nhân dân & Chính quyền điện tử
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Official Viettel Red Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-[#ee0033] via-[#ff2d55] to-[#c4002b] w-full" />

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <AlertBanner type="error" message={error} />}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#ee0033] focus:ring-2 focus:ring-red-100 text-slate-900 font-mono transition"
                placeholder="vd: admin hoặc viettel_tech01"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu truy cập
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#ee0033] focus:ring-2 focus:ring-red-100 text-slate-900 transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ee0033] to-[#c4002b] hover:from-[#ff1a4b] hover:to-[#d80027] text-white rounded-xl text-xs font-black tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 cursor-pointer disabled:opacity-50 uppercase mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-yellow-300" /> : <KeyRound className="w-4 h-4" />}
              ĐĂNG NHẬP HỆ THỐNG
            </button>
          </form>

          {/* Fast Switch Account for Audit & Testing */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Tài khoản thử nghiệm
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin', 'admin123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'admin'
                    ? 'border-[#ee0033] bg-red-50 text-[#ee0033] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Quản trị viên</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('sotttt_admin', 'password123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'sotttt_admin'
                    ? 'border-[#ee0033] bg-red-50 text-[#ee0033] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Sở KH&CN</div>
                  <div className="text-[10px] text-slate-500 font-mono">sotttt_admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('hongbang_officer', 'password123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'hongbang_officer'
                    ? 'border-[#ee0033] bg-red-50 text-[#ee0033] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">UBND Phường/Xã</div>
                  <div className="text-[10px] text-slate-500 font-mono">hongbang_officer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('viettel_tech01', 'password123')}
                className={`p-2 rounded-sm border text-left transition flex items-start gap-1.5 cursor-pointer ${
                  username === 'viettel_tech01'
                    ? 'border-[#ee0033] bg-red-50 text-[#ee0033] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Kỹ thuật viên</div>
                  <div className="text-[10px] text-slate-500 font-mono">viettel_tech01</div>
                </div>
              </button>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <a
              href="/portal"
              className="text-[#ee0033] hover:underline font-bold inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Xem Cổng Portal Wi-Fi
            </a>
            <span className="text-[10.5px]">Tổng đài Viettel: <strong className="text-[#ee0033]">1800.8119</strong></span>
          </div>
        </div>

        <div className="text-center text-[10.5px] text-slate-500 mt-4 space-y-1">
          <p>© 2026 UBND Thành phố Hải Phòng • Hợp tác phát triển cùng Viettel Hải Phòng</p>
          <p className="text-[10px] text-slate-400">Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)</p>
        </div>
      </div>
    </div>
  );
};
