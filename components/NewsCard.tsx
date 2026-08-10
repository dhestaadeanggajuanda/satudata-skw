import type { NewsPost } from '../lib/wordpress'

const CARD_CLASS =
  'group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ' +
  'dark:border-gray-700 dark:bg-gray-900'

function PlaceholderIcon() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0c2445]/10 to-[#0c2445]/5">
      <svg className="h-10 w-10 text-[#0c2445]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m0-13v13M9 8h4m-4 4h4m-4 4h2" />
      </svg>
    </div>
  )
}

export default function NewsCard({
  post,
  heading = 'h3',
}: {
  post: NewsPost
  heading?: 'h2' | 'h3'
}) {
  // Variabel berhuruf kapital -> React memakai nilainya sebagai nama tag.
  const Heading = heading

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${CARD_CLASS} transition-all hover:border-[#0c2445]/30 hover:shadow-md dark:hover:border-blue-700`}
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
          <PlaceholderIcon />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Heading className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-[#0c2445] dark:text-gray-100 dark:group-hover:text-blue-300">
          {post.title}
        </Heading>
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
  )
}

// Placeholder saat berita masih diambil dari Media Center.
export function NewsCardSkeleton() {
  return (
    <div className={`${CARD_CLASS} animate-pulse`} aria-hidden="true">
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800" />
      <div className="flex flex-1 flex-col p-4">
        <div className="h-3.5 w-11/12 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-2 h-3.5 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-3 space-y-1.5">
          <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-2.5 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="flex-1" />
        <div className="mt-3 border-t border-gray-100 pt-2.5 dark:border-gray-800">
          <div className="h-2.5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
