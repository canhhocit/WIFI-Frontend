import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { DnsDomainRuleDto, CreateDnsDomainRuleRequest } from '../../types/models';

export const DnsFilteringPage: React.FC = () => {
  const [rules, setRules] = useState<DnsDomainRuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleTypeFilter, setRuleTypeFilter] = useState<'ALL' | 'WHITELIST' | 'BLOCKLIST'>('ALL');
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal create
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateDnsDomainRuleRequest>({
    domainName: '',
    ruleType: 'BLOCKLIST',
    category: 'GAMBLING',
    description: '',
    active: true,
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDnsRules({
        ruleType: ruleTypeFilter === 'ALL' ? undefined : ruleTypeFilter,
        search,
        page: 0,
        size: 50,
      });
      setRules(res.content || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải danh sách quy tắc DNS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [ruleTypeFilter, search]);

  const handleToggle = async (rule: DnsDomainRuleDto) => {
    try {
      await adminApi.toggleDnsRule(rule.id);
      setSuccessMsg(`Đã đổi trạng thái quy tắc '${rule.domainName}'`);
      fetchRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đổi trạng thái quy tắc');
    }
  };

  const handleDelete = async (rule: DnsDomainRuleDto) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy tắc lọc tên miền '${rule.domainName}'?`)) return;
    try {
      await adminApi.deleteDnsRule(rule.id);
      setSuccessMsg(`Đã xóa quy tắc tên miền '${rule.domainName}'`);
      fetchRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xóa quy tắc');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await adminApi.createDnsRule(formData);
      setSuccessMsg(`Thêm quy tắc tên miền '${formData.domainName}' thành công.`);
      setShowModal(false);
      setFormData({
        domainName: '',
        ruleType: 'BLOCKLIST',
        category: 'GAMBLING',
        description: '',
        active: true,
      });
      fetchRules();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo quy tắc DNS');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bộ lọc Tên miền DNS & Whitelist Dịch vụ công (Screen B10)</h1>
            <p className="text-sm text-gray-500">
              Chặn truy cập trang web cờ bạc, đồi trụy, mã độc & Ưu tiên thông suốt Cổng DVC Hải Phòng và Quốc gia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRules}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Tên miền
          </button>
        </div>
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

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên miền (vd: haiphong.gov.vn, bet88.com)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setRuleTypeFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              ruleTypeFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setRuleTypeFilter('WHITELIST')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              ruleTypeFilter === 'WHITELIST' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-emerald-700'
            }`}
          >
            Whitelist (Ưu tiên)
          </button>
          <button
            onClick={() => setRuleTypeFilter('BLOCKLIST')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              ruleTypeFilter === 'BLOCKLIST' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-red-700'
            }`}
          >
            Blocklist (Chặn)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tên miền (Domain FQDN)</th>
                <th className="py-3 px-4">Loại quy tắc</th>
                <th className="py-3 px-4">Danh mục phân loại</th>
                <th className="py-3 px-4">Mô tả / Mục đích</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang nạp danh sách tên miền DNS...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Không tìm thấy quy tắc tên miền phù hợp.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const isWhitelist = rule.ruleType === 'WHITELIST';
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isWhitelist ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                          <span>{rule.domainName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isWhitelist
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {isWhitelist ? 'WHITELIST (Cho phép/Ưu tiên)' : 'BLOCKLIST (Chặn triệt để)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{rule.category || 'CHUNG'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600">{rule.description || '---'}</td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {rule.active ? 'Đang hiệu lực' : 'Đang tạm dừng'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(rule)}
                            title={rule.active ? 'Tạm dừng quy tắc' : 'Kích hoạt quy tắc'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              rule.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:text-emerald-600'
                            }`}
                          >
                            {rule.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            title="Xóa quy tắc tên miền"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Thêm Quy tắc Lọc Tên miền DNS (Screen B10)</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tên miền (FQDN) *</label>
                <input
                  type="text"
                  required
                  value={formData.domainName}
                  onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                  placeholder="vd: haiphong.gov.vn hoặc bet88.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Loại quy tắc *</label>
                <select
                  value={formData.ruleType}
                  onChange={(e) =>
                    setFormData({ ...formData, ruleType: e.target.value as 'BLOCKLIST' | 'WHITELIST' })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BLOCKLIST">BLOCKLIST - Chặn truy cập người dân</option>
                  <option value="WHITELIST">WHITELIST - Cho phép thông suốt & Ưu tiên</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Danh mục phân loại</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GAMBLING">Cờ bạc / Cá độ trực tuyến</option>
                  <option value="MALWARE">Mã độc / Lừa đảo người dân</option>
                  <option value="ADULT">Nội dung đồi trụy / Không lành mạnh</option>
                  <option value="GOV_PORTAL">Cổng thông tin Điện tử Thành phố</option>
                  <option value="PUBLIC_SERVICE">Dịch vụ công Trực tuyến</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mô tả / Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú căn cứ pháp lý hoặc quyết định chặn/cho phép..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Thêm Quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

