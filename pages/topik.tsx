import Head from 'next/head'
import Link from 'next/link'
import type { GetStaticProps } from 'next'
import { ckan, REVALIDATE, type CkanGroupCard } from '../lib/ckan'

export const getStaticProps: GetStaticProps<{ groups: CkanGroupCard[] }> = async () => {
  const groups = await ckan.groupList()
  const sorted = groups.sort((a, b) => b.packageCount - a.packageCount)
  return { props: { groups: sorted }, revalidate: REVALIDATE }
}

// Topic icon mapping for common group slugs
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

export default function TopikPage({ groups }: { groups: CkanGroupCard[] }) {
  const withData = groups.filter((g) => g.packageCount > 0)
  const empty = groups.filter((g) => g.packageCount === 0)

  return (
    <>
      <Head>
        <title>Topik — Satu Data Kota Singkawang</title>
      </Head>

      {/* Header band */}
      <div className="border-b border-gray-200 bg-white py-5 shadow-sm">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="mb-1 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span>Topik</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900">Topik</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {groups.length} topik tersedia — temukan dataset berdasarkan bidang
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Topics with data */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {withData.map((grp) => (
            <Link
              key={grp.name}
              href={`/search?group=${encodeURIComponent(grp.name)}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              {/* Icon or image */}
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

              <h2 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-emerald-700">
                {grp.title}
              </h2>
              {grp.description && (
                <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                  {grp.description}
                </p>
              )}

              <div className="flex-1" />
              <div className="mt-3 border-t border-gray-100 pt-2.5">
                <span className="text-[11px] font-medium text-emerald-600 group-hover:text-emerald-700">
                  Jelajahi &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Topics with no data */}
        {empty.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold text-gray-400">
              Belum ada dataset ({empty.length} topik)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {empty.map((grp) => (
                <div
                  key={grp.name}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xl">
                    {TOPIC_ICONS[grp.name] ?? '📂'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{grp.title}</p>
                    <p className="text-xs text-gray-400">0 dataset</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
