import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const NAV_LINKS = [
  { href: '/search', label: 'Dataset' },
  { href: '/topik', label: 'Topik' },
  { href: '/organisasi', label: 'Organisasi' },
]

export default function Navbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    const close = () => setMobileOpen(false)
    router.events.on('routeChangeStart', close)
    return () => router.events.off('routeChangeStart', close)
  }, [router.events])

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#0c2445] to-[#1a4f7a]" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Satu Data Kota Singkawang — beranda"
        >
          <img
            src="/logo-satudata.png"
            alt="Satu Data Kota Singkawang"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#0c2445]">Satu Data Kota Singkawang</p>
            <p className="hidden text-[11px] tracking-wide text-gray-400 sm:block">Portal Data Terbuka</p>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = router.pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0c2445]/5 text-[#0c2445]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#0c2445]'
                }`}
              >
                {label}
              </Link>
            )
          })}
          <a
            href="https://singkawangkota.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0c2445]"
          >
            singkawangkota.go.id ↗
          </a>
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = router.pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0c2445]/5 text-[#0c2445]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#0c2445]'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            <a
              href="https://singkawangkota.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0c2445]"
            >
              singkawangkota.go.id ↗
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
