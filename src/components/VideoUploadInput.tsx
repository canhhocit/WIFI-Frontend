import React, { useState, useRef } from 'react';
import { 
  Video, 
  UploadCloud, 
  Link as LinkIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Film,
  ExternalLink,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

interface VideoUploadInputProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  category?: string;
}

export const VideoUploadInput: React.FC<VideoUploadInputProps> = ({
  value = '',
  onChange,
  label = 'Video tuyên truyền số',
  helperText = 'Hỗ trợ tải lên video từ máy tính (MP4, WebM, MOV tối đa 100MB) hoặc gắn liên kết YouTube',
  category = 'campaign_videos',
}) => {
  const [mode, setMode] = useState<'UPLOAD' | 'LINK'>('UPLOAD');
  const [linkInput, setLinkInput] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phân tích xem có phải link YouTube không
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?rel=0`;
    }
    if (url.includes('youtube.com/embed')) return url;
    return null;
  };

  const isYouTube = !!getYouTubeEmbedUrl(value);
  const ytEmbedUrl = getYouTubeEmbedUrl(value);

  const handleFileSelect = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      setError('Định dạng tệp không hợp lệ. Vui lòng chọn tệp video (.mp4, .webm, .mov).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(`Kích thước video quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Giới hạn tối đa là 100MB.`);
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    try {
      // Giả lập tiến trình mượt mà
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (!prev || prev >= 90) return prev;
          return prev + 15;
        });
      }, 300);

      const res = await adminApi.uploadImage(file, category);
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        onChange(res.url);
        setLinkInput(res.url);
        setUploading(false);
        setUploadProgress(null);
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải video lên máy chủ. Vui lòng thử lại.');
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleApplyLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) {
      onChange('');
      return;
    }
    onChange(trimmed);
  };

  const handleClear = () => {
    onChange('');
    setLinkInput('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {/* Label and Helper */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-[#004b87]" />
          {label}
        </label>
        {value && (
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đã có video
          </span>
        )}
      </div>

      {helperText && <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>}

      {/* Mode Switcher Buttons */}
      <div className="inline-flex rounded-sm p-0.5 bg-slate-100 border border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setMode('UPLOAD')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xs font-medium transition cursor-pointer ${
            mode === 'UPLOAD' ? 'bg-white text-[#004b87] shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Tải file từ máy</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('LINK')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xs font-medium transition cursor-pointer ${
            mode === 'LINK' ? 'bg-white text-[#004b87] shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Gắn link video (YouTube / MP4)</span>
        </button>
      </div>

      {/* Input Area */}
      {mode === 'UPLOAD' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          className={`relative border-2 border-dashed rounded-md p-4 text-center transition cursor-pointer ${
            isDragOver ? 'border-[#004b87] bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {uploading ? (
            <div className="py-3 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#004b87]" />
              <div className="text-xs font-semibold text-slate-800">
                Đang xử lý tải video lên máy chủ... {uploadProgress ? `${uploadProgress}%` : ''}
              </div>
              <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#004b87] transition-all duration-300"
                  style={{ width: `${uploadProgress || 30}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center space-y-1 text-slate-600">
              <UploadCloud className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-medium text-slate-700">
                Kéo thả file video vào đây hoặc <span className="text-[#004b87] font-bold underline">chọn từ thiết bị</span>
              </p>
              <p className="text-[10px] text-slate-400">Định dạng MP4, WebM, MOV. Dung lượng tối đa 100MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onBlur={handleApplyLink}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyLink())}
            placeholder="Dán liên kết YouTube hoặc URL file video (ví dụ: https://www.youtube.com/watch?v=...)"
            className="flex-1 h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] font-mono text-slate-800 bg-white"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-3.5 h-9 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm text-xs font-semibold text-slate-700 cursor-pointer transition"
          >
            Áp dụng
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Video Preview Box */}
      {value && (
        <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-900 overflow-hidden shadow-sm">
          <div className="p-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs text-slate-200">
            <span className="font-medium truncate max-w-md font-mono text-[11px] text-slate-300">
              {isYouTube ? '📺 YouTube Video' : '🎬 File Video tải lên'}: {value}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 text-[11px] bg-rose-600/80 hover:bg-rose-600 text-white rounded transition flex items-center gap-1 cursor-pointer"
                title="Gỡ video khỏi chiến dịch"
              >
                <Trash2 className="w-3 h-3" />
                <span>Gỡ video</span>
              </button>
            </div>
          </div>

          <div className="aspect-video w-full bg-black flex items-center justify-center">
            {isYouTube && ytEmbedUrl ? (
              <iframe
                src={ytEmbedUrl}
                title="Preview Video Tuyên Truyền"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={value}
                controls
                playsInline
                className="w-full h-full object-contain"
                preload="metadata"
              >
                Trình duyệt không hỗ trợ phát trực tiếp video này.
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
