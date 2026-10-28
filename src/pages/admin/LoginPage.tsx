import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Loader2, Info, ArrowLeft } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm max-w-sm w-full overflow-hidden border border-slate-200">
        <div className="p-6 text-center border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 mb-2 border border-emerald-100/60">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Wi-Fi Chùa</h1>
          <p className="text-xs text-slate-500 mt-0.5">Đăng nhập tài khoản quản trị hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && <AlertBanner type="error" message={error} />}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 transition"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Đăng nhập hệ thống
          </button>

          {/* Local Development Credentials Note */}
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Tài khoản mặc định: <code className="font-mono bg-slate-200/80 px-1 py-0.5 rounded font-semibold text-slate-900">admin</code> / <code className="font-mono bg-slate-200/80 px-1 py-0.5 rounded font-semibold text-slate-900">admin123</code>
            </div>
          </div>
        </form>

        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 text-center text-xs text-slate-400">
          <a href="/portal" className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Chuyển sang Cổng khách (Guest Portal)
          </a>
        </div>
      </div>
    </div>
  );
};
