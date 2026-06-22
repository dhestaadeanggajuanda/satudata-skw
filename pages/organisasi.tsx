import Head from 'next/head'
import Link from 'next/link'
import type { GetStaticProps } from 'next'
import { ckan, type CkanOrgCard } from '../lib/ckan'

export const getStaticProps: GetStaticProps<{ orgs: CkanOrgCard[] }> = async () => {
  const orgs = await ckan.organizationListFull()
  const sorted = orgs.sort((a, b) => b.packageCount - a.packageCount)
  return { props: { orgs: sorted } }
}

export default function OrganisasiPage({ orgs }: { orgs: CkanOrgCard[] }) {
  const withData = orgs.filter((o) => o.packageCount > 0)
  const empty = orgs.filter((o) => o.packageCount === 0)

  return (
    <>
      <Head>
        <title>Organisasi — Satu Data Kota Singkawang</title>
      </Head>

      {/* Header band */}
      <div className="border-b border-gray-200 bg-white py-5 shadow-sm">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="mb-1 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span>Organisasi</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900">Organisasi</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {orgs.length} instansi pemerintah Kota Singkawang yang menerbitkan data
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Orgs with data */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withData.map((org) => (
            <OrgCard key={org.name} org={org} />
          ))}
        </div>

        {/* Orgs with no data yet */}
        {empty.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold text-gray-400">
              Belum ada dataset ({empty.length} instansi)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {empty.map((org) => (
                <OrgCard key={org.name} org={org} muted />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

function OrgCard({ org, muted = false }: { org: CkanOrgCard; muted?: boolean }) {
  const content = (
    <div className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-all ${
      muted
        ? 'border-gray-100 opacity-60'
        : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
    }`}>
      <div className="flex items-start gap-3">
        {org.imageUrl ? (
          <img
            src={org.imageUrl}
            alt={org.title}
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2">
            {org.title}
          </h2>
          {org.description && (
            <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
              {org.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs font-semibold text-[#0c2445]">
          {org.packageCount}
          <span className="ml-1 font-normal text-gray-400">dataset</span>
        </span>
        {!muted && (
          <span className="text-[11px] font-medium text-blue-600">Lihat dataset &rarr;</span>
        )}
      </div>
    </div>
  )

  if (muted) return <div key={org.name}>{content}</div>

  return (
    <Link key={org.name} href={`/search?org=${encodeURIComponent(org.name)}`}>
      {content}
    </Link>
  )
}
