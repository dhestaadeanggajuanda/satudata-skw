import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV_LINKS = [
  { href: '/search', label: 'Dataset' },
  { href: '/topik', label: 'Topik' },
  { href: '/organisasi', label: 'Organisasi' },
]

export default function Navbar() {
  const router = useRouter()

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
            src="/logo-singkawang.png"
            alt="Lambang Kota Singkawang"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#0c2445]">Satu Data Kota Singkawang</p>
            <p className="text-[11px] tracking-wide text-gray-400">Portal Data Terbuka</p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
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
      </nav>
    </header>
  )
}
