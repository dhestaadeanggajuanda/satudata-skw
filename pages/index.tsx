import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import type { GetStaticProps } from 'next'
import { ckan, datasetHref, type DatasetCard } from '../lib/ckan'

type OrgChip = { name: string; title: string }

type Props = {
  featured: DatasetCard[]
  orgs: OrgChip[]
  totalCount: number
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [{ datasets: featuredRaw, count }, orgs] = await Promise.all([
    ckan.packageSearch({ offset: 0, limit: 6 }),
    ckan.organizationList(),
  ])
  const featured: DatasetCard[] = featuredRaw.map((d) => ({
    slug: d.name,
    namespace: d.organization?.name || 'dataset',
    name: d.title || d.name,
    description: d.notes ? d.notes.slice(0, 160) : '',
    groups: (d.groups || []).map((g) => g.name),
  }))
  return { props: { featured, orgs: orgs.slice(0, 8), totalCount: count } }
}

export default function Home({ featured, orgs, totalCount }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const search = (q: string) => {
    const trimmed = q.trim()
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  return (
    <>
      <Head>
        <title>Satu Data Kota Singkawang</title>
      </Head>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c2445] via-[#0f3060] to-[#1a4f7a] py-20 px-4">
        {/* Watermark */}
        <img
          src="/logo-singkawang.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 object-contain opacity-[0.07] select-none"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <img
            src="/logo-singkawang.png"
            alt="Lambang Kota Singkawang"
            className="mx-auto mb-5 h-16 w-16 object-contain drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Satu Data Kota Singkawang
          </h1>
          <p className="mt-3 text-base text-white/65 sm:text-lg">
            Portal data terbuka Pemerintah Kota Singkawang, Kalimantan Barat
          </p>

          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); search(query) }}
            className="mt-8 flex overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-white/20"
            role="search"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari dari ${totalCount} dataset...`}
              aria-label="Cari dataset"
              className="flex-1 bg-transparent px-5 py-4 text-base text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 bg-[#0c2445] px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#163666]"
            >
              Cari
            </button>
          </form>

          {/* Org chips */}
          {orgs.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs text-white/40 uppercase tracking-widest">
                Jelajahi berdasarkan organisasi
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {orgs.map((org) => (
                  <Link
                    key={org.name}
                    href={`/search?org=${encodeURIComponent(org.name)}`}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-white/75 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/15 hover:text-white"
                  >
                    {org.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6">
            <Link href="/search" className="text-sm text-white/50 underline underline-offset-4 hover:text-white/80 transition-colors">
              Lihat semua dataset &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl divide-x divide-gray-100 px-4">
          <div className="py-4 pr-8">
            <p className="text-2xl font-bold text-[#0c2445]">{totalCount}</p>
            <p className="text-xs text-gray-500">Dataset tersedia</p>
          </div>
          <div className="py-4 px-8">
            <p className="text-2xl font-bold text-[#0c2445]">{orgs.length}+</p>
            <p className="text-xs text-gray-500">Organisasi</p>
          </div>
          <div className="py-4 px-8">
            <p className="text-2xl font-bold text-[#0c2445]">Terbuka</p>
            <p className="text-xs text-gray-500">Akses publik</p>
          </div>
        </div>
      </div>

      {/* ── Featured datasets ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dataset Terbaru</h2>
              <p className="mt-0.5 text-sm text-gray-500">Dataset yang baru ditambahkan ke portal</p>
            </div>
            <Link
              href="/search"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((ds) => (
              <Link
                key={`${ds.namespace}/${ds.slug}`}
                href={datasetHref(ds)}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                <span className="inline-block self-start rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium capitalize text-blue-700">
                  {ds.namespace.replace(/-/g, ' ')}
                </span>
                <h3 className="mt-3 text-sm font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-blue-700">
                  {ds.name}
                </h3>
                {ds.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {ds.description}
                  </p>
                )}
                <div className="flex-1" />
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-[11px] text-gray-400">Dataset</span>
                  <span className="text-[11px] font-medium text-blue-600 group-hover:text-blue-700">
                    Lihat &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
