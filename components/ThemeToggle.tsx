import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

// Toggle mode gelap/terang. Menyimpan pilihan di localStorage('theme') dan
// menyetel class `dark` pada <html>. Nilai awal diterapkan oleh skrip di
// _document; di sini hanya menyinkronkan ikon setelah mount.
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const root = document.documentElement
    const next = !root.classList.contains('dark')
    root.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      suppressHydrationWarning
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {mounted && dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  )
}
