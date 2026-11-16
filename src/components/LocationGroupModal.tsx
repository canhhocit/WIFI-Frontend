import React, { useState } from 'react';
import { Tag, Plus, Trash2, X, Check, Loader2, Sparkles } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { LocationGroupDto, CreateLocationGroupRequest } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groups: LocationGroupDto[];
  onRefresh: () => void;
}

export const LocationGroupModal: React.FC<Props> = ({ isOpen, onClose, groups, onRefresh }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Vui lòng nhập đầy đủ tên và mã nhóm.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: CreateLocationGroupRequest = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        color,
      };
      await adminApi.createLocationGroup(payload);
      setName('');
      setCode('');
      setDescription('');
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tạo nhóm điểm tùy biến');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm điểm tùy biến này?')) return;
    try {
      await adminApi.deleteLocationGroup(id);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa nhóm điểm');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-md max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Quản Lý Nhóm Điểm Tùy Biến</h3>
              <p className="text-xs text-slate-500">Phân loại điểm ngoài địa giới hành chính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          {/* Form tạo mới */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Tạo Nhóm Điểm Mới
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Hủy
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tên nhóm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nhóm Điểm Ven Biển Đảo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-sky-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mã nhóm (Viết hoa, không dấu) *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: ISLAND_COASTAL"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-sky-500 text-xs uppercase font-mono"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-700 font-semibold mb-1">Mô tả mục đích nhóm</label>
                <input
                  type="text"
                  placeholder="Áp dụng chính sách truyền thông / banner riêng cho khu vực này"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-sky-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-700 font-semibold">Màu hiển thị:</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#004b87] hover:bg-[#003b6b] text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu Nhóm
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Danh sách các nhóm tùy biến đang áp dụng trên hệ thống</span>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004b87] hover:bg-[#003b6b] text-white rounded text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Nhóm Mới
              </button>
            </div>
          )}

          {/* Danh sách các nhóm */}
          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có nhóm tùy biến nào. Bấm nút "Tạo Nhóm Mới" để bắt đầu.
              </div>
            ) : (
              groups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded hover:border-sky-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: g.color || '#0284c7' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{g.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {g.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {g.description || 'Chưa có mô tả'} · <strong className="text-sky-700">{g.locationCount}</strong> điểm NVH đã gán
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition rounded"
                    title="Xóa nhóm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-semibold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
