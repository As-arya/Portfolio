# Portfolio — Asarya Jachred Alotia

Portofolio frontend untuk Asarya Jachred Alotia, mahasiswa Computer Science BINUS University dengan peminatan Software Engineering. Situs berisi Home, About, Tech Stack, Projects, dan Contact, dengan pilihan tema terang/gelap serta bahasa Indonesia/Inggris.

## Menjalankan secara lokal

Gunakan Node.js 20.9 atau lebih baru dan npm. Dari folder `Portfolio`:

```bash
npm ci
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk memeriksa sebelum publikasi:

```bash
npm run check
npm run build
```

`npm run start` menjalankan hasil build pada port 3000. Jika port itu dipakai, hentikan proses lain atau jalankan `npm run start -- -p 3001`.

## Mengubah isi

- Ubah tautan sosial, daftar teknologi, dan data proyek di [`app/data.ts`](app/data.ts).
- Tambahkan entri ke array `projects` untuk mengisi daftar proyek. Tiga proyek pertama tampil di halaman; tombol **More projects** menampilkan seluruh daftar. Nama, gambar, ringkasan, dan tautan proyek yang masih kosong saat ini adalah placeholder dan perlu diganti sebelum portfolio dibagikan ke perekrut.
- Isi `image` proyek dengan path dari `public/`, misalnya `/images/project-1.webp`; isi `repository` dan `demo` jika tersedia.
- Foto Home ada di `public/images/hero.webp`. Foto dan stiker kartu ada di `public/lanyard/front.png` dan `back.png`. Desain tali BINUS ada di `public/lanyard/strap.png`.
- Lanyard interaktif ada di `app/lanyard.tsx`. Catatan aset dan pemeriksaan regresinya ada di [`docs/LANYARD.md`](docs/LANYARD.md).

Form Contact saat ini hanya pratinjau: tombol kirim menampilkan pesan di halaman dan tidak mengirim email. GitHub sudah diarahkan ke [As-arya](https://github.com/As-arya); Instagram dan LinkedIn menampilkan placeholder sampai alamatnya diisi pada `app/data.ts`.

## Teknologi dan kredit

Next.js, React, TypeScript, Motion, Three.js, React Three Fiber, dan React Three Rapier. Lanyard memakai pola komponen [React Bits](https://reactbits.dev/components/lanyard) yang disesuaikan untuk situs ini; ketentuan lisensinya disertakan di `public/lanyard/REACT-BITS-LICENSE.md`. Ikon teknologi dari Devicon serta font Manrope dan IBM Plex Mono memiliki berkas lisensi masing-masing di `public/`.

Foto potret dan desain kartu/tali adalah aset portfolio pribadi. Pastikan semua konten placeholder diganti dengan informasi proyek yang akurat sebelum dipublikasikan.
