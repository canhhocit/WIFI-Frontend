import React, { useState, useMemo } from 'react';
import { GitMerge, ArrowRight, AlertTriangle, CheckCircle, Loader2, X, Building2, MapPin, Check } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { AdminUnitDto, LocationDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  districts: AdminUnitDto[];
  adminUnits: AdminUnitDto[];
  locations: LocationDto[];
}

export const MergeAdminUnitsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  districts,
  adminUnits,
  locations,
}) => {
  const [unitTypeFilter, setUnitTypeFilter] = useState<'ALL' | 'PHUONG' | 'XA' | 'DAC_KHU'>('ALL');
  const [sourceUnitIds, setSourceUnitIds] = useState<number[]>([]);
  const [targetUnitId, setTargetUnitId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map locations count per adminUnitId
  const locationCountMap = useMemo(() => {
    const map = new Map<number, number>();
    locations.forEach((loc) => {
      if (loc.adminUnitId) {
        map.set(loc.adminUnitId, (map.get(loc.adminUnitId) || 0) + 1);
      }
    });
    return map;
  }, [locations]);

  // All active Phường / Xã / Đặc khu (2-tier post-merger)
  const availableCommunes = useMemo(() => {
    const pool = adminUnits.length > 0 ? adminUnits : districts;
    return pool.filter((u) => {
      if (u.status === 'MERGED') return false;
      if (unitTypeFilter === 'PHUONG') return u.name.startsWith('Phường');
      if (unitTypeFilter === 'XA') return u.name.startsWith('Xã');
      if (unitTypeFilter === 'DAC_KHU') return u.name.startsWith('Đặc khu');
      return true;
    });
  }, [adminUnits, districts, unitTypeFilter]);

  // Total locations that will be transferred
  const totalLocationsToMove = useMemo(() => {
    return sourceUnitIds.reduce((sum, id) => sum + (locationCountMap.get(id) || 0), 0);
  }, [sourceUnitIds, locationCountMap]);

  if (!isOpen) return null;

  const handleToggleSource = (id: number) => {
    if (sourceUnitIds.includes(id)) {
      setSourceUnitIds(sourceUnitIds.filter((item) => item !== id));
    } else {
      if (targetUnitId === id) {
        setTargetUnitId(null);
      }
      setSourceUnitIds([...sourceUnitIds, id]);
    }
  };

  const handleSelectTarget = (id: number) => {
    if (sourceUnitIds.includes(id)) {
      setSourceUnitIds(sourceUnitIds.filter((item) => item !== id));
    }
    setTargetUnitId(id);
  };

  const handleReset = () => {
    setSourceUnitIds([]);
    setTargetUnitId(null);
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceUnitIds.length === 0) {
      setError('Vui lòng chọn ít nhất 01 đơn vị hành chính nguồn cần sáp nhập.');
      return;
    }
    if (!targetUnitId) {
      setError('Vui lòng chọn đơn vị hành chính đích tiếp nhận sáp nhập.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminApi.mergeAdminUnits({
        sourceUnitIds,
        targetUnitId,
        notes: notes.trim() || undefined,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra trong quá trình sáp nhập đơn vị hành chính.');
    } finally {
      setLoading(false);
    }
  };

  const targetUnit = adminUnits.find((u) => u.id === targetUnitId);
  const sourceUnits = adminUnits.filter((u) => sourceUnitIds.includes(u.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-indigo-200 border border-white/15">
              <GitMerge className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Sáp Nhập Đơn Vị Hành Chính & Dời Điểm Wi-Fi</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Cập nhật cây địa bàn hành chính TP Hải Phòng và tự động điều chuyển toàn bộ Nhà văn hóa
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {/* Unit Type Filter */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Building2 className="w-4 h-4 text-indigo-700" />
              <span>Lọc loại đơn vị cơ sở:</span>
            </div>
            <select
              value={unitTypeFilter}
              onChange={(e) => {
                setUnitTypeFilter(e.target.value as 'ALL' | 'PHUONG' | 'XA' | 'DAC_KHU');
                setSourceUnitIds([]);
                setTargetUnitId(null);
              }}
              className="text-xs bg-white border border-slate-300 rounded px-3 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">-- Tất cả Phường / Xã / Đặc khu TP Hải Phòng --</option>
              <option value="PHUONG">Phường</option>
              <option value="XA">Xã</option>
              <option value="DAC_KHU">Đặc khu</option>
            </select>
          </div>

          {/* Two Columns: Source Units & Target Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Source Units */}
            <div className="border border-slate-200 rounded-md p-3.5 bg-white flex flex-col h-[280px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  1. Chọn Đơn vị Nguồn (bị sáp nhập)
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Đã chọn: {sourceUnitIds.length}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Đánh dấu các Xã / Phường cần sáp nhập. Toàn bộ điểm Wi-Fi sẽ được chuyển đi.
              </p>
              <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 custom-scrollbar">
                {availableCommunes.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8">Không có đơn vị hành chính nào</div>
                ) : (
                  availableCommunes.map((unit) => {
                    const isSelected = sourceUnitIds.includes(unit.id);
                    const isTarget = targetUnitId === unit.id;
                    const locCount = locationCountMap.get(unit.id) || 0;

                    return (
                      <div
                        key={unit.id}
                        onClick={() => !isTarget && handleToggleSource(unit.id)}
                        className={`flex items-center justify-between p-2 rounded text-xs transition cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                            : isTarget
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isTarget}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="truncate">{unit.name}</span>
                          <span className="text-[10px] text-slate-400">({unit.code})</span>
                        </div>
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {locCount} điểm
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Target Unit */}
            <div className="border border-slate-200 rounded-md p-3.5 bg-white flex flex-col h-[280px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  2. Chọn Đơn vị Đích (tiếp nhận)
                </div>
                {targetUnitId && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đã chọn
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Chọn Xã / Phường duy nhất sẽ tiếp nhận dữ liệu và các điểm Wi-Fi NVH.
              </p>
              <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 custom-scrollbar">
                {availableCommunes.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8">Không có đơn vị hành chính nào</div>
                ) : (
                  availableCommunes.map((unit) => {
                    const isSelected = targetUnitId === unit.id;
                    const isSource = sourceUnitIds.includes(unit.id);
                    const locCount = locationCountMap.get(unit.id) || 0;

                    return (
                      <div
                        key={unit.id}
                        onClick={() => !isSource && handleSelectTarget(unit.id)}
                        className={`flex items-center justify-between p-2 rounded text-xs transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                            : isSource
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="radio"
                            name="target_unit"
                            checked={isSelected}
                            disabled={isSource}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="truncate">{unit.name}</span>
                          <span className="text-[10px] text-slate-400">({unit.code})</span>
                        </div>
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          Hiện có: {locCount}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Legal Decision / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Căn cứ pháp lý / Ghi chú sáp nhập (Lưu vết lịch sử hệ thống):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Theo Nghị quyết số 1232/NQ-UBTVQH15 về sắp xếp đơn vị hành chính cấp xã TP Hải Phòng"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Merge Impact Summary Banner */}
          {sourceUnits.length > 0 && targetUnit && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-md text-xs space-y-1.5">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                Xác nhận tác động điều chuyển:
              </div>
              <div className="text-indigo-900 flex flex-wrap items-center gap-2">
                <span>Sáp nhập {sourceUnits.length} đơn vị:</span>
                <span className="font-semibold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                  {sourceUnits.map((u) => u.name).join(', ')}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                <span>chuyển vào</span>
                <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  {targetUnit.name}
                </span>
              </div>
              <p className="text-[11px] text-indigo-700">
                👉 Tổng cộng <strong>{totalLocationsToMove} điểm phát Wi-Fi Nhà văn hóa</strong> sẽ được tự động đổi sang đơn vị hành chính mới. Trạng thái các xã cũ sẽ chuyển thành <code>MERGED</code>.
              </p>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading || sourceUnitIds.length === 0 || !targetUnitId}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded shadow-xs transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý sáp nhập...
                </>
              ) : (
                <>
                  <GitMerge className="w-3.5 h-3.5" /> Thực Hiện Sáp Nhập
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

