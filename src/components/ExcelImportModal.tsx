import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, ArrowRight, Loader2, Check } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ExcelImportSummaryDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [summary, setSummary] = useState<ExcelImportSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [committedCount, setCommittedCount] = useState<number>(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp Excel (.xlsx)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.validateLocationsExcel(file);
      setSummary(res);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Lỗi kiểm tra tính hợp lệ của tệp');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!summary?.importSessionId) return;
    setCommitting(true);
    setError(null);
    try {
      const count = await adminApi.commitLocationsExcel(summary.importSessionId);
      setCommittedCount(count);
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Lỗi lưu dữ liệu vào hệ thống');
    } finally {
      setCommitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setError(null);
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#004b87]" />
              Nhập danh sách 1.584 Điểm phát sóng từ Excel (Screens C08 - C09)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kiểm tra 5 tiêu chí: Trùng mã, Thiếu trường, Địa bàn hợp lệ, Geo-fence Hải Phòng, Chuẩn MAC
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-sm flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900">1. Tải về file mẫu Excel chuẩn</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Mẫu Excel gồm 13 cột bắt buộc với các dữ liệu mẫu của Hồng Bàng, Ngô Quyền, Cát Bà.
                  </p>
                </div>
                <a
                  href={adminApi.getExcelTemplateUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Mẫu Excel (.xlsx)
                </a>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">2. Tải lên file đã điền dữ liệu</h4>
                <div className="border-2 border-dashed border-slate-300 hover:border-[#004b87] rounded p-6 text-center transition-colors">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    id="excelFileInput"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="excelFileInput" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-700 block">
                      {file ? file.name : 'Bấm vào đây để chọn tệp Excel hoặc kéo thả tệp vào đây'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Hỗ trợ định dạng .xlsx (Tối đa 1.584 dòng)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && summary && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 border rounded-lg">
                  <div className="text-xs text-gray-500 font-medium">Tổng số dòng</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{summary.totalRows}</div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ (Sẵn sàng lưu)
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.validRows}</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Dòng lỗi
                  </div>
                  <div className="text-2xl font-bold text-red-700 mt-1">{summary.errorRows}</div>
                </div>
              </div>

              {/* Error action banner */}
              {summary.errorRows > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="text-xs text-amber-800">
                    Phát hiện <strong>{summary.errorRows} dòng có lỗi</strong> (Ngoài ranh giới Hải Phòng, trùng MAC hoặc thiếu mã địa bàn).
                  </div>
                  <a
                    href={adminApi.getExcelErrorsUrl(summary.importSessionId)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải Danh Sách Lỗi
                  </a>
                </div>
              )}

              {/* Table Preview */}
              <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 sticky top-0 text-gray-700">
                    <tr>
                      <th className="p-2.5">Dòng</th>
                      <th className="p-2.5">Mã điểm</th>
                      <th className="p-2.5">Tên nhà văn hóa</th>
                      <th className="p-2.5">Trạng thái</th>
                      <th className="p-2.5">Ghi chú kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {summary.rowResults.map((row, idx) => (
                      <tr key={idx} className={row.valid ? 'bg-white' : 'bg-red-50/50'}>
                        <td className="p-2.5 font-mono text-gray-500">{row.rowNumber}</td>
                        <td className="p-2.5 font-medium">{row.code || '—'}</td>
                        <td className="p-2.5">{row.name || '—'}</td>
                        <td className="p-2.5">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="w-3 h-3" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                              <AlertTriangle className="w-3 h-3" /> Lỗi
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-red-600">
                          {row.errors.length > 0 ? row.errors.join('; ') : 'Đạt 5 tiêu chí'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Nhập danh sách điểm thành công!</h4>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Hệ thống đã lưu thành công <strong>{committedCount} điểm phát sóng</strong> vào cơ sở dữ liệu cùng với cấu hình thiết bị trạm Router và AP tương ứng.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleValidate}
                disabled={!file || loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Kiểm tra tính hợp lệ (Validate)
              </button>
            </>
          )}

          {step === 2 && summary && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100"
              >
                Chọn lại file
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={summary.validRows === 0 || committing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Xác nhận lưu {summary.validRows} dòng hợp lệ vào CSDL
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm"
            >
              Hoàn tất & Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

