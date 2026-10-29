import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Server,
  Clock,
  ShieldCheck,
  Smartphone,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { SystemSettingDto } from '../../types/models';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSystemSettings();
      setSettings(data || []);
      const formMap: Record<string, string> = {};
      (data || []).forEach((s) => {
        formMap[s.settingKey] = s.settingValue;
      });
      setFormData(formMap);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải tham số cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSetting = async (setting: SystemSettingDto) => {
    try {
      setSavingKey(setting.settingKey);
      setErrorMsg(null);
      setSuccessMsg(null);

      const updatedVal = formData[setting.settingKey];
      await adminApi.updateSystemSetting(setting.settingKey, {
        settingValue: updatedVal,
        description: setting.description,
      });

      setSuccessMsg(`Cập nhật tham số '${setting.settingKey}' thành công.`);
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingKey(null);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'NETWORK':
        return <Server className="w-5 h-5 text-blue-600" />;
      case 'SESSION':
        return <Clock className="w-5 h-5 text-emerald-600" />;
      case 'SECURITY':
        return <ShieldCheck className="w-5 h-5 text-purple-600" />;
      case 'TELCO':
        return <Smartphone className="w-5 h-5 text-amber-600" />;
      case 'GATEWAY':
        return <Activity className="w-5 h-5 text-cyan-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 text-gray-700 rounded-lg">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cấu hình Hệ thống Chung (Screen C06)</h1>
            <p className="text-sm text-gray-500">
              Quản trị tham số toàn hệ thống: Đồng bộ NTP, Chu kỳ quét phiên, Bảo mật khóa tài khoản & Brandname SMS
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Đang nạp cấu hình hệ thống...
          </div>
        ) : (
          settings.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-gray-200 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-50 rounded-lg">{getCategoryIcon(item.category)}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 font-mono text-sm">{item.settingKey}</h3>
                      <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                        Phân nhóm: {item.category || 'GENERAL'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-4">{item.description || 'Không có mô tả chi tiết'}</p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Giá trị hiện tại</label>
                  <input
                    type="text"
                    value={formData[item.settingKey] ?? ''}
                    onChange={(e) => handleChange(item.settingKey, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Cập nhật: {item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : 'Mặc định'}
                </span>
                <button
                  onClick={() => handleSaveSetting(item)}
                  disabled={savingKey === item.settingKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingKey === item.settingKey ? 'Đang lưu...' : 'Lưu giá trị'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guidelines Box */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 text-xs text-gray-600">
        <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-700">Lưu ý quản trị hạ tầng (Sở TT&TT & VNPT Hải Phòng):</p>
          <p>
            - Tham số <strong>session_scan_interval_sec</strong> điều khiển chu kỳ luồng Background Daemon quét và thu hồi phiên người dân hết hạn.
          </p>
          <p>
            - Tham số <strong>max_failed_logins</strong> và <strong>account_lockout_duration_min</strong> kích hoạt cơ chế khóa tài khoản cán bộ cấp phường/quận khi có dấu hiệu tấn công dò mật khẩu (Screen C02).
          </p>
        </div>
      </div>
    </div>
  );
};
