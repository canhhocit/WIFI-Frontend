import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  X,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminUserDto, AdminUnitDto, CreateAdminUserRequest, UpdateAdminUserRequest, AdminRoleType } from '../../types/models';
import { Pagination } from '../../components/Pagination';
import { useRbac } from '../../utils/rbac';

const ROLE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  ROLE_SUPER_ADMIN: {
    label: 'Quản trị hệ thống (Admin)',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Toàn quyền cấu hình hệ thống, tài khoản và mạng lưới',
  },
  ROLE_SOTTTT_ADMIN: {
    label: 'Cán bộ Sở KH&CN',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Quản lý điểm Wi-Fi, duyệt tin truyền thông, xem báo cáo toàn thành phố',
  },
  ROLE_DISTRICT_OFFICER: {
    label: 'Cán bộ UBND Xã / Phường',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    desc: 'Giám sát và cập nhật thông tin điểm Wi-Fi thuộc địa bàn quản lý',
  },
  ROLE_COMMUNE_OFFICER: {
    label: 'Cán bộ UBND Xã / Phường',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    desc: 'Theo dõi tình hình hoạt động trạm Wi-Fi Nhà văn hóa cơ sở',
  },
  ROLE_ADMIN: {
    label: 'Quản trị hệ thống (Admin)',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Quyền vận hành chung',
  },
};

