import { useEffect, useState } from 'react'
import { fetchNews, NEWS_TIMEOUT_MS, type NewsPost } from './wordpress'

export type NewsState = {
  posts: NewsPost[]
  loading: boolean
  error: boolean
}

// Ambil berita di sisi klien. Lihat lib/wordpress.ts untuk alasan kenapa ini
// tidak dijalankan di server.
export function useNews(limit: number): NewsState {
  const [state, setState] = useState<NewsState>({ posts: [], loading: true, error: false })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, NEWS_TIMEOUT_MS)

    setState({ posts: [], loading: true, error: false })

    fetchNews(limit, controller.signal)
      .then((posts) => {
        if (active) setState({ posts, loading: false, error: false })
      })
      .catch((err) => {
        // Abort karena unmount bukan kegagalan — jangan set state apa pun.
        if (!active || (err?.name === 'AbortError' && !timedOut)) return
        console.warn('[mediacenter] gagal mengambil berita:', err?.message)
        setState({ posts: [], loading: false, error: true })
      })
      .finally(() => clearTimeout(timer))

    return () => {
      active = false
      clearTimeout(timer)
      controller.abort()
    }
  }, [limit])

  return state
}
