# Panduan Deploy — Satu Data Kota Singkawang

Arsitektur: **browser → nginx (TLS, CSP) → container Next.js (:3000) → CKAN (jaringan internal)**.
Berita Media Center diambil langsung oleh browser pengunjung, bukan oleh server.

## 0. Prasyarat

- Server Linux dengan Docker + Docker Compose v2 dan nginx (≥ 1.25 untuk `http2 on;`;
  versi lebih lama: ganti dengan `listen 443 ssl http2;`).
- Sertifikat TLS untuk domain portal.
- Dari server, CKAN dapat dijangkau (di sini lewat IP internal `172.16.20.229:5000`).
  Server berada di belakang NAT tanpa hairpin, jadi **jangan** memakai IP/domain publiknya
  sendiri untuk `DMS`.
- Port 3000 hanya boleh diakses nginx (firewall / bind ke 127.0.0.1, lihat bagian 6).

## 1. Ambil kode

```bash
git clone https://github.com/dhestaadeanggajuanda/satudata-skw.git
cd satudata-skw
```

Update berikutnya: `git pull`.

## 2. Isi variabel lingkungan

```bash
cp .env.production.example .env
nano .env
```

| Variabel | Fungsi |
|---|---|
| `DMS` | Alamat CKAN yang dipanggil server (IP internal). |
| `CKAN_PUBLIC_URL` | Host publik CKAN untuk URL unduhan/gambar di browser. |
| `SITE_URL` | Domain portal, dipakai katalog DCAT. |
| `NEXT_PUBLIC_MEDIACENTER_URL` / `_QUERY` | Sumber dan kata kunci berita. |
| `NEXT_PUBLIC_AGENT_URL` | Halaman Agent Satu Data (https) untuk iframe widget. |
| `REVALIDATE_SECONDS` | Interval regenerasi halaman (default 300). |

> Variabel `NEXT_PUBLIC_*` di-inline ke bundle browser **saat build**. Mengubahnya
> berarti harus build ulang (bagian 4), bukan sekadar restart.

## 3. Pasang nginx (CSP + reverse proxy)

```bash
sudo cp deploy/nginx/security-headers.conf /etc/nginx/snippets/satudata-security-headers.conf
sudo cp deploy/nginx/satudata.conf         /etc/nginx/conf.d/satudata.conf
```

Lalu edit:

1. `/etc/nginx/snippets/satudata-security-headers.conf`: ganti `AGENT_HOST` dengan host
   Agent Satu Data. Jika widget tidak dipakai, ganti `frame-src https://AGENT_HOST`
   menjadi `frame-src 'none'`.
2. `/etc/nginx/conf.d/satudata.conf`: sesuaikan `server_name` dan path sertifikat
   (`ssl_certificate`, `ssl_certificate_key`).

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Jangan lewati CSP: tanpa `mediacenter.singkawangkota.go.id` di `connect-src` dan
`img-src`, browser memblokir berita dan halaman `/berita` menampilkan "Berita gagal dimuat".

## 4. Build dan jalankan

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=50 portal
```

Build mengambil data dari CKAN (± 400 halaman, sekitar 1–3 menit). Jika build gagal
menjangkau CKAN, periksa `DMS` di `.env` dan konektivitas server ke host tersebut.

## 5. Verifikasi

```bash
# Aplikasi hidup
curl -I https://satudata.singkawangkota.go.id/

# Header keamanan: harus tepat satu CSP, memuat mediacenter
curl -sI https://satudata.singkawangkota.go.id/ | grep -i -E "content-security-policy|strict-transport|x-frame"

# Proxy resource menolak host di luar CKAN (harus 403)
curl -s -o /dev/null -w "%{http_code}\n" "https://satudata.singkawangkota.go.id/api/resource?url=https://example.com/dataset/x"
```

Di browser (hard refresh Ctrl+Shift+R):

- Beranda: section **Berita** muncul; `/berita` menampilkan 8 berita per halaman.
- DevTools → Console: tidak ada error `Refused to connect` / `Refused to load the image`.
  Jika ada, host yang disebut belum ada di CSP.
- Widget aksesibilitas di kiri bawah, widget Agent di kanan bawah dan panelnya terbuka.

## 6. Pengerasan yang disarankan

- Batasi port 3000 ke localhost: di `docker-compose.yml` ubah
  `"3000:3000"` menjadi `"127.0.0.1:3000:3000"`.
- Aktifkan pembaruan keamanan OS dan jalankan `npm audit` secara berkala di repo.
- Pantau masa berlaku sertifikat TLS.

## 7. Update dan rollback

```bash
git pull
docker compose up -d --build          # update

# Rollback: kembali ke commit sebelumnya lalu build ulang
git log --oneline -5
git checkout <hash-sebelumnya>
docker compose up -d --build
```

Image lama tidak otomatis disimpan. Beri tag sebelum update jika butuh rollback cepat:
`docker tag satudata-skw:latest satudata-skw:sebelum-update`.

## 8. Pemecahan masalah

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Berita kosong / "gagal dimuat" | CSP tidak memuat host Media Center, atau Media Center lambat (respons pertama bisa > 15 dtk; batas waktu kini 30 dtk) | Periksa CSP (bagian 3) dan Console browser |
| Gambar berita tidak tampil | `img-src` tanpa host Media Center | Tambahkan ke CSP |
| Panel Agent kosong / diblokir | `frame-src` belum berisi host agent, atau `NEXT_PUBLIC_AGENT_URL` kosong | Isi keduanya, build ulang |
| Panel Agent: "belum dikonfigurasi" | `NEXT_PUBLIC_AGENT_URL` kosong saat build | Isi `.env`, `docker compose up -d --build` |
| Build gagal `ETIMEDOUT` ke CKAN | `DMS` memakai IP/domain publik server sendiri (tanpa hairpin NAT) | Pakai IP internal CKAN |
| Dua header CSP muncul | `proxy_hide_header` hilang dari `satudata.conf` | Pulihkan dari `deploy/nginx/` |
| Perubahan `NEXT_PUBLIC_*` tak berefek | Nilai di-bake saat build | `docker compose up -d --build` |
