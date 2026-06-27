import type { NextApiRequest, NextApiResponse } from 'next'

// Browser-facing resource URLs use the PUBLIC CKAN host (see ckanUrl), so the proxy
// validates incoming URLs against that host.
const PUBLIC_BASE = (process.env.CKAN_PUBLIC_URL || 'https://data.singkawangkota.go.id').replace(/\/+$/, '')
// But the actual server-side fetch goes to the (possibly internal LAN) host in DMS,
// which is always resolvable from the container — no public DNS/SSL needed at runtime.
const FETCH_BASE = (process.env.DMS || PUBLIC_BASE).replace(/\/+$/, '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url query param required' })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'invalid url' })
  }

  if (parsed.origin !== new URL(PUBLIC_BASE).origin) {
    return res.status(403).json({ error: 'url not from allowed host' })
  }

  // Re-base onto the internal fetch host for the server-side request.
  const target = `${FETCH_BASE}${parsed.pathname}${parsed.search}`

  try {
    const upstream = await fetch(target, { headers: { Accept: '*/*' } })
    const contentType = upstream.headers.get('content-type') ?? 'text/plain'
    const body = await upstream.arrayBuffer()
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(upstream.status).send(Buffer.from(body))
  } catch (e) {
    res.status(502).json({ error: 'upstream fetch failed' })
  }
}
