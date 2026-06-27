import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { GetStaticPaths, GetStaticProps } from 'next'
import { ckan, ckanUrl, ORG_FILTER, GROUP_FILTER, MAX_DATASETS, REVALIDATE, type CkanOrgDetail, type CkanActivity } from '../../lib/ckan'

const Table = dynamic(
  () => import('../../components/Table').then((mod) => ({ default: mod.Table })),
  { ssr: false }
)

const Chart = dynamic(
  () => import('../../components/Chart').then((mod) => ({ default: mod.Chart })),
  { ssr: false }
)

// ── Types ──────────────────────────────────────────────────────────────────
type ResourceView = {
  id: string
  name: string
  format: string
  url: string
  description: string
  isTabular: boolean
}
type ExtraField = { key: string; value: string }
type GroupItem = { name: string; title: string; imageUrl: string; packageCount: number }
type ActivityItem = { timestamp: string; label: string }
type OrgInfo = {
  name: string
  title: string
  description: string
  imageUrl: string
  packageCount: number
  createdDate: string
}

type DatasetView = {
  slug: string
  namespace: string
  orgSlug: string
  title: string
  notes: string
  org: string
  isOpen: boolean
  license: string
  licenseUrl: string
  metadataCreated: string
  metadataModified: string
  tags: string[]
  extras: ExtraField[]
  resources: ResourceView[]
  groups: GroupItem[]
  activities: ActivityItem[]
  orgInfo: OrgInfo | null
}

// ── Helpers ────────────────────────────────────────────────────────────────
const TABULAR = ['csv', 'tsv']

function formatDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatBadgeClass(fmt: string): string {
  const f = fmt.toLowerCase()
  if (['csv', 'tsv'].includes(f)) return 'bg-green-100 text-green-700'
  if (['xlsx', 'xls'].includes(f)) return 'bg-emerald-100 text-emerald-700'
  if (['pdf'].includes(f)) return 'bg-red-100 text-red-700'
  if (['json', 'geojson'].includes(f)) return 'bg-yellow-100 text-yellow-700'
  if (['shp', 'kml', 'kmz'].includes(f)) return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

function activityLabel(type: string): string {
  if (type === 'new package') return 'Dataset dibuat'
  if (type === 'changed package') return 'Dataset diperbarui'
  if (type === 'deleted package') return 'Dataset dihapus'
  if (type === 'new resource') return 'Berkas ditambahkan'
  if (type === 'changed resource') return 'Berkas diperbarui'
  return type
}

// ── SSG ────────────────────────────────────────────────────────────────────
export const getStaticPaths: GetStaticPaths = async () => {
  const { datasets } = await ckan.packageSearch({
    offset: 0,
    limit: MAX_DATASETS,
    tags: [],
    orgs: ORG_FILTER,
    groups: GROUP_FILTER,
  })
  return {
    paths: datasets.map((d) => ({
      params: { owner: '@' + (d.organization?.name || 'dataset'), slug: d.name },
    })),
    // Datasets added after build render on first request, then cache.
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<{ dataset: DatasetView }> = async ({ params }) => {
  const namespace = String(params?.owner ?? '').replace(/^@/, '')
  const slug = String(params?.slug)
  try {
    const d = await ckan.getDatasetDetails(slug)
    const datasetId = d.id || slug

    // Parallel fetch: org details + activity stream + live group details.
    // The groups embedded in package_show carry a stale image snapshot, so we
    // fetch each group live (group_show) to render the current icon.
    const [orgDetail, rawActivities, liveGroups] = await Promise.all([
      ckan.getOrganizationDetails(d.organization?.name || ''),
      ckan.getDatasetActivity(datasetId),
      Promise.all((d.groups || []).map((g) => ckan.getGroupDetails(g.name))),
    ])
    const liveGroupMap = new Map(
      liveGroups.filter(Boolean).map((g) => [g!.name, g!])
    )

    // Activity fallback if API returns unauthorized
    const activities: ActivityItem[] =
      rawActivities.length > 0
        ? rawActivities.map((a: CkanActivity) => ({
            timestamp: a.timestamp,
            label: activityLabel(a.activity_type),
          }))
        : [
            ...(d.metadata_modified && d.metadata_modified !== d.metadata_created
              ? [{ timestamp: d.metadata_modified, label: 'Dataset diperbarui' }]
              : []),
            { timestamp: d.metadata_created || '', label: 'Dataset dibuat' },
          ]

    const orgInfo: OrgInfo | null = orgDetail
      ? {
          name: orgDetail.name,
          title: orgDetail.title,
          description: orgDetail.description || '',
          imageUrl: ckanUrl(orgDetail.image_display_url),
          packageCount: orgDetail.package_count || 0,
          createdDate: formatDate(orgDetail.created || ''),
        }
      : null

    const dataset: DatasetView = {
      slug: d.name,
      namespace,
      orgSlug: d.organization?.name || '',
      title: d.title || d.name,
      notes: d.notes || '',
      org: d.organization?.title || d.organization?.name || '',
      isOpen: d.isopen ?? false,
      license: d.license_title || '',
      licenseUrl: d.license_url || '',
      metadataCreated: formatDate(d.metadata_created || ''),
      metadataModified: formatDate(d.metadata_modified || ''),
      tags: (d.tags || []).map((t) => t.display_name),
      extras: (d.extras || []).filter((e) => e.value && e.key),
      resources: (d.resources || []).map((r) => {
        const fmt = (r.format || '').toLowerCase()
        return {
          id: r.id,
          name: r.name || r.id,
          format: r.format || '',
          url: ckanUrl(r.url),
          description: r.description || '',
          isTabular: TABULAR.includes(fmt),
        }
      }),
      groups: (d.groups || []).map((g) => {
        const live = liveGroupMap.get(g.name)
        return {
          name: g.name,
          title: live?.title ?? g.title,
          imageUrl: live ? live.imageUrl : ckanUrl(g.image_display_url),
          packageCount: live ? live.packageCount : (g.package_count || 0),
        }
      }),
      activities,
      orgInfo,
    }
    return { props: { dataset }, revalidate: REVALIDATE }
  } catch {
    return { notFound: true, revalidate: REVALIDATE }
  }
}

// ── Page Component ─────────────────────────────────────────────────────────
type Tab = 'dataset' | 'grup' | 'aktivitas'

export default function DatasetPage({ dataset }: { dataset: DatasetView }) {
  const [activeTab, setActiveTab] = useState<Tab>('dataset')
  const firstTabular = dataset.resources.find((r) => r.isTabular && r.url)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dataset', label: 'Dataset' },
    { id: 'grup', label: 'Grup' },
    { id: 'aktivitas', label: 'Aktivitas' },
  ]

  return (
    <>
      <Head>
        <title>{`${dataset.title} — Satu Data Kota Singkawang`}</title>
      </Head>

      {/* Page header band */}
      <div className="border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600">Beranda</Link>
            <span className="mx-1.5">/</span>
            <Link href="/search" className="hover:text-gray-600">Dataset</Link>
            <span className="mx-1.5">/</span>
            <span className="line-clamp-1 text-gray-600">{dataset.title}</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                dataset.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {dataset.isOpen ? 'Terbuka' : 'Tertutup'}
            </span>
            {dataset.org && (
              <Link
                href={`/search?org=${encodeURIComponent(dataset.orgSlug)}`}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {dataset.org}
              </Link>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{dataset.title}</h1>

          {dataset.notes && (
            <p className="mt-3 text-gray-600 leading-relaxed whitespace-pre-line">{dataset.notes}</p>
          )}

          {dataset.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dataset.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Org card */}
        {dataset.orgInfo && (
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {dataset.orgInfo.imageUrl ? (
              <img
                src={dataset.orgInfo.imageUrl}
                alt={dataset.orgInfo.title}
                className="h-12 w-12 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Diterbitkan oleh</p>
              <Link
                href={`/search?org=${encodeURIComponent(dataset.orgSlug)}`}
                className="text-sm font-semibold text-gray-900 hover:text-blue-700 transition-colors"
              >
                {dataset.orgInfo.title}
              </Link>
              {dataset.orgInfo.description && (
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{dataset.orgInfo.description}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-[#0c2445]">{dataset.orgInfo.packageCount}</p>
              <p className="text-[11px] text-gray-400">dataset</p>
            </div>
          </div>
        )}

        {/* Tab nav */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#0c2445] font-semibold text-[#0c2445]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab: Dataset ── */}
        {activeTab === 'dataset' && (
          <div className="mt-6">
            {/* Two-column: metadata + resources */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Informasi Dataset */}
              <aside className="lg:col-span-1">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">
                    Informasi Dataset
                  </h2>
                  <dl className="space-y-3">
                    <MetaRow label="Diterbitkan" value={dataset.metadataCreated} />
                    <MetaRow label="Diperbarui" value={dataset.metadataModified} />
                    {dataset.org && <MetaRow label="Organisasi" value={dataset.org} />}
                    {dataset.license && (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Lisensi</dt>
                        <dd className="mt-0.5 text-sm text-gray-800">
                          {dataset.licenseUrl ? (
                            <a href={dataset.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
                              {dataset.license}
                            </a>
                          ) : dataset.license}
                        </dd>
                      </div>
                    )}
                    <MetaRow label="Jumlah Berkas" value={`${dataset.resources.length} berkas`} />
                  </dl>
                </div>
              </aside>

              {/* Unduh Data */}
              <section className="lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">
                  Unduh Data
                </h2>
                {dataset.resources.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
                    <p>Dataset ini belum memiliki berkas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dataset.resources.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {r.format && (
                            <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase ${formatBadgeClass(r.format)}`}>
                              {r.format}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{r.name}</p>
                            {r.description && (
                              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{r.description}</p>
                            )}
                          </div>
                        </div>
                        {r.url && (
                          <a
                            href={r.url}
                            className="self-start shrink-0 rounded-lg bg-[#0c2445] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#163666] sm:self-auto"
                            download
                          >
                            ↓ Unduh
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ── Visualisasi (dataset-specific, gated by slug) ── */}
            {dataset.slug === 'indeks-toleransi-indeks-kota-toleran' &&
              dataset.resources.some((r) => r.format.toLowerCase() === 'csv') && (
              <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-gray-700">Visualisasi</h2>
                <p className="mb-4 text-xs text-gray-400">
                  Tren Indeks Toleransi Kota Singkawang tahun 2018–2023
                </p>
                <Chart
                  url={dataset.resources.find((r) => r.format.toLowerCase() === 'csv')!.url}
                  type="line"
                  height={320}
                  wideMode
                  labelColumn="Uraian"
                  seriesRows={[
                    { match: 'Indeks Toleransi (Indeks Kota Toleran)', label: 'Indeks Toleransi' },
                    { match: 'Indeks inklusivitas dalam RPJMD', label: 'Inklusivitas RPJMD' },
                    { match: 'Indeks kebijakan diskriminatif', label: 'Kebijakan Diskriminatif' },
                    { match: 'Indeks peristiwa intoleransi', label: 'Peristiwa Intoleransi' },
                  ]}
                />
              </section>
            )}

            {/* Pratinjau Data */}
            {firstTabular && (
              <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  Pratinjau Data
                </h2>
                <p className="mb-3 text-xs text-gray-400">
                  {firstTabular.name}
                  {firstTabular.format && (
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-bold uppercase ${formatBadgeClass(firstTabular.format)}`}>
                      {firstTabular.format}
                    </span>
                  )}
                </p>
                <Table url={firstTabular.url} />
              </section>
            )}

            {/* Informasi Tambahan */}
            {dataset.extras.length > 0 && (
              <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">
                  Informasi Tambahan
                </h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {dataset.extras.map((e) => (
                    <div key={e.key}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{e.key}</dt>
                      <dd className="mt-1 text-sm text-gray-700 leading-relaxed">{e.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        )}

        {/* ── Tab: Grup ── */}
        {activeTab === 'grup' && (
          <div className="mt-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Grup</h2>
            {dataset.groups.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
                <p className="text-base font-medium">Dataset ini tidak memiliki grup</p>
                <p className="mt-1 text-sm">
                  Dataset tidak tergabung dalam grup atau kategori manapun.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dataset.groups.map((g) => (
                  <div key={g.name} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                    {g.imageUrl && (
                      <img src={g.imageUrl} alt={g.title} className="h-10 w-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                      <p className="text-xs text-gray-400">{g.packageCount} dataset</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Aktivitas ── */}
        {activeTab === 'aktivitas' && (
          <div className="mt-6">
            <h2 className="mb-6 text-sm font-semibold text-gray-700">
              Riwayat Aktivitas
            </h2>
            {dataset.activities.length === 0 ? (
              <p className="text-sm text-gray-400">Tidak ada riwayat aktivitas tersedia.</p>
            ) : (
              <ol className="relative ml-3 space-y-6 border-l-2 border-gray-200">
                {dataset.activities.map((a, i) => (
                  <li key={i} className="relative ml-6">
                    <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0c2445] shadow-sm" />
                    <time className="mb-0.5 block text-xs text-gray-400">
                      {formatDate(a.timestamp)}
                    </time>
                    <p className="text-sm font-medium text-gray-800">{a.label}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </main>
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-800">{value}</dd>
    </div>
  )
}
