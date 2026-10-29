import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  RefreshCw,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  Building,
  Info,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { RolePermissionDto } from '../../types/models';

const MODULES = [
  { key: 'LOCATIONS', label: '1. Điểm phát Wi-Fi (1.584 Điểm Nhà văn hóa)' },
  { key: 'DEVICES', label: '2. Thiết bị phần cứng & AP (OPNsense/Aruba/Ruckus)' },
  { key: 'CAMPAIGNS', label: '3. Chiến dịch truyền thông & Khảo sát ý kiến' },
  { key: 'INCIDENTS', label: '4. Sự cố mạng, Cảnh báo viễn thông & SLA' },
  { key: 'USERS', label: '5. Quản lý cán bộ & Tài khoản phân quyền' },
  { key: 'SETTINGS', label: '6. Cấu hình hệ thống (NTP, Quét phiên, DNS, QoS)' },
];

const ROLES = [
  { key: 'ROLE_SUPER_ADMIN', label: 'Quản trị cấp cao (Toàn quyền)', color: 'text-purple-700 bg-purple-50' },
  { key: 'ROLE_SOTTTT_ADMIN', label: 'Cán bộ Sở TT&TT Hải Phòng', color: 'text-blue-700 bg-blue-50' },
  { key: 'ROLE_DISTRICT_OFFICER', label: 'Cán bộ UBND Quận / Huyện', color: 'text-emerald-700 bg-emerald-50' },
  { key: 'ROLE_COMMUNE_OFFICER', label: 'Cán bộ UBND Xã / Phường', color: 'text-teal-700 bg-teal-50' },
  { key: 'ROLE_VNPT_ENGINEER', label: 'Kỹ sư Kỹ thuật VNPT Hải Phòng', color: 'text-amber-700 bg-amber-50' },
];

export const RolePermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<RolePermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('ROLE_SOTTTT_ADMIN');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRolePermissions();
      setPermissions(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải ma trận phân quyền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const getPerm = (role: string, module: string): RolePermissionDto => {
    const found = permissions.find((p) => p.roleName === role && p.moduleName === module);
    if (found) return found;
    return {
      id: 0,
      roleName: role,
      moduleName: module,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
    };
  };

  const handleToggle = (role: string, module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove') => {
    setPermissions((prev) => {
      const idx = prev.findIndex((p) => p.roleName === role && p.moduleName === module);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          [action]: !updated[idx][action],
        };
        return updated;
      } else {
        const newPerm: RolePermissionDto = {
          id: 0,
          roleName: role,
          moduleName: module,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canApprove: false,
          [action]: true,
        };
        return [...prev, newPerm];
      }
    });
  };

  const handleSaveRole = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const rolePerms = MODULES.map((m) => getPerm(selectedRole, m.key));
      for (const p of rolePerms) {
        await adminApi.updateRolePermission({
          roleName: selectedRole,
          moduleName: p.moduleName,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
          canApprove: p.canApprove,
        });
      }
      setSuccessMsg(`Cập nhật thành công quyền hạn cho vai trò: ${selectedRole}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu ma trận phân quyền');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ma trận Phân quyền Vai trò Chính quyền (Screen C05)</h1>
            <p className="text-sm text-gray-500">
              Kiểm soát chi tiết quyền Xem, Thêm, Sửa, Xóa và Duyệt nội dung theo 5 vai trò chính quyền Hải Phòng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPermissions}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={handleSaveRole}
            disabled={saving || selectedRole === 'ROLE_SUPER_ADMIN'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu Quyền Hạn'}
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

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setSelectedRole(r.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              selectedRole === r.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Role Details Notice */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3 text-sm text-blue-900">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Đang cấu hình: </span>
          {ROLES.find((r) => r.key === selectedRole)?.label}
          {selectedRole === 'ROLE_SUPER_ADMIN' && (
            <span className="ml-2 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
              Vai trò Quản trị cấp cao luôn mặc định có tất cả quyền hạn
            </span>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Phân hệ chức năng</th>
              <th className="py-3 px-4 text-center">Xem (View)</th>
              <th className="py-3 px-4 text-center">Tạo mới (Create)</th>
              <th className="py-3 px-4 text-center">Chỉnh sửa (Edit)</th>
              <th className="py-3 px-4 text-center">Xóa (Delete)</th>
              <th className="py-3 px-4 text-center">Phê duyệt (Approve)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MODULES.map((mod) => {
              const perm = getPerm(selectedRole, mod.key);
              const isSuper = selectedRole === 'ROLE_SUPER_ADMIN';

              return (
                <tr key={mod.key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">{mod.label}</td>

                  {/* Can View */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      disabled={isSuper}
                      onClick={() => handleToggle(selectedRole, mod.key, 'canView')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        perm.canView ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {perm.canView ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Can Create */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      disabled={isSuper}
                      onClick={() => handleToggle(selectedRole, mod.key, 'canCreate')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        perm.canCreate ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {perm.canCreate ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Can Edit */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      disabled={isSuper}
                      onClick={() => handleToggle(selectedRole, mod.key, 'canEdit')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        perm.canEdit ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {perm.canEdit ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Can Delete */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      disabled={isSuper}
                      onClick={() => handleToggle(selectedRole, mod.key, 'canDelete')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        perm.canDelete ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {perm.canDelete ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Can Approve */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      disabled={isSuper}
                      onClick={() => handleToggle(selectedRole, mod.key, 'canApprove')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        perm.canApprove ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {perm.canApprove ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
