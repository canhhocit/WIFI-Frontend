import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminApi } from '../api/adminApi';

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  category?: string;
  placeholder?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  label = 'Hình ảnh',
  helperText = 'Tải lên từ máy tính hoặc dán liên kết URL ảnh',
  category = 'banners',
  placeholder = 'Nhập link ảnh (ví dụ: /banners/haiphong_culture_house.jpg hoặc https://...)',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewError(false);
  }, [value, localPreview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước ảnh vượt quá giới hạn 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Tệp đã chọn không phải định dạng hình ảnh hợp lệ.');
      return;
    }

    setError(null);
    setPreviewError(false);

    // Instant local preview
    const tempUrl = URL.createObjectURL(file);
    setLocalPreview(tempUrl);

    // Upload to server
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, category);
      onChange(res.url);
      setLocalPreview(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải ảnh lên máy chủ. Bạn có thể chuyển sang nhập liên kết URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setLocalPreview(null);
    setError(null);
    setPreviewError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentDisplayUrl = localPreview || value;

  return (
    <div className="space-y-2">
      {/* Label & Tabs Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        <div className="inline-flex rounded-sm bg-slate-100 p-0.5 border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              mode === 'upload'
                ? 'bg-white text-[#004b87] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Tải từ máy</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              mode === 'url'
                ? 'bg-white text-[#004b87] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Điền Link</span>
          </button>
        </div>
      </div>

      {/* Input Section based on mode */}
      {mode === 'upload' ? (
        <div className="space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded p-3 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              uploading
                ? 'bg-slate-50 border-slate-300 cursor-not-allowed'
                : 'bg-slate-50/70 hover:bg-slate-100 border-slate-300 hover:border-[#004b87]'
            }`}
          >
            {uploading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-[#004b87] font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải ảnh lên máy chủ...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#004b87]" />
                <div className="text-xs font-semibold text-slate-700">
                  Bấm để chọn tệp ảnh từ máy tính
                </div>
                <div className="text-[10px] text-slate-400">
                  Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 10MB)
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setLocalPreview(null);
              }}
              placeholder={placeholder}
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] font-sans"
            />
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Xóa đường dẫn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Live Preview Box (Khung xem trước trước khi cập nhật) */}
      {currentDisplayUrl && (
        <div className="mt-2 p-2 bg-slate-900/5 rounded border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="font-semibold flex items-center gap-1 text-[#004b87]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Xem trước hình ảnh:</span>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-[10.5px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Xóa ảnh này
            </button>
          </div>

          <div className="relative rounded overflow-hidden bg-slate-900 border border-slate-200 max-h-44 flex items-center justify-center">
            {previewError ? (
              <div className="p-6 text-center text-rose-300 text-xs space-y-1">
                <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
                <div>Không thể tải hình ảnh từ liên kết này</div>
                <div className="text-[10px] text-slate-400">Vui lòng kiểm tra lại URL hoặc chọn tải ảnh từ máy tính</div>
              </div>
            ) : (
              <img
                src={currentDisplayUrl}
                alt="Xem trước hình ảnh"
                onError={() => setPreviewError(true)}
                className="w-full h-36 object-cover"
              />
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-mono truncate">
            Đường dẫn: {value || '(Ảnh đang tải lên từ máy)'}
          </div>
        </div>
      )}

      {helperText && !currentDisplayUrl && (
        <p className="text-[10.5px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
