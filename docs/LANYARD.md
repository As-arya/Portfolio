# Lanyard

`app/lanyard-card.tsx` berisi source Three.js React Bits dari lampiran pengguna, dengan CSS di `app/lanyard-card.css`. Wrapper `app/lanyard.tsx` menghubungkannya dengan pilihan bahasa, kontrol kartu, dan fallback. Lisensi React Bits tetap ada di `public/lanyard/REACT-BITS-LICENSE.md`.

## Aset dan tampilan

- `public/lanyard/front.webp` dan `back.webp` dipasang langsung pada kedua sisi kartu dengan `imageFit="cover"`. Versi WebP lossless berasal dari PNG dan memiliki piksel decode yang sama.
- `public/lanyard/strap.webp` menjadi tekstur tali BINUS. Cetakan dipusatkan dengan ruang di sisi tali. UV mengikuti panjang dan lebar tali, sehingga proporsi huruf terjaga saat tali pendek, diregangkan, atau viewport berubah. Pemetaan dan repeat mengikuti [dokumentasi tekstur Three.js](https://threejs.org/manual/en/textures.html), diperiksa melalui Context7.
- Kartu, lubang gantungan, ring, dan penjepit dibuat secara prosedural; implementasi baru tidak memuat `card.glb`.
- Default situs memakai finish matte dengan roughness 0.85 dan clearcoat 0, tepi hitam, logam silver, ukuran kartu 0.52, panjang tali 0.32, damping 0.7, dan breeze 0.16. Warna dasar tali `#171c22` sama dengan latar aset BINUS, sehingga bidang gambar tidak membentuk kotak berbeda warna. Tepi mengikuti finish kartu agar tidak memantulkan lapisan glossy. Props tampilan lainnya dari source tetap tersedia.

## Interaksi

Gambar kartu tampil sejak HTML awal tersedia, kemudian digantikan animasi kartu 3D setelah tekstur dan shader siap. Pengunjung dapat menarik, meregangkan, melepaskan, atau mengeklik kartu untuk membaliknya. Tidak ada panel kontrol di bawah kartu. Fokuskan area kartu dengan Tab, lalu tekan Enter atau Space untuk membaliknya; outline fokus hanya muncul saat memakai keyboard. Simulasi serta render berhenti ketika canvas di luar viewport atau tab tersembunyi. Geometri, material, tekstur, environment, observer, dan listener dibersihkan ketika komponen dilepas.

Default situs memakai `intro={true}` dengan pose awal asli: tali horizontal dan kartu miring 90 derajat, kemudian jatuh/berayun ke posisi tengah. GPU dipersiapkan pada pose menggantung di balik gambar loading; intro baru dimulai setelah pergantian ke canvas. Ketika lanyard kembali masuk viewport pada About, intro diputar ulang dengan canvas dan tekstur yang sama. Target sisi depan/belakang tetap dipertahankan. `.lanyard-scene` menyediakan `data-ready` untuk pemeriksaan browser. Reduced motion, kegagalan WebGL, atau kegagalan tekstur memakai kartu statis dengan tepi hitam yang bisa dibalik lewat klik atau keyboard.

## Loading (13 Oktober 2026)

- Wrapper ringan dirender server; hanya renderer Three.js yang diimpor melalui `next/dynamic` dengan `ssr: false`. Gambar depan dipreload dan memakai URL aset yang sama dengan tekstur 3D.
- Thumbnail depan/belakang 64px ditanam pada HTML melalui `app/lanyard-previews.ts` (total module 4.106 byte), sehingga kunjungan tanpa cache atau JavaScript tetap memperlihatkan foto ketika aset depan masih diunduh. Gambar depan yang gagal beralih ke thumbnail tersebut. Perbarui kedua thumbnail saat mengganti aset kartu.
- Canvas disembunyikan dan gambar kartu tetap terlihat sampai seluruh gambar selesai `decode()`, tekstur diunggah lewat `initTexture()`, `compileAsync` selesai, dan satu frame sudah dirender pada pose menggantung. Buffer frame dipertahankan saat pergantian; status ready diterapkan sinkron sebelum memulai intro. Animasi tidak berjalan sebelum tahap ini selesai.
- Gambar gagal atau belum selesai setelah 15 detik tidak dianggap siap; renderer kembali ke gambar kartu. Callback dari renderer yang sudah dilepas diabaikan.
- Total aset turun dari **1.054.298 byte** menjadi **481.386 byte** (54% lebih kecil). Perbandingan buffer RGBA memastikan gambar depan, belakang, dan tali tidak berubah.
- Alur ini mengikuti [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading), [preload gambar](https://nextjs.org/docs/app/api-reference/components/image#preload), dan [Three.js initTexture/compileAsync serta preserveDrawingBuffer](https://threejs.org/docs/pages/WebGLRenderer.html), diperiksa melalui Context7 serta dokumentasi/implementasi paket terpasang.

## Pemeriksaan

- `npx playwright test tests/lanyard-drag.spec.mjs --workers=1`: drag melewati frame, kembali setelah dilepas, flip, reduced motion, dan mobile.
- `npx playwright test tests/lanyard-loading.spec.mjs --workers=1`: foto pada cache kosong ketika gambar depan ditahan dan JavaScript mati, fallback gambar depan gagal, decode tertunda, tekstur lambat/gagal, foto setelah intro, serta gerakan masuk asli dan replay tanpa unduhan tekstur/remount canvas pada desktop/mobile.
- Tes browser memakai server pada `http://127.0.0.1:3000` secara default; `PORTFOLIO_TEST_URL` dapat diarahkan ke port preview lain.

Periksa juga logo BINUS, tepi kartu, kedua sisi gambar, serta scroll sentuh di luar kartu saat mengubah prop ukuran atau panjang tali.
