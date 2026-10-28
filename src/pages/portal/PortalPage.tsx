import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Wifi, Loader2, Check, Shield, ExternalLink, Megaphone, MapPin } from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { PortalInitResponse } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';

export const PortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [portalData, setPortalData] = useState<PortalInitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  const locationParam = searchParams.get('location') || undefined;
  const macParam = searchParams.get('mac') || undefined;

  useEffect(() => {
    loadPortal();
  }, [locationParam, macParam]);

  const loadPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalApi.init(locationParam);
      setPortalData(data);
      if (data.clientMacHint) {
        setMacAddress(data.clientMacHint);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối tới cổng dịch vụ Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData) return;

    if (!consentGiven) {
      setError('Vui lòng đồng ý với điều khoản để kết nối.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const resp = await portalApi.login({
        locationSlug: portalData.location.slug,
        macAddress: macAddress || portalData.clientMacHint,
        guestName,
        guestContact,
        consentGiven: true,
      });

      if (resp.status === 'AUTHORIZED') {
        // Trigger underlying gateway physical unblock if running under MyPublicWiFi
        try {
          fetch(`http://${window.location.hostname}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: '_action=TOCLogin',
            mode: 'no-cors',
          }).catch(() => {});
        } catch (_) {}

        navigate(`/portal/status/${resp.sessionToken}`);
      } else {
        setError(resp.message || 'Chưa thể cấp quyền truy cập. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err?.message || 'Kết nối mạng thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-xs w-full shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-slate-800 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang tải cổng mạng...</p>
        </div>
      </div>
    );
  }

  if (error && !portalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
          <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Không thể tải cổng Wi-Fi</h2>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadPortal}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-md w-full overflow-hidden">
        {/* Fresh, Clean Header */}
        <div className="p-6 pb-5 border-b border-slate-100 text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-100/60">
            <Wifi className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Wi-Fi Chùa</h1>
          <p className="text-xs text-slate-500 mt-1">
            {portalData?.location.welcomeMessage || 'Truy cập Internet miễn phí tốc độ cao'}
          </p>
          
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
            {portalData?.location.name && (
              <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2.5 py-1 rounded-md font-medium text-slate-700">
                <MapPin className="w-3 h-3 text-slate-500" />
                {portalData.location.name}
              </span>
            )}
            <span className="bg-slate-100/80 px-2.5 py-1 rounded-md">
              Thời lượng: <strong>{portalData?.location.sessionDurationMinutes || 120} phút</strong>
            </span>
            <span className="bg-slate-100/80 px-2.5 py-1 rounded-md">
              Tốc độ: <strong>{portalData?.location.maxBandwidthMbps || 30} Mbps</strong>
            </span>
          </div>
        </div>

        {/* Promotional / Survey / Intro Article Banner Card */}
        {(portalData?.location.promoTitle || portalData?.location.promoContent || portalData?.location.promoBannerUrl) && (
          <div className="border-b border-slate-150 bg-slate-50/60">
            {portalData.location.promoBannerUrl && (
              <div className="relative w-full h-40 bg-slate-100 overflow-hidden border-b border-slate-100">
                <img
                  src={portalData.location.promoBannerUrl}
                  alt={portalData.location.promoTitle || 'Quảng cáo'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 tracking-wide">
                <Megaphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bản tin & Quảng cáo chi nhánh</span>
              </div>
              {portalData.location.promoTitle && (
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {portalData.location.promoTitle}
                </h3>
              )}
              {portalData.location.promoContent && (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {portalData.location.promoContent}
                </p>
              )}
              {portalData.location.promoActionUrl && (
                <div className="pt-1">
                  <a
                    href={portalData.location.promoActionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <span>Xem bài viết / Tham gia khảo sát</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portal Form */}
        <form onSubmit={handleConnect} className="p-5 space-y-4">
          {error && <AlertBanner type="error" message={error} />}

          {/* Device Network Info */}
          <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Địa chỉ IP:</span>
              <span className="font-mono text-slate-800 font-medium">{portalData?.clientIp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Địa chỉ MAC:</span>
              <span className="font-mono text-slate-800 font-medium">{macAddress || portalData?.clientMacHint || 'Tự động nhận diện'}</span>
            </div>
          </div>

          {/* Simple optional name field */}
          <div>
            <label htmlFor="guestName" className="block text-xs font-medium text-slate-700 mb-1">
              Tên thiết bị / Tên bạn <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="VD: iPhone của Tuấn"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
            />
          </div>

          {/* Simple Consent Checkbox */}
          <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600 pt-1">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
            />
            <span className="leading-snug">
              Tôi đồng ý kết nối và tuân thủ quy định sử dụng mạng Wi-Fi Chùa.
            </span>
          </label>

          {/* Connect Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg font-medium text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối mạng...</span>
              </>
            ) : (
              <span>Kết nối Internet ngay</span>
            )}
          </button>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Wi-Fi Chùa System • Không giới hạn dung lượng
        </div>
      </div>
    </div>
  );
};
