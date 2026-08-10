import Link from 'next/link'
import NewsCard, { NewsCardSkeleton } from './NewsCard'
import { useNews } from '../lib/useNews'

const HOME_LIMIT = 3

// Section "Berita" di beranda. Datanya diambil di browser (lihat lib/wordpress.ts),
// jadi tidak ada di HTML awal — makanya ada skeleton saat memuat.
export default function NewsSection() {
  const { posts, loading, error } = useNews(HOME_LIMIT)

  // Kalau gagal atau memang kosong, section-nya hilang saja — sama seperti
  // perilaku section lain di beranda, dan tidak memunculkan blok kosong.
  if (!loading && posts.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Berita</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Kabar seputar statistik dan data dari Media Center Kota Singkawang
          </p>
        </div>
        <Link
          href="/berita"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800"
        >
          Lihat semua &rarr;
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: HOME_LIMIT }, (_, i) => <NewsCardSkeleton key={i} />)
          : posts.map((post) => <NewsCard key={post.id} post={post} />)}
      </div>
    </section>
  )
}
