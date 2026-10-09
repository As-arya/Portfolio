# Portfolio — Asarya Jachred Alotia

Portofolio Next.js untuk Asarya Jachred Alotia dengan pilihan tema terang/gelap, bahasa Indonesia/Inggris, detail proyek, dan admin pribadi. Backend memakai Firebase, Cloudinary, Gmail, dan Turnstile. Panduan pengisian setiap variabel ENV ada di [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md); panduan menjalankan backend ada di [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md).

Langkah menghubungkan Gmail untuk notifikasi Contact tersedia di [`docs/GMAIL_SETUP.md`](docs/GMAIL_SETUP.md), termasuk pembuatan App Password, konfigurasi ENV, pengujian, dan perbedaannya dengan email reset Firebase.

Folder repository yang diunggah adalah **Portfolio**, dengan `package.json` di root repository. Panduan pengunggahan dan file lokal yang dikecualikan tersedia di [`docs/GITHUB_UPLOAD.md`](docs/GITHUB_UPLOAD.md).

## Menjalankan secara lokal

Gunakan Node.js 24 dan npm. Dari folder `Portfolio`:

```bash
npm ci
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk memeriksa sebelum publikasi:

```bash
npm run check
npm run build
```

Audit keamanan dan record perbaikan ada di [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md). Sebelum deploy publik, isi `APP_ORIGIN` dengan origin HTTPS domain final, ganti kedua kunci Turnstile tes dengan pasangan produksi, lalu jalankan `npm run check:deploy`, `npm audit`, dan `npm run test:security`. Tes HTTP keamanan pada server produksi/staging tersedia melalui `npm run test:security:http` (`PORTFOLIO_TEST_URL` menentukan target). Contact pada produksi menolak kunci CAPTCHA tes dan membatasi 3 pesan per email / 30 total per 15 menit.

Cek regresi penentuan section navbar dengan `node tests/navigation.test.mjs` (Node.js 22.18+).

`npm run start` menjalankan hasil build pada port 3000. Jika port itu dipakai, hentikan proses lain atau jalankan `npm run start -- -p 3001`.

## Mengubah isi

- Ubah tautan sosial dan daftar teknologi di [`app/data.ts`](app/data.ts). Tiga entri proyek di berkas itu adalah contoh yang dapat disalin sekali ke Firestore dengan `npm run seed`.
- Setelah Firebase dikonfigurasi, kelola proyek, foto, isi dua bahasa, dan status kerja dari `/admin/login`.
- Akun primary dan backup masuk melalui formulir email/kata sandi yang sama. Primary mengelola konten; backup hanya membuka pemulihan akun utama. Di halaman backup, buat tautan lalu buka tombol reset langsung tanpa Gmail. Gmail di ENV hanya diperlukan jika ingin notifikasi Contact melalui email.
- Kelola sekolah/universitas dari tab **Education** di admin: institusi, logo opsional, program Indonesia/English, tahun mulai–selesai atau **Sekarang**, deskripsi, serta mata pelajaran/mata kuliah opsional. Judul bagian materi dapat diubah per bahasa. Logo memakai upload JPEG/PNG/WebP maksimal 10 MB. Urutan dapat diubah; simpan untuk menampilkan perubahan di situs.
- Bagian **Certificates** pada halaman utama (`/#certificates`) menampilkan gambar sertifikat yang dapat diperbesar, judul, dan deskripsi. Kelola dari tab **Certificates** di admin, termasuk upload JPEG/PNG/WebP maksimal 10 MB, isi dua bahasa, urutan, dan hapus.
- Data contoh Education dan Certificates tersedia di `app/sample-content.ts`; gambar sertifikat contoh ada di `public/certificates/`. Data contoh muncul ketika field konten belum dibuat, sehingga tampilan dapat dilihat tanpa seed atau menimpa data yang sudah ada. Ganti melalui admin lalu simpan. Menghapus semua entri dan menyimpan membuat halaman kosong; contoh tidak muncul kembali.
- Pada editor proyek, pilih **Stack proyek** dari teknologi yang sudah tersedia atau tambahkan tag kustom. Teknologi yang dikenali memakai ikon yang sama dengan bagian Technology; tag lainnya tampil sebagai teks. Tag muncul di bawah detail proyek dan pada pratinjau admin.
- Halaman utama dimulai dari **About**, termasuk indikator status kerja yang dapat diubah dari admin. Foto dan stiker kartu ada di `public/lanyard/front.png` dan `back.png`. Desain tali BINUS ada di `public/lanyard/strap.png`.
- Lanyard interaktif ada di `app/lanyard.tsx`. Catatan aset dan pemeriksaan regresinya ada di [`docs/LANYARD.md`](docs/LANYARD.md).

Form Contact menyimpan pesan di Firestore dan mengirim notifikasi email setelah layanan dikonfigurasi. Tanpa kredensial, formulir akan menampilkan kegagalan pengiriman. GitHub sudah diarahkan ke [As-arya](https://github.com/As-arya).

## Teknologi dan kredit

Next.js, React, TypeScript, Motion, dan Three.js. Lanyard memakai source komponen [React Bits](https://reactbits.dev/components/lanyard) yang disesuaikan untuk situs ini; ketentuan lisensinya disertakan di `public/lanyard/REACT-BITS-LICENSE.md`. Ikon teknologi dari Devicon serta font Manrope dan IBM Plex Mono memiliki berkas lisensi masing-masing di `public/`.

Foto potret dan desain kartu/tali adalah aset portfolio pribadi. Pastikan semua konten placeholder diganti dengan informasi proyek yang akurat sebelum dipublikasikan.
