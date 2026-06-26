import type { NextApiRequest, NextApiResponse } from 'next'

const ALLOWED_HOST = (process.env.DMS || 'https://data.singkawangkota.go.id').replace(/\/+$/, '')

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

  const origin = `${parsed.protocol}//${parsed.host}`
  if (!ALLOWED_HOST.startsWith(origin)) {
    return res.status(403).json({ error: 'url not from allowed host' })
  }

  try {
    const upstream = await fetch(url, { headers: { Accept: '*/*' } })
    const contentType = upstream.headers.get('content-type') ?? 'text/plain'
    const body = await upstream.arrayBuffer()
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(upstream.status).send(Buffer.from(body))
  } catch (e) {
    res.status(502).json({ error: 'upstream fetch failed' })
  }
}
