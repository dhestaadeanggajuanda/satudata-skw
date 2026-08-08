import Head from 'next/head'
import Link from 'next/link'
import { ShieldCheckIcon, LockClosedIcon, ServerStackIcon } from '@heroicons/react/24/outline'

const HIGHLIGHTS = [
  {
    icon: LockClosedIcon,
    title: 'Data pribadi tidak dipublikasikan',
    body: 'Data pribadi pengguna/subjek data, baik yang bersifat spesifik maupun umum, tidak dipublikasikan secara terbuka.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Pembatasan hak akses',
    body: 'Portal menerapkan pembatasan hak akses berbasis kewenangan sehingga data hanya dapat diakses oleh pihak yang berhak.',
  },
  {
    icon: ServerStackIcon,
    title: 'Pencadangan berkala',
    body: 'Pencadangan (backup) data dilakukan secara berkala untuk menjamin integritas dan keamanan informasi.',
  },
]

export default function KebijakanPrivasiPage() {
  return (
    <>
      <Head>
        <title>Kebijakan Privasi — Satu Data Kota Singkawang</title>
        <meta
          name="description"
          content="Kebijakan privasi Portal Satu Data Kota Singkawang: perlindungan data pribadi dan konfidensialitas."
        />
      </Head>

      {/* Header band */}
      <div className="border-b border-gray-200 bg-white py-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="mb-1 text-xs text-gray-400 dark:text-gray-500">
            <Link href="/" className="hover:text-gray-600">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span>Kebijakan Privasi</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kebijakan Privasi</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Perlindungan data pribadi &amp; konfidensialitas pada Portal Satu Data Kota Singkawang
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Perlindungan Data Pribadi &amp; Konfidensialitas
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <p>
              Pemerintah Kota Singkawang berkomitmen menjaga kerahasiaan dan keamanan data pribadi
              sesuai Buku Pedoman Penyelenggaraan Statistik Kota Singkawang dan Peraturan
              Perundang-undangan.
            </p>
            <p>
              Data pribadi pengguna/subjek data (baik data bersifat spesifik maupun umum) tidak
              dipublikasikan secara terbuka. Portal Satu Data Kota Singkawang menerapkan pembatasan
              hak akses berbasis kewenangan serta melakukan pencadangan (backup) data secara berkala
              untuk menjamin integritas dan keamanan informasi.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
