import Head from 'next/head'
import Link from 'next/link'
import type { GetStaticProps } from 'next'
import { REVALIDATE } from '../lib/ckan'
import { MEDIACENTER, NEWS_QUERY, newsList, type NewsPost } from '../lib/wordpress'

export const getStaticProps: GetStaticProps<{ posts: NewsPost[] }> = async () => {
  const posts = await newsList(30)
  return { props: { posts }, revalidate: REVALIDATE }
}

export default function BeritaPage({ posts }: { posts: NewsPost[] }) {
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
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m0-13v13M9 8h4m-4 4h4m-4 4h2" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Belum ada berita</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Berita akan muncul di sini setelah dipublikasikan di Media Center
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[#0c2445]/30 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
                >
                  <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0c2445]/10 to-[#0c2445]/5">
                        <svg className="h-10 w-10 text-[#0c2445]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m0-13v13M9 8h4m-4 4h4m-4 4h2" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="text-sm font-semibold leading-snug text-gray-900 line-clamp-3 group-hover:text-[#0c2445] dark:text-gray-100 dark:group-hover:text-blue-300">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-3 dark:text-gray-400">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex-1" />
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
                      {post.date && (
                        <time dateTime={post.date} className="text-[11px] text-gray-400 dark:text-gray-500">
                          {new Date(post.date).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </time>
                      )}
                      <span className="text-[11px] font-medium text-[#0c2445]/70 group-hover:text-[#0c2445] dark:text-blue-300/70 dark:group-hover:text-blue-300">
                        Baca &rarr;
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
              Sumber:{' '}
              <a
                href={`${MEDIACENTER}/?s=${encodeURIComponent(NEWS_QUERY)}`}
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
