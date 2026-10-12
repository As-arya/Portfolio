# Lanyard

`app/lanyard-card.tsx` berisi source Three.js React Bits dari lampiran pengguna, dengan CSS di `app/lanyard-card.css`. Wrapper `app/lanyard.tsx` menghubungkannya dengan pilihan bahasa, kontrol kartu, dan fallback. Lisensi React Bits tetap ada di `public/lanyard/REACT-BITS-LICENSE.md`.

## Aset dan tampilan

- `public/lanyard/front.webp` dan `back.webp` dipasang langsung pada kedua sisi kartu dengan `imageFit="cover"`. Versi WebP lossless berasal dari PNG dan memiliki piksel decode yang sama.
- `public/lanyard/strap.webp` menjadi tekstur tali BINUS. Cetakan dipusatkan dengan ruang di sisi tali. UV mengikuti panjang dan lebar tali, sehingga proporsi huruf terjaga saat tali pendek, diregangkan, atau viewport berubah. Pemetaan dan repeat mengikuti [dokumentasi tekstur Three.js](https://threejs.org/manual/en/textures.html), diperiksa melalui Context7.
- Kartu, lubang gantungan, ring, dan penjepit dibuat secara prosedural; implementasi baru tidak memuat `card.glb`.
- Default situs memakai finish matte dengan roughness 0.85 dan clearcoat 0, tepi hitam, logam silver, ukuran kartu 0.52, panjang tali 0.32, damping 0.7, dan breeze 0.16. Warna dasar tali `#171c22` sama dengan latar aset BINUS, sehingga bidang gambar tidak membentuk kotak berbeda warna. Tepi mengikuti finish kartu agar tidak memantulkan lapisan glossy. Props tampilan lainnya dari source tetap tersedia.

## Interaksi

Gambar kartu tampil sejak HTML awal tersedia, kemudian digantikan kartu 3D pada posisi tergantung setelah tekstur dan shader siap. Pengunjung dapat menarik, meregangkan, melepaskan, atau mengeklik kartu untuk membaliknya. Tidak ada panel kontrol di bawah kartu. Fokuskan area kartu dengan Tab, lalu tekan Enter atau Space untuk membaliknya; outline fokus hanya muncul saat memakai keyboard. Simulasi serta render berhenti ketika canvas di luar viewport atau tab tersembunyi. Geometri, material, tekstur, environment, observer, dan listener dibersihkan ketika komponen dilepas.

Default situs memakai `intro={false}` agar pergantian dari gambar ke 3D tidak membuat kartu menghilang ke luar frame; prop intro tetap tersedia. Kembali ke About mempertahankan canvas dan sisi kartu, sehingga tidak ada reset mendadak. `.lanyard-scene` menyediakan `data-ready` untuk pemeriksaan browser. Reduced motion, kegagalan WebGL, atau kegagalan tekstur memakai kartu statis dengan tepi hitam yang bisa dibalik lewat klik atau keyboard.

## Loading (13 Oktober 2026)

- Wrapper ringan dirender server; hanya renderer Three.js yang diimpor melalui `next/dynamic` dengan `ssr: false`. Gambar depan dipreload dan memakai URL aset yang sama dengan tekstur 3D.
- Canvas disembunyikan dan gambar kartu tetap terlihat sampai seluruh tekstur yang diminta tersedia, `compileAsync` selesai, dan frame pertama sudah dirender. Animasi tidak berjalan sebelum tekstur siap.
- Gambar gagal atau belum selesai setelah 15 detik tidak dianggap siap; renderer kembali ke gambar kartu. Callback dari renderer yang sudah dilepas diabaikan.
- Total aset turun dari **1.054.298 byte** menjadi **481.386 byte** (54% lebih kecil). Perbandingan buffer RGBA memastikan gambar depan, belakang, dan tali tidak berubah.
- Alur ini mengikuti [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading), [preload gambar](https://nextjs.org/docs/app/api-reference/components/image#preload), dan [Three.js compileAsync](https://github.com/mrdoob/three.js/blob/dev/docs/pages/WebGLRenderer.html), diperiksa melalui Context7 serta dokumentasi/implementasi paket terpasang.

## Pemeriksaan

- `npx playwright test tests/lanyard-drag.spec.mjs --workers=1`: drag melewati frame, kembali setelah dilepas, flip, reduced motion, dan mobile.
- `npx playwright test tests/lanyard-loading.spec.mjs --workers=1`: gambar sebelum JavaScript, tekstur lambat, isi kartu pada frame 3D pertama, dan tekstur gagal.
- Tes browser memakai server pada `http://127.0.0.1:3000` secara default; `PORTFOLIO_TEST_URL` dapat diarahkan ke port preview lain.

Periksa juga logo BINUS, tepi kartu, kedua sisi gambar, serta scroll sentuh di luar kartu saat mengubah prop ukuran atau panjang tali.
