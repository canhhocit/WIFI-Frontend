import React, { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { NetworkDeviceImportResultDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

/**
 * Import danh sách thiết bị bàn giao (MAC + S/N + mã điểm...) cho hàng nghìn mesh AP, không nhập tay.
 * Bước 1 kiểm tra (không ghi), bước 2 nhập chính thức.
 */
export const NetworkDeviceImportModal: React.FC<Props> = ({ isOpen, onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<NetworkDeviceImportResultDto | null>(null);
  const [busy, setBusy] = useState<'check' | 'import' | 'template' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? 'check' : 'import');
    setError(null);
    try {
      const r = await adminApi.importNetworkDevices(file, dryRun);
      setResult(r);
      if (!dryRun) onImported();
    } catch (e: any) {
      setError(e?.message || 'Không import được file.');
    } finally {
      setBusy(null);
    }
  };

  const downloadTemplate = async () => {
    setBusy('template');
    try {
      await adminApi.downloadNetworkDeviceTemplate();
    } catch (e: any) {
      setError(e?.message || 'Không tải được file mẫu.');
    } finally {
      setBusy(null);
    }
  };

  const ok = result ? result.created + result.updated : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-md max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import danh sách thiết bị bàn giao</h3>
              <p className="text-xs text-slate-500">MAC + số serial (S/N) + mã điểm lắp đặt — file Excel hoặc CSV</p>
            </div>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded text-sky-900 space-y-1">
            <div>
              Cột bắt buộc: <b>MAC</b>, <b>Serial (S/N)</b>. Thiết bị mới cần thêm <b>Mã điểm</b>. Tùy chọn: Loại thiết bị, Model, Hãng, IP quản trị.
            </div>
            <div>
              S/N là mật khẩu gốc của mesh: hệ thống dùng cho lần kết nối đầu, sau đó tự đổi sang mật khẩu quản lý chung.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadTemplate}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm font-semibold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              {busy === 'template' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Tải file mẫu
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm font-semibold text-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              {file ? file.name : 'Chọn file (.xlsx, .xls, .csv)'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                  setError(null);
                }}
              />
            </label>
          </div>

          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800">{error}</div>}

          {result && (
            <div className="space-y-3">
              <div
                className={`p-3 rounded border flex items-start gap-2 ${
                  result.errors.length ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {result.errors.length ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                <div>
                  <div className="font-bold">
                    {result.dryRun ? 'Kết quả kiểm tra (chưa ghi)' : 'Đã import xong'}: {result.totalRows} dòng
                  </div>
                  <div>
                    Thêm mới <b>{result.created}</b> · Cập nhật <b>{result.updated}</b> · Không đổi <b>{result.unchanged}</b> · Lỗi{' '}
                    <b>{result.errors.length}</b>
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="border border-slate-200 rounded-sm max-h-56 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-16">Dòng</th>
                        <th className="py-2 px-3 font-mono">MAC</th>
                        <th className="py-2 px-3">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-3">{e.row}</td>
                          <td className="py-1.5 px-3 font-mono">{e.mac || '—'}</td>
                          <td className="py-1.5 px-3 text-rose-700">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <button
            onClick={close}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm text-slate-700 font-semibold cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={() => run(true)}
            disabled={!file || busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border border-sky-300 text-sky-800 hover:bg-sky-50 rounded-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {busy === 'check' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Kiểm tra
          </button>
          <button
            onClick={() => run(false)}
            disabled={!file || busy !== null || !result || !result.dryRun || ok === 0}
            title={!result?.dryRun ? 'Kiểm tra file trước khi import' : undefined}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {busy === 'import' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Import {ok > 0 ? `${ok} thiết bị` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
