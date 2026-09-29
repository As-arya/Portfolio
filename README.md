# Portfolio — Asarya Jachred Alotia

Portofolio Next.js untuk Asarya Jachred Alotia dengan pilihan tema terang/gelap, bahasa Indonesia/Inggris, detail proyek, dan admin pribadi. Backend memakai Firebase, Cloudinary, Gmail, dan Turnstile. Panduan konfigurasi lengkap ada di [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md).

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

Cek regresi penentuan section navbar dengan `node tests/navigation.test.mjs` (Node.js 22.18+).

`npm run start` menjalankan hasil build pada port 3000. Jika port itu dipakai, hentikan proses lain atau jalankan `npm run start -- -p 3001`.

## Mengubah isi

- Ubah tautan sosial dan daftar teknologi di [`app/data.ts`](app/data.ts). Tiga entri proyek di berkas itu adalah contoh yang dapat disalin sekali ke Firestore dengan `npm run seed`.
- Setelah Firebase dikonfigurasi, kelola proyek, foto, isi dua bahasa, dan status kerja dari `/admin/login`.
- Foto Home ada di `public/images/hero.webp`. Foto dan stiker kartu ada di `public/lanyard/front.png` dan `back.png`. Desain tali BINUS ada di `public/lanyard/strap.png`.
- Lanyard interaktif ada di `app/lanyard.tsx`. Catatan aset dan pemeriksaan regresinya ada di [`docs/LANYARD.md`](docs/LANYARD.md).

Form Contact menyimpan pesan di Firestore dan mengirim notifikasi email setelah layanan dikonfigurasi. Tanpa kredensial, formulir akan menampilkan kegagalan pengiriman. GitHub sudah diarahkan ke [As-arya](https://github.com/As-arya).

## Teknologi dan kredit

Next.js, React, TypeScript, Motion, Three.js, React Three Fiber, dan React Three Rapier. Lanyard memakai pola komponen [React Bits](https://reactbits.dev/components/lanyard) yang disesuaikan untuk situs ini; ketentuan lisensinya disertakan di `public/lanyard/REACT-BITS-LICENSE.md`. Ikon teknologi dari Devicon serta font Manrope dan IBM Plex Mono memiliki berkas lisensi masing-masing di `public/`.

Foto potret dan desain kartu/tali adalah aset portfolio pribadi. Pastikan semua konten placeholder diganti dengan informasi proyek yang akurat sebelum dipublikasikan.
