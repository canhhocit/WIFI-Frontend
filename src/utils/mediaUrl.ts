/**
 * Utilities for normalizing media URLs (images & videos) on the Captive Portal.
 *
 * Key mobile & Captive Portal Walled Garden requirements:
 * 1. Before a citizen authenticates on the Wi-Fi network, the router's Walled Garden only permits
 *    traffic to the Captive Portal host itself. External object storage hosts (such as
 *    minio.phuchoangmai.xyz behind Cloudflare) are blocked by the router firewall, causing iOS
 *    Captive Network Assistant (CNA) to hang waiting for TCP timeouts and causing uploaded videos
 *    to fail with a black screen.
 * 2. Rewriting bucket URLs to same-origin `/uploads/<category>/<filename>` routes them through
 *    Backend `MediaStreamController`, which streams them from local disk or MinIO with full
 *    RFC 7233 HTTP 206 Partial Content (Byte-Range) support required by iOS Safari `<video>`.
 */

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Rewrite external MinIO bucket URLs to same-origin /uploads/...
  const bucketMarker = '/wifi-haiphong/';
  const bucketIdx = trimmed.indexOf(bucketMarker);
  if (bucketIdx >= 0 && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    const relPath = trimmed.slice(bucketIdx + bucketMarker.length).replace(/^\/+/, '');
    if (relPath) {
      return `/uploads/${relPath}`;
    }
  }

  // Rewrite hardcoded localhost backend upload URLs to relative /uploads/...
  const uploadsMarker = '/uploads/';
  const uploadsIdx = trimmed.indexOf(uploadsMarker);
  if (
    uploadsIdx > 0 &&
    (trimmed.startsWith('http://localhost') ||
      trimmed.startsWith('http://127.0.0.1') ||
      trimmed.startsWith('http://192.168.') ||
      trimmed.startsWith('https://wifi-haiphong'))
  ) {
    return trimmed.slice(uploadsIdx);
  }

  // Prevent Mixed Content blocks on HTTPS portal pages for external HTTP media
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    trimmed.startsWith('http://') &&
    !trimmed.startsWith('http://localhost') &&
    !trimmed.startsWith('http://127.0.0.1') &&
    !trimmed.startsWith('http://192.168.') &&
    !trimmed.startsWith('http://10.')
  ) {
    return 'https://' + trimmed.slice('http://'.length);
  }

  return trimmed;
}

/**
 * Extracts the 11-character YouTube video ID from any standard YouTube URL format:
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Builds a mobile-compatible YouTube embed URL.
 * - Always includes `playsinline=1` so iOS Safari / WebKit plays inline inside modals instead of failing fullscreen.
 * - When `autoPlay` is enabled, includes `mute=1` because iOS Safari and Android Chrome block unmuted
 *   autoplay inside cross-origin iframes (leaving a black screen if `autoplay=1` is used without `mute=1`).
 */
export function getYouTubeEmbedUrl(url?: string | null, autoPlay = false): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    if (url && url.includes('youtube.com/embed/')) {
      return url.includes('playsinline=1')
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}playsinline=1&rel=0`;
    }
    return null;
  }

  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });

  if (autoPlay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }

  if (typeof window !== 'undefined' && window.location.origin.startsWith('http')) {
    params.set('origin', window.location.origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Returns a same-origin proxied YouTube thumbnail URL (`/api/portal/media/yt-thumb/<videoId>`)
 * so that devices in a pre-authentication Captive Portal Walled Garden can still display the
 * video poster image even when `i.ytimg.com` is blocked by the router firewall.
 */
export function getYouTubeThumbnailUrl(url?: string | null, useSameOriginProxy = true): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  if (useSameOriginProxy) {
    return `/api/portal/media/yt-thumb/${videoId}`;
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeWatchUrl(url?: string | null): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function inferVideoMimeType(url?: string | null): string | undefined {
  if (!url) return undefined;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.mp4') || clean.endsWith('.m4v')) return 'video/mp4';
  if (clean.endsWith('.webm')) return 'video/webm';
  if (clean.endsWith('.ogv') || clean.endsWith('.ogg')) return 'video/ogg';
  if (clean.endsWith('.mov')) return 'video/mp4'; // Allow iOS/Android HTML5 H.264 decoder to attempt MOV/MP4 container
  return undefined;
}
