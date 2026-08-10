import Head from 'next/head'
import Link from 'next/link'
import NewsCard, { NewsCardSkeleton } from '../components/NewsCard'
import { useNews } from '../lib/useNews'
import { MEDIACENTER, NEWS_QUERY } from '../lib/wordpress'

const LIMIT = 30

// Halaman statis: berita diambil di browser (lihat lib/wordpress.ts), jadi tidak
// ada getStaticProps sama sekali.
export default function BeritaPage() {
  const { posts, loading, error } = useNews(LIMIT)

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
            {Array.from({ length: 8 }, (_, i) => <NewsCardSkeleton key={i} />)}
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
              {posts.map((post) => (
                <NewsCard key={post.id} post={post} heading="h2" />
              ))}
            </div>

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
