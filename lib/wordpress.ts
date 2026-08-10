// Klien WordPress untuk Media Center Kota Singkawang.
//
// PENTING: dipanggil DARI BROWSER, bukan dari getStaticProps. Server produksi
// berada di belakang NAT yang tidak mendukung hairpin, sehingga tidak bisa
// menghubungi 103.140.206.4 — IP publiknya sendiri, yang juga dipakai
// mediacenter (koneksi selalu ETIMEDOUT). CKAN tetap bisa karena dialamatkan
// lewat IP internal (DMS=172.16.20.229:5000). Browser pengunjung tidak kena
// batasan itu, dan /wp-json mengirim header CORS yang mengizinkan origin portal.

// Base URL Media Center. Prefiks NEXT_PUBLIC_ wajib supaya nilainya ikut
// ter-inline ke bundle browser saat build.
export const MEDIACENTER = (
  process.env.NEXT_PUBLIC_MEDIACENTER_URL || 'https://mediacenter.singkawangkota.go.id'
).replace(/\/+$/, '')

// Kata kunci pencarian berita. WordPress mencari di judul, isi, dan kutipan.
export const NEWS_QUERY = process.env.NEXT_PUBLIC_MEDIACENTER_QUERY || 'statistik'

// Batas waktu permintaan (ms) — dipakai oleh useNews.
export const NEWS_TIMEOUT_MS = 15000

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
// Melempar error kalau gagal — pemanggil (useNews) yang menentukan tampilannya.
export async function fetchNews(limit = 12, signal?: AbortSignal): Promise<NewsPost[]> {
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

  // Hanya header CORS-safelisted supaya permintaan tetap "simple" (tanpa preflight).
  const res = await fetch(`${MEDIACENTER}/wp-json/wp/v2/posts?${qs}`, {
    headers: { Accept: 'application/json' },
    signal,
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
}
