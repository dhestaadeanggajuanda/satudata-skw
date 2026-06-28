import { useEffect, useRef, useState } from 'react'

// Widget aksesibilitas mengambang. Semua opsi disimpan di localStorage dan
// diterapkan via class/ style pada <html>; skrip di _document menerapkannya
// kembali saat muat (anti-flicker).

const FLAGS = {
  contrast: 'a11y-contrast',
  links: 'a11y-links',
  readable: 'a11y-readable',
  motion: 'a11y-reduce-motion',
} as const
type FlagKey = keyof typeof FLAGS

const FONT_STEPS = ['100%', '110%', '120%', '130%']
const MAX_FONT = FONT_STEPS.length - 1

type State = Record<FlagKey, boolean> & { font: number }

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<State>({
    contrast: false, links: false, readable: false, motion: false, font: 0,
  })
  const panelRef = useRef<HTMLDivElement>(null)

  // Sinkronkan state dari DOM/localStorage yang sudah diterapkan skrip _document.
  useEffect(() => {
    const d = document.documentElement
    setState({
      contrast: d.classList.contains(FLAGS.contrast),
      links: d.classList.contains(FLAGS.links),
      readable: d.classList.contains(FLAGS.readable),
      motion: d.classList.contains(FLAGS.motion),
      font: parseInt(localStorage.getItem('a11y-font') || '0', 10) || 0,
    })
  }, [])

  // Tutup via Esc + klik di luar panel.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const toggleFlag = (key: FlagKey) => {
    const cls = FLAGS[key]
    const d = document.documentElement
    const next = !d.classList.contains(cls)
    d.classList.toggle(cls, next)
    localStorage.setItem(cls, next ? '1' : '0')
    setState((s) => ({ ...s, [key]: next }))
  }

  const setFont = (level: number) => {
    const l = Math.max(0, Math.min(MAX_FONT, level))
    document.documentElement.style.fontSize = l === 0 ? '' : FONT_STEPS[l]
    localStorage.setItem('a11y-font', String(l))
    setState((s) => ({ ...s, font: l }))
  }

  const reset = () => {
    const d = document.documentElement
    Object.values(FLAGS).forEach((c) => { d.classList.remove(c); localStorage.removeItem(c) })
    d.style.fontSize = ''
    localStorage.removeItem('a11y-font')
    setState({ contrast: false, links: false, readable: false, motion: false, font: 0 })
  }

  return (
    <div ref={panelRef}>
      {/* Tombol mengambang */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pengaturan aksesibilitas"
        aria-expanded={open}
        title="Aksesibilitas"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0c2445] text-white shadow-lg ring-1 ring-black/10 transition-colors hover:bg-[#163666] focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]"
    >
        {/* Ikon aksesibilitas (universal) */}
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="3.8" r="1.8" />
          <path d="M3.5 7.6a1 1 0 0 1 .6-1.28c2.4-.86 4.9-1.32 7.9-1.32s5.5.46 7.9 1.32a1 1 0 1 1-.68 1.88c-1.7-.6-3.4-1-5.22-1.14V10c0 .5.06.99.2 1.46l1.94 6.78a1 1 0 1 1-1.92.54l-1.5-5.24a.5.5 0 0 0-.96 0l-1.5 5.24a1 1 0 1 1-1.92-.54l1.94-6.78c.14-.47.2-.96.2-1.46V7.24c-1.82.14-3.52.54-5.22 1.14a1 1 0 0 1-1.28-.6 1 1 0 0 1 .02-.18z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Pengaturan aksesibilitas"
          className="fixed bottom-20 right-5 z-50 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Aksesibilitas</h2>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-medium text-[#0c2445] hover:underline dark:text-blue-300"
            >
              Reset
            </button>
          </div>

          {/* Ukuran teks */}
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Ukuran teks</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFont(state.font - 1)}
                disabled={state.font === 0}
                aria-label="Perkecil teks"
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                A&minus;
              </button>
              <span className="w-10 text-center text-xs text-gray-500 dark:text-gray-400">{FONT_STEPS[state.font]}</span>
              <button
                type="button"
                onClick={() => setFont(state.font + 1)}
                disabled={state.font === MAX_FONT}
                aria-label="Perbesar teks"
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-gray-200 text-base font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                A+
              </button>
            </div>
          </div>

          {/* Toggle opsi */}
          <div className="space-y-1.5">
            {([
              ['contrast', 'Kontras tinggi'],
              ['links', 'Sorot tautan'],
              ['readable', 'Font ramah dibaca'],
              ['motion', 'Kurangi animasi'],
            ] as [FlagKey, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleFlag(key)}
                aria-pressed={state[key]}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span>{label}</span>
                <span
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    state[key] ? 'bg-[#0c2445] dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      state[key] ? 'left-[1.15rem]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