export const UsersPage: React.FC = () => {
  const { canCreate, canEdit, canDelete } = useRbac('USERS');
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [modalDistrictId, setModalDistrictId] = useState<string>('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'ROLE_COMMUNE_OFFICER' as AdminRoleType,
    adminUnitId: '' as string | number,
    phoneNumber: '',
    enabled: true,
  });

  // Làm phẳng cây đơn vị hành chính 3 cấp (Thành phố -> Quận/Huyện -> Phường/Xã) và hợp nhất dữ liệu các cấp
  const flattenAdminUnits = (
    tree: AdminUnitDto[],
    level2List: AdminUnitDto[],
    level3List: AdminUnitDto[]
  ): AdminUnitDto[] => {
    const map = new Map<number, AdminUnitDto>();

    const walk = (nodes: AdminUnitDto[], parent?: AdminUnitDto) => {
      for (const node of nodes) {
        if (!node || typeof node.id !== 'number') continue;
        const enriched: AdminUnitDto = {
          ...node,
          parentId: node.parentId ?? parent?.id,
          parentName: node.parentName ?? parent?.name,
        };
        map.set(enriched.id, enriched);
        if (Array.isArray(node.children) && node.children.length > 0) {
          walk(node.children, enriched);
        }
      }
    };

    walk(tree || []);
    for (const d of level2List || []) {
      if (d && typeof d.id === 'number' && !map.has(d.id)) {
        map.set(d.id, d);
      }
    }
    for (const w of level3List || []) {
      if (w && typeof w.id === 'number') {
        const existing = map.get(w.id);
        const parentDistrict = w.parentId ? map.get(w.parentId) : undefined;
        map.set(w.id, {
          ...existing,
          ...w,
          parentName: w.parentName || existing?.parentName || parentDistrict?.name,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.level !== b.level) return (a.level || 99) - (b.level || 99);
      return (a.name || '').localeCompare(b.name || '', 'vi');
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const [usersRes, treeRes, level2Res, level3Res] = await Promise.all([
        adminApi.getUsers({ search, page, size: pageSize }),
        adminApi.getAdminTree().catch(() => []),
        adminApi.getAdminByLevel(2).catch(() => []),
        adminApi.getAdminByLevel(3).catch(() => []),
      ]);
      setUsers(usersRes?.content || []);
      setTotalPages(usersRes?.totalPages || 1);
      setTotalElements(usersRes?.totalElements || 0);
      setAdminUnits(flattenAdminUnits(treeRes || [], level2Res || [], level3Res || []));
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, page, pageSize]);

  const cityUnits = adminUnits.filter((u) => u.level === 1);
  const districtUnits = adminUnits.filter((u) => u.level === 2);
  const wardUnits = adminUnits.filter((u) => u.level === 3);

  const formatOfficerFullName = (name?: string) => {
    if (!name) return '';
    return name
      .replace(/Sở TT&TT/gi, 'Sở KH&CN')
      .replace(/Sở Thông tin và Truyền thông/gi, 'Sở Khoa học và Công nghệ')
      .replace(/UBND Quận/gi, 'UBND Phường')
      .replace(/UBND Huyện/gi, 'UBND Xã');
  };

  const resolveUserUnitDisplay = (user: AdminUserDto) => {
    if (user.adminUnitId) {
      const unit = adminUnits.find((u) => u.id === user.adminUnitId);
      if (unit) {
        if (unit.level === 1) {
          return { title: unit.name, subtitle: 'Toàn thành phố', level: 1 };
        }
        if (unit.level === 2) {
          const wardTitle = unit.name
            .replace(/^Quận\s+/i, 'Phường ')
            .replace(/^Huyện\s+/i, 'Xã ');
          return { title: wardTitle, subtitle: 'Xã / Phường', level: 3 };
        }
        if (unit.level === 3) {
          return {
            title: unit.name,
            subtitle: 'Xã / Phường',
            level: 3,
          };
        }
      }
    }
    if (user.adminUnitName) {
      const cleaned = user.adminUnitName
        .replace(/\s*\(Cấp\s*\d+[^)]*\)|\s*\(\d+\)/gi, '')
        .replace(/^Quận\s+/i, 'Phường ')
        .replace(/^Huyện\s+/i, 'Xã ')
        .trim();
      return { title: cleaned, subtitle: 'Xã / Phường', level: 3 };
    }
    return null;
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setModalDistrictId('');
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'ROLE_COMMUNE_OFFICER',
      adminUnitId: '',
      phoneNumber: '',
      enabled: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: AdminUserDto) => {
    setEditingUser(user);
    let initialDistrictId = '';
    if (user.adminUnitId) {
      const matched = adminUnits.find((u) => u.id === user.adminUnitId);
      if (matched) {
        if (matched.level === 2) {
          initialDistrictId = String(matched.id);
        } else if (matched.level === 3 && matched.parentId) {
          initialDistrictId = String(matched.parentId);
        } else if (matched.level === 1) {
          initialDistrictId = `CITY_${matched.id}`;
        }
      }
    }
    setModalDistrictId(initialDistrictId);
    setFormData({
      username: user.username,
      password: '',
      email: user.email,
      fullName: formatOfficerFullName(user.fullName),
      role: (user.role === 'ROLE_DISTRICT_OFFICER' ? 'ROLE_COMMUNE_OFFICER' : (user.role as AdminRoleType)) || 'ROLE_COMMUNE_OFFICER',
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

  const handleDeleteUser = async (user: AdminUserDto) => {
    if (user.username === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên tối cao (admin)!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản cán bộ '${user.fullName}' (@${user.username})? Thao tác không thể hoàn tác.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(user.id);
      setActionSuccess(`Đã xóa tài khoản cán bộ ${user.fullName} thành công.`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'ALL') {
      if (selectedRole === 'ROLE_COMMUNE_OFFICER') {
        if (u.role !== 'ROLE_COMMUNE_OFFICER' && u.role !== 'ROLE_DISTRICT_OFFICER') return false;
      } else if (selectedRole === 'ROLE_SUPER_ADMIN') {
        if (u.role !== 'ROLE_SUPER_ADMIN' && u.role !== 'ROLE_ADMIN') return false;
      } else if (u.role !== selectedRole) {
        return false;
      }
    }
    if (selectedUnitFilter !== 'ALL') {
      const filterId = Number(selectedUnitFilter);
      if (!u.adminUnitId) return false;
      if (u.adminUnitId !== filterId) {
        // Nếu lọc theo Quận/Huyện (Cấp 2), bao gồm cả cán bộ thuộc Phường/Xã (Cấp 3) trực thuộc Quận/Huyện đó
        const userUnit = adminUnits.find((unit) => unit.id === u.adminUnitId);
        if (!userUnit || userUnit.parentId !== filterId) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quản lý Tài khoản Cán bộ & Phân cấp Quản trị</h1>
              <p className="text-sm text-gray-500">
                Phân quyền 3 cấp tài khoản Hải Phòng (Quản trị hệ thống, Sở KH&CN, UBND Xã/Phường) & Gán địa bàn phụ trách
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-sm border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Thêm Cán bộ Mới
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm flex items-center gap-3 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-sm border border-gray-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đăng nhập, họ tên cán bộ, email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">-- Tất cả vai trò (3 cấp) --</option>
            <option value="ROLE_SUPER_ADMIN">Quản trị hệ thống (Admin)</option>
            <option value="ROLE_SOTTTT_ADMIN">Cán bộ Sở KH&CN</option>
            <option value="ROLE_COMMUNE_OFFICER">Cán bộ UBND Xã / Phường</option>
          </select>
        </div>

        <div>
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">-- Tất cả địa bàn --</option>
            {cityUnits.length > 0 && (
              <optgroup label="Thành phố">
                {cityUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </optgroup>
            )}
            {districtUnits.length > 0 && (
              <optgroup label="Quận / Huyện">
                {districtUnits.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            )}
            {wardUnits.length > 0 && (
              <optgroup label="Phường / Xã / Thị trấn">
                {wardUnits.map((w) => {
                  const pName = w.parentName || districtUnits.find((d) => d.id === w.parentId)?.name;
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name}{pName ? ` — ${pName}` : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Cán bộ / Tên đăng nhập</th>
                <th className="py-3 px-4">Vai trò chính quyền</th>
                <th className="py-3 px-4">Địa bàn phụ trách</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-center">Trạng thái khóa</th>
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
                        <div className="font-semibold text-gray-900">{formatOfficerFullName(user.fullName)}</div>
                        <div className="text-xs text-gray-500 font-mono">@{user.username}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium border ${roleConfig.color}`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const unitInfo = resolveUserUnitDisplay(user);
                          if (unitInfo) {
                            return (
                              <div className="flex items-start gap-2 text-gray-800">
                                <Building className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium text-gray-900">{unitInfo.title}</div>
                                  <div className="text-[11px] text-blue-600 font-medium">{unitInfo.subtitle}</div>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 text-gray-500 text-xs">
                              <Building className="w-3.5 h-3.5 text-gray-400" />
                              Toàn thành phố Hải Phòng
                            </span>
                          );
                        })()}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && user.locked && (
                            <button
                              onClick={() => handleUnlockUser(user)}
                              title="Mở khóa tài khoản cán bộ"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-sm transition-colors border border-amber-200 cursor-pointer"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(user)}
                                title="Sửa thông tin cán bộ"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                title={user.enabled ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                                  user.enabled ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {user.enabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                          {canDelete && user.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Xóa tài khoản cán bộ"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[11px] text-gray-400 italic">Chỉ xem</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 15, 20]}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          itemLabel="cán bộ"
        />
      </div>

      {/* Modal Create / Edit User (Portaled to document.body to guarantee full-screen overlay & scrollable body) */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-sm shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-gray-900 text-base">
                  {editingUser ? `Cập nhật Cán bộ: ${editingUser.fullName}` : 'Thêm mới Cán bộ Quản trị'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
                  <div className={!editingUser ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5' : ''}>
                    {!editingUser && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Tên đăng nhập *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="vd: canbo_hongbang"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="vd: Nguyễn Văn A"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="canbo@haiphong.gov.vn"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="0901234567"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Vai trò hệ thống *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRoleType })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ROLE_SUPER_ADMIN">Quản trị hệ thống (Admin)</option>
                      <option value="ROLE_SOTTTT_ADMIN">Cán bộ Sở KH&CN Hải Phòng</option>
                      <option value="ROLE_COMMUNE_OFFICER">Cán bộ UBND Xã / Phường</option>
                    </select>
                  </div>

                  <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-sm border border-gray-200/80">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase">
                        Gán Địa bàn Quản lý (Quận / Huyện / Phường / Xã)
                      </label>
                      <span className="text-[11px] font-medium text-blue-600 shrink-0">
                        {formData.adminUnitId
                          ? (() => {
                              const u = adminUnits.find((item) => String(item.id) === String(formData.adminUnitId));
                              if (!u || u.level === 1) return 'Phạm vi: Toàn thành phố';
                              return u.level === 2 ? 'Phạm vi: Quận / Huyện' : 'Phạm vi: Phường / Xã';
                            })()
                          : 'Phạm vi: Toàn thành phố'}
                      </span>
                    </div>

                    {/* Chọn Toàn Thành phố hoặc Quận / Huyện */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">
                        Quận / Huyện
                      </label>
                      <select
                        value={modalDistrictId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModalDistrictId(val);
                          if (!val) {
                            setFormData({ ...formData, adminUnitId: '' });
                          } else if (val.startsWith('CITY_')) {
                            const cityId = Number(val.replace('CITY_', ''));
                            setFormData({ ...formData, adminUnitId: cityId });
                          } else {
                            setFormData({ ...formData, adminUnitId: Number(val) });
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Toàn thành phố (Không giới hạn địa bàn) --</option>
                        {cityUnits.length > 0 && (
                          <optgroup label="Thành phố">
                            {cityUnits.map((c) => (
                              <option key={`city-${c.id}`} value={`CITY_${c.id}`}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label={`Quận / Huyện (${districtUnits.length} đơn vị)`}>
                          {districtUnits.map((d) => (
                            <option key={d.id} value={String(d.id)}>
                              {d.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Chọn Phường / Xã / Thị trấn trực thuộc Quận/Huyện đã chọn */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">
                        Phường / Xã / Thị trấn trực thuộc
                      </label>
                      <select
                        value={
                          adminUnits.find((u) => String(u.id) === String(formData.adminUnitId))?.level === 3
                            ? String(formData.adminUnitId)
                            : ''
                        }
                        onChange={(e) => {
                          const wardId = e.target.value;
                          if (wardId) {
                            const ward = wardUnits.find((w) => String(w.id) === wardId);
                            if (ward && ward.parentId) {
                              setModalDistrictId(String(ward.parentId));
                            }
                            setFormData({ ...formData, adminUnitId: Number(wardId) });
                          } else {
                            if (modalDistrictId && !modalDistrictId.startsWith('CITY_')) {
                              setFormData({ ...formData, adminUnitId: Number(modalDistrictId) });
                            } else if (modalDistrictId.startsWith('CITY_')) {
                              setFormData({ ...formData, adminUnitId: Number(modalDistrictId.replace('CITY_', '')) });
                            } else {
                              setFormData({ ...formData, adminUnitId: '' });
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          {modalDistrictId && !modalDistrictId.startsWith('CITY_')
                            ? `-- Quản lý toàn bộ ${districtUnits.find((d) => String(d.id) === modalDistrictId)?.name || 'Quận/Huyện'} --`
                            : '-- Không giới hạn ở Phường/Xã (Chọn nếu là Cán bộ Phường/Xã) --'}
                        </option>
                        {(modalDistrictId && !modalDistrictId.startsWith('CITY_')
                          ? wardUnits.filter((w) => String(w.parentId) === modalDistrictId)
                          : wardUnits
                        ).map((w) => {
                          const parentName = w.parentName || districtUnits.find((d) => d.id === w.parentId)?.name;
                          return (
                            <option key={w.id} value={String(w.id)}>
                              {w.name}{parentName ? ` — ${parentName}` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formData.role === 'ROLE_DISTRICT_OFFICER'
                          ? 'Gợi ý: Cán bộ Quận/Huyện chọn Quận/Huyện để quản lý toàn bộ các Phường/Xã trực thuộc.'
                          : formData.role === 'ROLE_COMMUNE_OFFICER'
                          ? 'Gợi ý: Cán bộ Phường/Xã chọn cụ thể Phường/Xã nơi mình phụ trách.'
                          : 'Gợi ý: Để trống nếu cán bộ phụ trách phạm vi toàn thành phố.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200/70 rounded-sm transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm shadow-sm transition-colors cursor-pointer"
                  >
                    {editingUser ? 'Lưu thay đổi' : 'Tạo Cán bộ'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
