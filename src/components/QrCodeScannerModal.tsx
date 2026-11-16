import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  title?: string;
}

export const QrCodeScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Quét Mã Vạch / QR Code Thiết Bị'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Cannot open camera:', err);
      setCameraError('Không thể mở camera thiết bị hoặc quyền truy cập camera bị từ chối.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Camera Viewport */}
        <div className="relative bg-black flex items-center justify-center min-h-[260px] overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="text-xs text-amber-200 font-semibold">{cameraError}</div>
              <p className="text-[11px] text-slate-400">
                Bạn có thể nhập trực tiếp số Serial hoặc MAC Address từ tem lưng thiết bị phía dưới:
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Overlay Scanner Frame */}
              <div className="absolute inset-0 border-2 border-sky-400/50 m-12 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-sky-400"></div>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-sky-400"></div>
                </div>
                <div className="text-center">
                  <span className="bg-black/60 px-2 py-0.5 rounded text-[10px] text-sky-300 font-mono">
                    Căn chỉnh tem mã QR / Serial
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-sky-400"></div>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-sky-400"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-[11px] font-mono text-slate-400 block">
              HOẶC NHẬP MÃ TỪ BÀN PHÍM:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập Serial hoặc MAC..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-sky-400 outline-none uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dùng Mã
              </button>
            </div>
          </form>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
            <span>Quét mã QR/Barcode thiết bị</span>
            <button
              type="button"
              onClick={startCamera}
              className="text-sky-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Thử lại Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
