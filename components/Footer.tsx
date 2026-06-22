export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[#0c2445] py-10 text-white">
      <div className="mx-auto max-w-6xl px-4 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <img
            src="/logo-singkawang.png"
            alt="Lambang Kota Singkawang"
            className="h-14 w-14 object-contain flex-shrink-0"
          />
          <div>
            <p className="font-bold text-lg">Satu Data Kota Singkawang</p>
            <p className="text-sm text-white/60 mt-1">
              Portal data terbuka Pemerintah Kota Singkawang
            </p>
            <p className="text-xs text-white/40 mt-3">
              &copy; {year} Pemerintah Kota Singkawang. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>

        <div className="text-sm text-white/60 space-y-1">
          <p className="font-semibold text-white/80 mb-2">Tautan</p>
          <p>
            <a
              href="https://singkawangkota.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              singkawangkota.go.id
            </a>
          </p>
          <p>
            <a
              href="https://satudata.singkawangkota.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              satudata.singkawangkota.go.id
            </a>
          </p>
        </div>

        <div className="text-sm text-white/60 space-y-1">
          <p className="font-semibold text-white/80 mb-2">Alamat</p>
          <p>Pemerintah Kota Singkawang</p>
          <p>Kalimantan Barat, Indonesia</p>
        </div>
      </div>
    </footer>
  )
}
