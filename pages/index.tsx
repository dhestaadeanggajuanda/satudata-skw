import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import type { GetStaticProps } from 'next'
import { ckan, type CkanGroupCard, type CkanOrgCard } from '../lib/ckan'

type Props = {
  totalCount: number
  tags: string[]
  groups: CkanGroupCard[]
  orgs: CkanOrgCard[]
}

const TOPIC_ICONS: Record<string, string> = {
  pendidikan: '🎓',
  kesehatan: '🏥',
  ekonomi: '📈',
  perpustakaan: '📚',
  'pekerjaan-umum-dan-penataan-ruang': '🏗️',
  'administrasi-kependudukan-dan-pencatatan-sipil': '🪪',
  kearsipan: '🗂️',
  kebudayaan: '🎭',
  'sumber-daya-alam-dan-lingkungan': '🌿',
  pariwisata: '🏖️',
  perhubungan: '🚦',
  pangan: '🌾',
  'kelautan-dan-perikanan': '🐟',
  'kepemudaan-dan-olahraga': '⚽',
  perindustrian: '🏭',
  'koperasi-usaha-kecil-dan-menengah': '🤝',
  'penanaman-modal': '💼',
  persandian: '🔐',
  komunikasi: '📡',
  'komunikasi-dan-informatika': '💻',
  'pemberdayaan-masyarakat-dan-desa': '🏘️',
  'pemberdayaan-perempuan-dan-perlindungan-anak': '👨‍👩‍👧',
  'pengendalian-penduduk-dan-keluarga-berencana': '👨‍👩‍👦',
  'pemerintahan-umum': '🏛️',
  'ketentraman-ketertiban-umum-dan-perlindungan-masyarakat': '🛡️',
  pengawas: '🔍',
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [{ count }, tags, groups, orgs] = await Promise.all([
    ckan.packageSearch({ offset: 0, limit: 1 }),
    ckan.tagList(),
    ckan.groupList(),
    ckan.organizationListFull(),
  ])
  return {
    props: {
      totalCount: count,
      tags,
      groups: groups
        .filter((g) => g.packageCount > 0)
        .sort((a, b) => b.packageCount - a.packageCount)
        .slice(0, 8),
      orgs: orgs
        .filter((o) => o.packageCount > 0)
        .sort((a, b) => b.packageCount - a.packageCount)
        .slice(0, 6),
    },
  }
}

export default function Home({ totalCount, tags, groups, orgs }: Props) {
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
      <section className="relative overflow-hidden py-12 px-4 sm:py-20">
        {/* Background photo */}
        <img
          src="/hero-singkawang.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c2445]/90 via-[#0f3060]/85 to-[#1a4f7a]/80" />

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

          {/* Tag chips */}
          {tags.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs text-white/40 uppercase tracking-widest">
                Jelajahi berdasarkan topik
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-white/75 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/15 hover:text-white"
                  >
                    {tag}
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
            <p className="text-xl font-bold text-[#0c2445] sm:text-2xl">{totalCount}</p>
            <p className="text-xs text-gray-500">Dataset tersedia</p>
          </div>
          <div className="py-4 px-8">
            <p className="text-xl font-bold text-[#0c2445] sm:text-2xl">25+</p>
            <p className="text-xs text-gray-500">Organisasi</p>
          </div>
          <div className="py-4 px-8">
            <p className="text-xl font-bold text-[#0c2445] sm:text-2xl">Terbuka</p>
            <p className="text-xs text-gray-500">Akses publik</p>
          </div>
        </div>
      </div>

      {/* ── Topik ── */}
      {groups.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Topik</h2>
              <p className="mt-0.5 text-sm text-gray-500">Jelajahi dataset berdasarkan bidang</p>
            </div>
            <Link
              href="/topik"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((grp) => (
              <Link
                key={grp.name}
                href={`/search?group=${encodeURIComponent(grp.name)}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  {grp.imageUrl ? (
                    <img
                      src={grp.imageUrl}
                      alt={grp.title}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-2xl">
                      {TOPIC_ICONS[grp.name] ?? '📂'}
                    </div>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {grp.packageCount} dataset
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-emerald-700">
                  {grp.title}
                </h3>
                <div className="flex-1" />
                <div className="mt-3 border-t border-gray-100 pt-2.5">
                  <span className="text-[11px] font-medium text-emerald-600 group-hover:text-emerald-700">
                    Jelajahi &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Organisasi ── */}
      {orgs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Organisasi</h2>
              <p className="mt-0.5 text-sm text-gray-500">Instansi pemerintah yang menerbitkan data</p>
            </div>
            <Link
              href="/organisasi"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <Link
                key={org.name}
                href={`/search?org=${encodeURIComponent(org.name)}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
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
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-700">
                    {org.title}
                  </p>
                  <p className="text-xs text-gray-400">{org.packageCount} dataset</p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-blue-600 group-hover:text-blue-700">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
