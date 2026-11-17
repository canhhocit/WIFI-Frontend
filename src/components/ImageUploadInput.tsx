import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { adminApi } from '../api/adminApi';

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  category?: string;
  placeholder?: string;
  aspectRatio?: '16:9' | '1:1' | 'free';
}

interface ImageMeta {
  width: number;
  height: number;
  sizeKb: number;
  optimized: boolean;
}

// Client-side smart optimizer for captive portal banners
const optimizeImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<{ file: File; width: number; height: number; sizeKb: number; wasCompressed: boolean }> => {
  return new Promise((resolve) => {
    // If not an image or is SVG / GIF, keep original
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      resolve({ file, width: 0, height: 0, sizeKb: Math.round(file.size / 1024), wasCompressed: false });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down if larger than max boundaries
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ file, width, height, sizeKb: Math.round(file.size / 1024), wasCompressed: false });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve({ file, width, height, sizeKb: Math.round(file.size / 1024), wasCompressed: false });
            return;
          }

          const optimizedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.webp',
            { type: 'image/webp', lastModified: Date.now() }
          );

          resolve({
            file: optimizedFile,
            width,
            height,
            sizeKb: Math.round(optimizedFile.size / 1024),
            wasCompressed: true,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      resolve({ file, width: 0, height: 0, sizeKb: Math.round(file.size / 1024), wasCompressed: false });
    };

    img.src = url;
  });
};

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  label = 'Hình ảnh',
  helperText = 'Tải lên từ máy tính hoặc dán liên kết URL ảnh',
  category = 'banners',
  placeholder = 'Nhập link ảnh (ví dụ: /banners/haiphong_culture_house.jpg hoặc https://...)',
  aspectRatio = '16:9',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewError(false);
  }, [value, localPreview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check raw size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('Kích thước ảnh vượt quá giới hạn 15MB. Vui lòng chọn ảnh nhỏ hơn.');
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

    // Optimize on client-side before sending
    setUploading(true);
    try {
      const optimized = await optimizeImage(file);
      setImageMeta({
        width: optimized.width,
        height: optimized.height,
        sizeKb: optimized.sizeKb,
        optimized: optimized.wasCompressed,
      });

      const res = await adminApi.uploadImage(optimized.file, category);
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
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentDisplayUrl = localPreview || value;

  return (
    <div className="space-y-2">
      {/* Label & Tabs Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
          {aspectRatio === '16:9' && (
            <span className="text-[10px] font-normal px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
              Chuẩn 16:9
            </span>
          )}
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
                <span>Đang tối ưu & tải ảnh lên máy chủ...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#004b87]" />
                <div className="text-xs font-semibold text-slate-700">
                  Bấm để chọn tệp ảnh từ máy tính
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Tự động tối ưu WebP, tỷ lệ 16:9 & nén nhẹ cho Wi-Fi công cộng</span>
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
        <div className="mt-2 p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="font-semibold flex items-center gap-1.5 text-[#004b87]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xem trước ảnh hiển thị:</span>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-[10.5px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Xóa ảnh
            </button>
          </div>

          <div className="relative rounded overflow-hidden bg-slate-900 border border-slate-200 max-h-48 flex items-center justify-center">
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
                className="w-full h-40 object-cover"
              />
            )}
          </div>

          {/* Metadata & Status */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-0.5">
            <div className="font-mono truncate max-w-xs text-slate-600" title={value || ''}>
              URL: {value || '(Ảnh đang tải lên từ máy)'}
            </div>
            {imageMeta && imageMeta.width > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                <span>{imageMeta.width}x{imageMeta.height}px</span>
                <span>•</span>
                <span>{imageMeta.sizeKb} KB</span>
                {imageMeta.optimized && <span className="font-sans font-semibold">(Đã nén tối ưu)</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {helperText && !currentDisplayUrl && (
        <p className="text-[10.5px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

