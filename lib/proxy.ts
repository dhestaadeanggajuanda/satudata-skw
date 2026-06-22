// Client-side helper: route external resource URLs through the server-side proxy
// to avoid CORS blocks. Local /data/ paths are passed through unchanged.
export function proxyUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/resource?url=${encodeURIComponent(url)}`
  }
  return url
}
