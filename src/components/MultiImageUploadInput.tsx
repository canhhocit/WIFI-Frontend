import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  Star, 
  Plus, 
  Trash2, 
  AlertCircle,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

interface MultiImageUploadInputProps {
  bannerUrl?: string;
  galleryUrls?: string[];
  onChange: (bannerUrl: string, galleryUrls: string[]) => void;
  label?: string;
  helperText?: string;
  category?: string;
}

// Client-side image optimizer for fast portal delivery
const optimizeImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

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
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const optimized = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.webp',
            { type: 'image/webp', lastModified: Date.now() }
          );
          resolve(optimized);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => resolve(file);
    img.src = url;
  });
};

export const MultiImageUploadInput: React.FC<MultiImageUploadInputProps> = ({
  bannerUrl = '',
  galleryUrls = [],
  onChange,
  label = 'Ảnh Poster chính & Thư viện ảnh chiến dịch',
  helperText = 'Tải lên một hoặc nhiều ảnh từ máy tính (hoặc dán link). Ảnh đầu tiên sẽ là Poster chính đại diện.',
  category = 'campaigns',
}) => {
  // Sync list: make sure bannerUrl is at index 0 if not empty
  const initialList = React.useMemo(() => {
    const list = [...galleryUrls];
    if (bannerUrl && !list.includes(bannerUrl)) {
      list.unshift(bannerUrl);
    } else if (bannerUrl && list.includes(bannerUrl) && list[0] !== bannerUrl) {
      const idx = list.indexOf(bannerUrl);
      list.splice(idx, 1);
      list.unshift(bannerUrl);
    }
    return list;
  }, [bannerUrl, galleryUrls]);

  const [images, setImages] = useState<string[]>(initialList);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkVal, setLinkVal] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cập nhật lên parent khi images thay đổi
  const updateImages = (newList: string[]) => {
    setImages(newList);
    const newBanner = newList.length > 0 ? newList[0] : '';
    onChange(newBanner, newList);
  };

  const handleFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const optimized = await optimizeImage(file);
        const res = await adminApi.uploadImage(optimized, category);
        uploadedUrls.push(res.url);
      }

      if (uploadedUrls.length > 0) {
        updateImages([...images, ...uploadedUrls]);
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi tải ảnh lên máy chủ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    const trimmed = linkVal.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setError('Đường dẫn ảnh phải bắt đầu bằng http://, https:// hoặc /');
      return;
    }
    setError(null);
    updateImages([...images, trimmed]);
    setLinkVal('');
    setShowLinkInput(false);
  };

  const handleSetPrimaryPoster = (index: number) => {
    if (index === 0 || index >= images.length) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    const reordered = [item, ...rest];
    updateImages(reordered);
  };

  const handleRemoveImage = (index: number) => {
    const filtered = images.filter((_, i) => i !== index);
    updateImages(filtered);
  };

  return (
    <div className="space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#004b87]" />
            {label}
            {images.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {images.length} ảnh
              </span>
            )}
          </label>
          {helperText && <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>Tải thêm ảnh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Thêm bằng Link</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFilesSelect(e.target.files)}
        className="hidden"
      />

      {/* Link Input Row */}
      {showLinkInput && (
        <div className="flex gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md animate-in fade-in">
          <input
            type="text"
            value={linkVal}
            onChange={(e) => setLinkVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
            placeholder="Dán đường dẫn ảnh (ví dụ: https://images.unsplash.com/...)"
            className="flex-1 h-8 px-2.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] bg-white font-mono"
          />
          <button
            type="button"
            onClick={handleAddLink}
            className="px-3 h-8 bg-[#004b87] hover:bg-[#003865] text-white text-xs font-semibold rounded-sm transition cursor-pointer"
          >
            Thêm
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2 h-8 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop Zone when Empty */}
      {images.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) handleFilesSelect(e.dataTransfer.files);
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
            isDragOver ? 'border-[#004b87] bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#004b87]" />
              <p className="text-xs font-semibold text-slate-700">Đang tối ưu & tải ảnh lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 text-slate-600 py-3">
              <UploadCloud className="w-10 h-10 text-slate-400" />
              <p className="text-xs font-semibold text-slate-800">
                Kéo thả các hình ảnh vào đây hoặc <span className="text-[#004b87] underline">chọn từ thiết bị</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Hỗ trợ tải lên nhiều ảnh (JPG, PNG, WebP). Tự động tối ưu dung lượng cho Cổng chào.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Images Grid / Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imgUrl, idx) => {
              const isPrimary = idx === 0;

              return (
                <div
                  key={`${imgUrl}-${idx}`}
                  className={`group relative rounded-lg overflow-hidden border-2 transition-all shadow-xs bg-slate-900 ${
                    isPrimary
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* Poster Primary Badge */}
                  {isPrimary ? (
                    <div className="absolute top-1.5 left-1.5 z-10 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase tracking-wide">
                      <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                      <span>Poster chính</span>
                    </div>
                  ) : (
                    <div className="absolute top-1.5 left-1.5 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 z-10 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition shadow-xs cursor-pointer opacity-80 group-hover:opacity-100"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Image Aspect Box */}
                  <div className="aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={imgUrl}
                      alt={`Ảnh chiến dịch ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                      }}
                    />
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="p-1.5 bg-slate-900/90 text-white flex items-center justify-between text-[10.5px]">
                    {isPrimary ? (
                      <span className="text-amber-300 font-semibold text-[10px]">Ảnh hiển thị đầu</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryPoster(idx)}
                        className="text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                        title="Đưa ảnh này lên làm Poster chính của chiến dịch"
                      >
                        <Star className="w-3 h-3" />
                        <span>Đặt làm Poster</span>
                      </button>
                    )}
                    <span className="text-slate-400 font-mono text-[9.5px] truncate max-w-[90px]">
                      {imgUrl.slice(-15)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#004b87] rounded-lg aspect-video flex flex-col items-center justify-center text-slate-500 hover:text-[#004b87] bg-slate-50 hover:bg-blue-50/40 transition cursor-pointer p-2"
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-[11px] font-semibold">Thêm ảnh khác</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
