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
  Plus,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { SystemSettingDto } from '../../types/models';

const FRIENDLY_NAMES: Record<string, { title: string; unit?: string }> = {
  'network.ntp.server': { title: 'Máy chủ đồng bộ thời gian NTP', unit: 'FQDN / IP' },
  'session.guest.default_timeout_minutes': { title: 'Thời lượng mặc định một phiên Wi-Fi', unit: 'phút' },
  'session.guest.max_bandwidth_mbps': { title: 'Băng thông tối đa mỗi thiết bị công dân', unit: 'Mbps' },
  'security.admin.max_failed_attempts': { title: 'Số lần đăng nhập sai tối đa trước khi khóa tài khoản', unit: 'lần sai' },
  'security.admin.lockout_duration_minutes': { title: 'Thời gian tạm khóa tài khoản cán bộ', unit: 'phút' },
  'telco.otp.default_gateway': { title: 'Đầu mối cổng gửi OTP SMS Brandname', unit: 'Nhà mạng' },
  'gateway.health_check_interval_seconds': { title: 'Chu kỳ kiểm tra trạng thái trạm phát Gateway', unit: 'giây' },
};

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New setting modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('NETWORK');
  const [newDescription, setNewDescription] = useState('');

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

  const handleCreateNewSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      await adminApi.updateSystemSetting(newKey.trim(), {
        settingValue: newValue.trim(),
        description: newDescription.trim() || undefined,
      });
      setSuccessMsg(`Thêm mới tham số '${newKey}' thành công.`);
      setShowAddModal(false);
      setNewKey('');
      setNewValue('');
      setNewDescription('');
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tạo mới tham số');
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

  const filteredSettings = activeCategory === 'ALL'
    ? settings
    : settings.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cấu Hình Tham Số Hệ Thống</h1>
            <p className="text-sm text-gray-500">
              Quản lý các thông số vận hành cốt lõi: thời lượng phiên truy cập, bảo mật đăng nhập, máy chủ NTP & viễn thông
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-sm border border-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm Tham Số
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm flex items-center gap-3 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 bg-white p-1.5 rounded-sm border border-gray-200 shadow-xs">
        {[
          { key: 'ALL', label: 'Tất cả tham số' },
          { key: 'NETWORK', label: 'Mạng & NTP' },
          { key: 'SESSION', label: 'Phiên truy cập Wi-Fi' },
          { key: 'SECURITY', label: 'Bảo mật & Khóa tài khoản' },
          { key: 'TELCO', label: 'Viễn thông & Brandname' },
          { key: 'GATEWAY', label: 'Gateway & Tường lửa' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition cursor-pointer ${
              activeCategory === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-gray-400 bg-white rounded-sm border border-gray-100">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Đang nạp cấu hình hệ thống...
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-gray-400 bg-white rounded-sm border border-gray-200">
            Không có tham số nào thuộc phân nhóm này.
          </div>
        ) : (
          filteredSettings.map((item) => {
            const friendly = FRIENDLY_NAMES[item.settingKey];
            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-sm border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-gray-50 rounded-sm border border-slate-100">{getCategoryIcon(item.category)}</div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {friendly ? friendly.title : item.settingKey}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {item.settingKey}
                          </span>
                          {friendly?.unit && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Đơn vị: <strong className="text-slate-700">{friendly.unit}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{item.description || 'Không có mô tả chi tiết'}</p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Giá trị cấu hình {friendly?.unit ? `(${friendly.unit})` : ''}
                    </label>
                    <input
                      type="text"
                      value={formData[item.settingKey] ?? ''}
                      onChange={(e) => handleChange(item.settingKey, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === item.settingKey ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add Parameter */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Thêm Tham Số Hệ Thống Mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNewSetting} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mã tham số (Key) *</label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="vd: session.max_concurrent_users"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Giá trị tham số *</label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="vd: 500"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mô tả mục đích sử dụng</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Giải thích tác động và ý nghĩa của tham số..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm shadow-sm transition-colors cursor-pointer"
                >
                  Lưu Tham Số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

