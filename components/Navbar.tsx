import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  CircleStackIcon,
  TagIcon,
  BuildingOfficeIcon,
  Squares2X2Icon,
  GlobeAltIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'

const NAV_LINKS = [
  { href: '/search',     label: 'Dataset',    icon: CircleStackIcon },
  { href: '/topik',      label: 'Topik',      icon: TagIcon },
  { href: '/organisasi', label: 'Organisasi', icon: BuildingOfficeIcon },
]

const APP_LINKS = [
  { href: 'https://singkawangkota.go.id',      label: 'Portal Singkawang',   icon: GlobeAltIcon },
  { href: 'https://mail.singkawangkota.go.id', label: 'Mail Singkawang',     icon: EnvelopeIcon },
  { href: 'https://data.go.id',                label: 'Satu Data Indonesia', icon: CircleStackIcon },
  { href: 'https://singkawangkota.bps.go.id',  label: 'BPS Singkawang',      icon: ChartBarIcon },
]

export default function Navbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close both menus on route change
  useEffect(() => {
    const close = () => { setMobileOpen(false); setDropdownOpen(false) }
    router.events.on('routeChangeStart', close)
    return () => router.events.off('routeChangeStart', close)
  }, [router.events])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = router.pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0c2445]/5 text-[#0c2445]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#0c2445]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}

          {/* Aplikasi dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                dropdownOpen
                  ? 'bg-[#0c2445]/5 text-[#0c2445]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-[#0c2445]'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              Aplikasi
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                {APP_LINKS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0c2445]"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-400" />
                      {label}
                    </span>
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-gray-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
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
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = router.pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0c2445]/5 text-[#0c2445]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#0c2445]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}

            {/* Aplikasi section */}
            <div className="pt-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Aplikasi
              </p>
              {APP_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-[#0c2445]"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    {label}
                  </span>
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
