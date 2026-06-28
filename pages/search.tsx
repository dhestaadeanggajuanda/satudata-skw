import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import type { GetStaticProps } from 'next'
import { ckan, datasetHref, ORG_FILTER, GROUP_FILTER, MAX_DATASETS, REVALIDATE, type DatasetCard } from '../lib/ckan'

const PAGE_SIZE = 20

export const getStaticProps: GetStaticProps<{ datasets: DatasetCard[]; count: number }> = async () => {
  const { datasets, count } = await ckan.packageSearch({
    offset: 0,
    limit: MAX_DATASETS,
    tags: [],
    orgs: ORG_FILTER,
    groups: GROUP_FILTER,
  })
  const cards: DatasetCard[] = datasets.map((d) => ({
    slug: d.name,
    namespace: d.organization?.name || 'dataset',
    name: d.title || d.name,
    description: d.notes ? d.notes.slice(0, 200) : '',
    groups: (d.groups || []).map((g) => g.name),
  }))
  return { props: { datasets: cards, count }, revalidate: REVALIDATE }
}

type OrgEntry = { name: string; title: string; count: number }
type GroupEntry = { name: string; title: string; count: number }

function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

export default function Search({ datasets, count }: { datasets: DatasetCard[]; count: number }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const q = router.isReady ? (typeof router.query.q === 'string' ? router.query.q : '') : ''
  const activeOrg = router.isReady ? (typeof router.query.org === 'string' ? router.query.org : null) : null
  const activeGroup = router.isReady ? (typeof router.query.group === 'string' ? router.query.group : null) : null
  const currentPage = router.isReady ? Math.max(1, Number(router.query.page) || 1) : 1

  const [inputValue, setInputValue] = useState(q)
  useEffect(() => { if (router.isReady) setInputValue(q) }, [router.isReady, q])

  const orgList = useMemo((): OrgEntry[] => {
    const map = new Map<string, OrgEntry>()
    for (const d of datasets) {
      const entry = map.get(d.namespace) ?? { name: d.namespace, title: d.namespace.replace(/-/g, ' '), count: 0 }
      entry.count++
      map.set(d.namespace, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [datasets])

  const groupList = useMemo((): GroupEntry[] => {
    const map = new Map<string, GroupEntry>()
    for (const d of datasets) {
      for (const g of d.groups) {
        const entry = map.get(g) ?? { name: g, title: g.replace(/-/g, ' '), count: 0 }
        entry.count++
        map.set(g, entry)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [datasets])

  const filtered = useMemo(() => {
    let r = activeOrg ? datasets.filter((d) => d.namespace === activeOrg) : datasets
    if (activeGroup) r = r.filter((d) => d.groups.includes(activeGroup))
    const lq = q.trim().toLowerCase()
    if (lq)
      r = r.filter(
        (d) =>
          d.name.toLowerCase().includes(lq) ||
          d.namespace.toLowerCase().includes(lq) ||
          (d.description ?? '').toLowerCase().includes(lq)
      )
    return r
  }, [datasets, q, activeOrg, activeGroup])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(safePage * PAGE_SIZE, filtered.length)

  const navigate = (params: Record<string, string | undefined>) => {
    const next: Record<string, string> = {}
    const merged = { q, org: activeOrg ?? undefined, group: activeGroup ?? undefined, page: '1', ...params }
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') next[k] = v
    }
    router.push({ pathname: '/search', query: next }, undefined, { shallow: true })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ q: inputValue })
  }

  const clearAll = () => navigate({ q: '', org: undefined, group: undefined })
  const hasFilters = !!q || !!activeOrg || !!activeGroup
  const activeOrgEntry = activeOrg ? orgList.find((o) => o.name === activeOrg) : null
  const activeGroupEntry = activeGroup ? groupList.find((g) => g.name === activeGroup) : null

  return (
    <>
      <Head>
        <title>Dataset — Satu Data Kota Singkawang</title>
      </Head>

      {/* Page header band */}
      <div className="border-b border-gray-200 bg-white py-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="mb-1 text-xs text-gray-400 dark:text-gray-500">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span>Dataset</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dataset</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{count} dataset tersedia dari berbagai instansi</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Mobile filter toggle */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6" />
            </svg>
            Filter
            {hasFilters && (
              <span className="rounded-full bg-[#0c2445] px-1.5 py-0.5 text-xs text-white">
                {[!!q, !!activeOrg, !!activeGroup].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className={`w-56 shrink-0 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Filter</h2>
                {hasFilters && (
                  <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">
                    Hapus semua
                  </button>
                )}
              </div>

              {/* Active filter badges */}
              {hasFilters && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {q && (
                    <span className="flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      &ldquo;{q}&rdquo;
                      <button onClick={() => navigate({ q: '' })} className="ml-0.5 text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  )}
                  {activeOrgEntry && (
                    <span className="flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      <span className="line-clamp-1 max-w-[120px] capitalize">{activeOrgEntry.title}</span>
                      <button onClick={() => navigate({ org: undefined })} className="ml-0.5 shrink-0 text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  )}
                  {activeGroupEntry && (
                    <span className="flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      <span className="line-clamp-1 max-w-[120px] capitalize">{activeGroupEntry.title}</span>
                      <button onClick={() => navigate({ group: undefined })} className="ml-0.5 shrink-0 text-emerald-400 hover:text-emerald-700">×</button>
                    </span>
                  )}
                </div>
              )}

              {/* Org list */}
              <div className="mb-4">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Organisasi
                </p>
                <ul className="max-h-48 space-y-px overflow-y-auto">
                  {orgList.map((org) => {
                    const isActive = activeOrg === org.name
                    return (
                      <li key={org.name}>
                        <button
                          onClick={() => navigate({ org: isActive ? undefined : org.name })}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isActive ? 'bg-[#0c2445] font-semibold text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                          }`}
                        >
                          <span className="line-clamp-1 capitalize">{org.title}</span>
                          <span className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {org.count}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Group list */}
              {groupList.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Topik
                  </p>
                  <ul className="max-h-48 space-y-px overflow-y-auto">
                    {groupList.map((grp) => {
                      const isActive = activeGroup === grp.name
                      return (
                        <li key={grp.name}>
                          <button
                            onClick={() => navigate({ group: isActive ? undefined : grp.name })}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                              isActive ? 'bg-emerald-700 font-semibold text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                            }`}
                          >
                            <span className="line-clamp-1 capitalize">{grp.title}</span>
                            <span className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {grp.count}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0 flex-1">
            {/* Search form */}
            <form onSubmit={handleSearch} className="mb-5 flex gap-2">
              <input
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Cari dataset..."
                aria-label="Cari dataset"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0c2445] focus:outline-none focus:ring-2 focus:ring-[#0c2445]/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#0c2445] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#163666]"
              >
                Cari
              </button>
            </form>

            {/* Results info */}
            <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
              {filtered.length === 0
                ? 'Tidak ada dataset yang cocok.'
                : `Menampilkan ${startItem}–${endItem} dari ${filtered.length} dataset`}
            </p>

            {/* Cards */}
            {paged.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tidak ada dataset yang cocok</p>
                {hasFilters && (
                  <button onClick={clearAll} className="mt-2 text-xs text-blue-600 hover:underline">
                    Hapus semua filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {paged.map((ds) => (
                  <Link
                    key={`${ds.namespace}/${ds.slug}`}
                    href={datasetHref(ds)}
                    className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
                  >
                    <span className="inline-block self-start rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium capitalize text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {ds.namespace.replace(/-/g, ' ')}
                    </span>
                    <h2 className="mt-2.5 text-sm font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-400">
                      {ds.name}
                    </h2>
                    {ds.description && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2 dark:text-gray-400">
                        {ds.description}
                      </p>
                    )}
                    <div className="flex-1" />
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">Dataset</span>
                      <span className="text-[11px] font-medium text-blue-600">Lihat &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="order-2 text-xs text-gray-400 sm:order-1 dark:text-gray-500">
                  Halaman {safePage} dari {totalPages}
                </p>
                <nav className="order-1 flex items-center gap-1 sm:order-2" aria-label="Pagination">
                  <button
                    onClick={() => navigate({ page: String(safePage - 1) })}
                    disabled={safePage === 1}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    ← Prev
                  </button>
                  {buildPageNumbers(safePage, totalPages).map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 dark:text-gray-500">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => navigate({ page: String(p) })}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          p === safePage
                            ? 'border-[#0c2445] bg-[#0c2445] font-semibold text-white'
                            : 'border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => navigate({ page: String(safePage + 1) })}
                    disabled={safePage === totalPages}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Next →
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
