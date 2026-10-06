import { useEffect, useState } from 'react'

// Widget chat "Agent Satu Data" di pojok kanan bawah (widget aksesibilitas ada di
// kiri bawah). Panelnya memuat halaman agent lewat iframe.
//
// NEXT_PUBLIC_ wajib supaya nilainya ter-inline ke bundle browser saat build.
// Host agent juga harus diizinkan di CSP nginx (frame-src) — lihat README.
const AGENT_URL = (process.env.NEXT_PUBLIC_AGENT_URL || '').trim()

// Hanya https:// yang dipakai sebagai sumber iframe.
const AGENT_SRC = /^https:\/\//i.test(AGENT_URL) ? AGENT_URL : ''

export default function AgentWidget() {
  const [open, setOpen] = useState(false)
  // Iframe baru dibuat saat panel pertama kali dibuka, lalu dipertahankan supaya
  // percakapan tidak hilang ketika panel ditutup.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const toggle = () => {
    setOpen((v) => !v)
    setMounted(true)
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-label="Tanya Agent Satu Data"
        aria-expanded={open}
        title="Agent Satu Data"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0c2445] text-white shadow-lg ring-1 ring-black/10 transition-colors hover:bg-[#163666] focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 20.25c4.97 0 9-3.694 9-8.25S16.97 3.75 12 3.75 3 7.444 3 12c0 1.6.5 3.09 1.36 4.35L3.75 20.25l4.2-.9A9.8 9.8 0 0012 20.25z" />
          </svg>
        )}
      </button>

      {mounted && (
        <div
          role="dialog"
          aria-label="Agent Satu Data"
          className={`fixed bottom-20 right-5 z-50 ${open ? 'flex' : 'hidden'} h-[32rem] max-h-[calc(100vh-7rem)] w-96 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900`}
        >
          <div className="flex items-center justify-between bg-[#0c2445] px-4 py-3 text-white">
            <h2 className="text-sm font-bold">Agent Satu Data</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup Agent Satu Data"
              className="text-white/70 hover:text-white"
            >
              &times;
            </button>
          </div>
          {AGENT_SRC ? (
            <iframe
              src={AGENT_SRC}
              title="Agent Satu Data"
              className="h-full w-full flex-1 border-0"
              referrerPolicy="no-referrer"
              allow="clipboard-write"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Agent Satu Data belum dikonfigurasi.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
