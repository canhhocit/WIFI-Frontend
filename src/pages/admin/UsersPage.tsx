import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Lock,
  Unlock,
  Building,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminUserDto, AdminUnitDto, CreateAdminUserRequest, UpdateAdminUserRequest, AdminRoleType } from '../../types/models';

const ROLE_LABELS: Record<AdminRoleType, { label: string; color: string; desc: string }> = {
  ROLE_SUPER_ADMIN: {
    label: 'Quản trị cấp cao (Toàn quyền)',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Toàn quyền cấu hình hệ thống, tài khoản và mạng lưới',
  },
  ROLE_SOTTTT_ADMIN: {
    label: 'Cán bộ Sở TT&TT',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Quản lý điểm Wi-Fi, duyệt tin truyền thông, xem báo cáo toàn thành phố',
  },
  ROLE_DISTRICT_OFFICER: {
    label: 'Cán bộ Quận / Huyện',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Giám sát và cập nhật thông tin điểm Wi-Fi thuộc địa bàn quản lý',
  },
  ROLE_COMMUNE_OFFICER: {
    label: 'Cán bộ Phường / Xã',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    desc: 'Theo dõi tình hình hoạt động trạm Wi-Fi Nhà văn hóa cơ sở',
  },
  ROLE_VNPT_ENGINEER: {
    label: 'Kỹ sư Viễn thông VNPT',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Kỹ thuật vận hành, cấu hình thiết bị, xử lý sự cố viễn thông',
  },
  ROLE_ADMIN: {
    label: 'Quản trị viên tiêu chuẩn',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    desc: 'Quyền vận hành chung',
  },
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'ROLE_DISTRICT_OFFICER' as AdminRoleType,
    adminUnitId: '' as string | number,
    phoneNumber: '',
    enabled: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, unitsRes] = await Promise.all([
        adminApi.getUsers({ search, page: 0, size: 50 }),
        adminApi.getAdminTree(),
      ]);
      setUsers(usersRes.content || []);
      setAdminUnits(unitsRes || []);
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'ROLE_DISTRICT_OFFICER',
      adminUnitId: '',
      phoneNumber: '',
      enabled: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: AdminUserDto) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      email: user.email,
      fullName: user.fullName,
      role: (user.role as AdminRoleType) || 'ROLE_DISTRICT_OFFICER',
      adminUnitId: user.adminUnitId || '',
      phoneNumber: user.phoneNumber || '',
      enabled: user.enabled,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingUser) {
        const updateReq: UpdateAdminUserRequest = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          adminUnitId: formData.adminUnitId ? Number(formData.adminUnitId) : undefined,
          phoneNumber: formData.phoneNumber,
          newPassword: formData.password ? formData.password : undefined,
          enabled: formData.enabled,
        };
        await adminApi.updateUser(editingUser.id, updateReq);
        setActionSuccess(`Cập nhật thông tin cán bộ '${formData.fullName}' thành công.`);
      } else {
        const createReq: CreateAdminUserRequest = {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          adminUnitId: formData.adminUnitId ? Number(formData.adminUnitId) : undefined,
          phoneNumber: formData.phoneNumber,
        };
        await adminApi.createUser(createReq);
        setActionSuccess(`Tạo tài khoản cán bộ '${formData.username}' thành công.`);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Thao tác không thành công');
    }
  };

  const handleToggleStatus = async (user: AdminUserDto) => {
    try {
      await adminApi.toggleUserStatus(user.id);
      setActionSuccess(`Đã thay đổi trạng thái hoạt động của tài khoản ${user.username}`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const handleUnlockUser = async (user: AdminUserDto) => {
    try {
      await adminApi.unlockUser(user.id);
      setActionSuccess(`Đã mở khóa và khôi phục truy cập cho cán bộ ${user.username}`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi mở khóa tài khoản');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quản lý Tài khoản Cán bộ & Phân cấp Quản trị</h1>
              <p className="text-sm text-gray-500">
                Phân quyền 5 cấp chính quyền Hải Phòng (Sở TT&TT, Quận/Huyện, Xã/Phường, VNPT) & Gán địa bàn phụ trách
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Thêm Cán bộ Mới
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{actionError}</span>
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
            placeholder="Tìm theo tên đăng nhập, họ tên cán bộ, email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">-- Tất cả vai trò chính quyền --</option>
            <option value="ROLE_SUPER_ADMIN">Quản trị cấp cao (Toàn quyền)</option>
            <option value="ROLE_SOTTTT_ADMIN">Cán bộ Sở TT&TT</option>
            <option value="ROLE_DISTRICT_OFFICER">Cán bộ Quận / Huyện</option>
            <option value="ROLE_COMMUNE_OFFICER">Cán bộ Phường / Xã</option>
            <option value="ROLE_VNPT_ENGINEER">Kỹ sư Viễn thông VNPT</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Cán bộ / Tên đăng nhập</th>
                <th className="py-3 px-4">Vai trò chính quyền</th>
                <th className="py-3 px-4">Địa bàn phụ trách</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-center">Trạng thái khóa (C02)</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang nạp danh sách tài khoản cán bộ...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Không tìm thấy tài khoản cán bộ phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig = ROLE_LABELS[user.role as AdminRoleType] || ROLE_LABELS.ROLE_ADMIN;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500 font-mono">@{user.username}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.adminUnitName ? (
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Building className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>{user.adminUnitName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Toàn thành phố / Trung ương</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {user.locked ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                              <Lock className="w-3 h-3 mr-1" /> Tạm khóa
                            </span>
                            <span className="text-[10px] text-red-500 mt-0.5">Nhập sai 5 lần</span>
                          </div>
                        ) : user.enabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.locked && (
                            <button
                              onClick={() => handleUnlockUser(user)}
                              title="Mở khóa tài khoản (C02)"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Sửa thông tin"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            title={user.enabled ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.enabled ? 'text-gray-400 hover:text-red-600' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {user.enabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

      {/* Modal Create / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {editingUser ? `Cập nhật Cán bộ: ${editingUser.fullName}` : 'Thêm mới Cán bộ Quản trị'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="vd: canbo_hongbang"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  {editingUser ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="vd: Nguyễn Văn A"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="canbo@haiphong.gov.vn"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Vai trò hệ thống *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRoleType })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ROLE_SUPER_ADMIN">ROLE_SUPER_ADMIN - Quản trị cấp cao</option>
                  <option value="ROLE_SOTTTT_ADMIN">ROLE_SOTTTT_ADMIN - Cán bộ Sở TT&TT</option>
                  <option value="ROLE_DISTRICT_OFFICER">ROLE_DISTRICT_OFFICER - Cán bộ Quận / Huyện</option>
                  <option value="ROLE_COMMUNE_OFFICER">ROLE_COMMUNE_OFFICER - Cán bộ Phường / Xã</option>
                  <option value="ROLE_VNPT_ENGINEER">ROLE_VNPT_ENGINEER - Kỹ sư Viễn thông VNPT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Gán Địa bàn Quản lý (Quận/Huyện/Xã)
                </label>
                <select
                  value={formData.adminUnitId}
                  onChange={(e) => setFormData({ ...formData, adminUnitId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Toàn thành phố (Không giới hạn) --</option>
                  {adminUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Cấp {u.level})
                    </option>
                  ))}
                </select>
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
                  {editingUser ? 'Lưu thay đổi' : 'Tạo Cán bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
