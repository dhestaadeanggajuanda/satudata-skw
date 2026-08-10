// Minimal server-side WordPress client for Media Center Kota Singkawang.
// Mengikuti pola lib/ckan.ts: plain fetch, tanpa dependency, dan hanya dipakai
// di getStaticProps sehingga tidak pernah ikut ke bundle browser.

// Base URL Media Center (WordPress). Override lewat env MEDIACENTER_URL.
export const MEDIACENTER = (
  process.env.MEDIACENTER_URL || 'https://mediacenter.singkawangkota.go.id'
).replace(/\/+$/, '')

// Kata kunci pencarian berita yang ditarik ke portal. WordPress mencari di
// judul, isi, dan kutipan. Override lewat env MEDIACENTER_QUERY.
export const NEWS_QUERY = process.env.MEDIACENTER_QUERY || 'statistik'

// Batas waktu fetch (ms) — build tidak boleh menggantung kalau Media Center lambat.
const TIMEOUT_MS = Number(process.env.MEDIACENTER_TIMEOUT_MS) || 15000

export type NewsPost = {
  id: number
  title: string
  excerpt: string
  date: string
  link: string
  image: string | null
}

// Entitas HTML bernama yang lazim muncul di judul/kutipan WordPress.
const NAMED_ENTITIES: Record<string, string> = {
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  amp: '&',
}

// Buang tag HTML lalu decode entitas. Hasilnya dirender React sebagai teks biasa
// (tidak pernah dangerouslySetInnerHTML), jadi markup dari WordPress tidak bisa
// tereksekusi di portal.
function toText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    // &amp; diproses terakhir supaya "&amp;lt;" tidak berubah jadi "<".
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

// Ukuran gambar yang pas untuk kartu berita, dari yang paling hemat.
// Tema Media Center memakai ukuran kustom "td_*"; tidak semua post punya semuanya.
const CARD_IMAGE_SIZES = ['td_696x385', 'medium_large', 'td_534x462', 'medium', 'large']

function pickImage(media: any): string | null {
  if (!media) return null
  const sizes = media.media_details?.sizes
  for (const size of CARD_IMAGE_SIZES) {
    const url = sizes?.[size]?.source_url
    if (url) return url
  }
  return media.source_url || null
}

// Ambil berita terbaru yang cocok dengan NEWS_QUERY, terbaru dulu.
// Mengembalikan [] kalau Media Center tidak bisa dihubungi — section berita
// hilang dari halaman, build tetap jalan.
export async function newsList(limit = 12): Promise<NewsPost[]> {
  const qs = new URLSearchParams({
    search: NEWS_QUERY,
    per_page: String(Math.min(Math.max(limit, 1), 100)),
    orderby: 'date',
    order: 'desc',
    _embed: 'wp:featuredmedia',
    // _fields memangkas payload; "_links.wp:featuredmedia" wajib ikut agar
    // _embed tetap menyertakan gambar utama.
    _fields: 'id,date,link,title,excerpt,_links.wp:featuredmedia',
  })

  try {
    const res = await fetch(`${MEDIACENTER}/wp-json/wp/v2/posts?${qs}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`WP posts gagal: ${res.status} ${res.statusText}`)

    const posts = await res.json()
    if (!Array.isArray(posts)) throw new Error('WP posts: respons bukan array')

    return posts.map((p: any) => ({
      id: p.id,
      title: toText(p.title?.rendered ?? ''),
      excerpt: toText(p.excerpt?.rendered ?? ''),
      date: p.date ?? '',
      link: p.link ?? '',
      image: pickImage(p._embedded?.['wp:featuredmedia']?.[0]),
    }))
  } catch (err) {
    console.warn('[mediacenter] gagal mengambil berita:', (err as Error).message)
    return []
  }
}
