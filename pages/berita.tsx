import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import NewsCard, { NewsCardSkeleton } from '../components/NewsCard'
import { useNews } from '../lib/useNews'
import { MEDIACENTER, NEWS_QUERY } from '../lib/wordpress'

// Semua berita diambil sekali (maks. 100 per permintaan WordPress), lalu dibagi
// per halaman di browser.
const LIMIT = 100
const PER_PAGE = 8

// Halaman statis: berita diambil di browser (lihat lib/wordpress.ts), jadi tidak
// ada getStaticProps sama sekali.
export default function BeritaPage() {
  const { posts, loading, error } = useNews(LIMIT)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const pagePosts = posts.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const goTo = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sourceUrl = `${MEDIACENTER}/?s=${encodeURIComponent(NEWS_QUERY)}`

  return (
    <>
      <Head>
        <title>Berita — Satu Data Kota Singkawang</title>
      </Head>

      {/* Header band */}
      <div className="border-b border-gray-200 bg-white py-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="mb-1 text-xs text-gray-400 dark:text-gray-500">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span>Berita</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Berita</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Kabar seputar statistik dan data dari Media Center Kota Singkawang
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PER_PAGE }, (_, i) => <NewsCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Berita gagal dimuat
            </p>
            <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-gray-500">
              Media Center sedang tidak dapat dihubungi dari peramban Anda.
            </p>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              Buka Media Center &rarr;
            </a>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m0-13v13M9 8h4m-4 4h4m-4 4h2" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Belum ada berita</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Berita akan muncul di sini setelah dipublikasikan di Media Center
            </p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pagePosts.map((post) => (
                <NewsCard key={post.id} post={post} heading="h2" />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination current={current} total={totalPages} onChange={goTo} />
            )}

            <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
              Sumber:{' '}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Media Center Kota Singkawang
              </a>
            </p>
          </>
        )}
      </main>
    </>
  )
}

// Nomor halaman: selalu tampilkan pertama, terakhir, dan tetangga halaman aktif.
function pageItems(current: number, total: number): (number | 'gap')[] {
  const keep = new Set([1, total, current - 1, current, current + 1])
  const out: (number | 'gap')[] = []
  let prev = 0
  for (let p = 1; p <= total; p++) {
    if (!keep.has(p)) continue
    if (p - prev > 1) out.push('gap')
    out.push(p)
    prev = p
  }
  return out
}

const PAGE_BTN =
  'flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors '

const PAGE_IDLE =
  'border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 ' +
  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800'

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (p: number) => void
}) {
  return (
    <nav aria-label="Halaman berita" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`${PAGE_BTN}${PAGE_IDLE} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        &larr; Sebelumnya
      </button>
      {pageItems(current, total).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400 dark:text-gray-500" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Halaman ${item}`}
            aria-current={item === current ? 'page' : undefined}
            className={
              PAGE_BTN +
              (item === current
                ? 'border-[#0c2445] bg-[#0c2445] text-white dark:border-blue-500 dark:bg-blue-500'
                : PAGE_IDLE)
            }
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className={`${PAGE_BTN}${PAGE_IDLE} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Selanjutnya &rarr;
      </button>
    </nav>
  )
}
