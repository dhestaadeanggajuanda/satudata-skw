import Head from 'next/head'
import Link from 'next/link'
import type { GetStaticProps } from 'next'
import { ckan, DMS, type CkanBlogPost } from '../lib/ckan'

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${DMS}${url.startsWith('/') ? '' : '/'}${url}`
}

export const getStaticProps: GetStaticProps<{ posts: CkanBlogPost[] }> = async () => {
  const posts = await ckan.blogList(100)
  return { props: { posts } }
}

export default function InfografisPage({ posts }: { posts: CkanBlogPost[] }) {
  return (
    <>
      <Head>
        <title>Infografis — Satu Data Kota Singkawang</title>
      </Head>

      {/* Header band */}
      <div className="border-b border-gray-200 bg-white py-5 shadow-sm">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="mb-1 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span>Infografis</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900">Infografis</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Konten visual resmi Pemerintah Kota Singkawang
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Belum ada infografis</p>
            <p className="mt-1 text-xs text-gray-400">Konten akan muncul di sini setelah dipublikasikan</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <a
                key={post.name}
                href={`${DMS}/blog/${post.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[#0c2445]/30 hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  {resolveImageUrl(post.image) ? (
                    <img
                      src={resolveImageUrl(post.image)!}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0c2445]/10 to-[#0c2445]/5">
                      <svg className="h-10 w-10 text-[#0c2445]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-sm font-semibold leading-snug text-gray-900 line-clamp-3 group-hover:text-[#0c2445]">
                    {post.title}
                  </h2>
                  {post.publish_date && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      {new Date(post.publish_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                  <div className="flex-1" />
                  <div className="mt-3 border-t border-gray-100 pt-2.5">
                    <span className="text-[11px] font-medium text-[#0c2445]/70 group-hover:text-[#0c2445]">
                      Baca selengkapnya &rarr;
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
