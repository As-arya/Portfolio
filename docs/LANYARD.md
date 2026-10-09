# Lanyard

`app/lanyard-card.tsx` berisi source Three.js React Bits dari lampiran pengguna, dengan CSS di `app/lanyard-card.css`. Wrapper `app/lanyard.tsx` menghubungkannya dengan pilihan bahasa, kontrol kartu, dan fallback. Lisensi React Bits tetap ada di `public/lanyard/REACT-BITS-LICENSE.md`.

## Aset dan tampilan

- `public/lanyard/front.png` dan `back.png` dipasang langsung pada kedua sisi kartu dengan `imageFit="cover"`.
- `public/lanyard/strap.png` menjadi tekstur tali BINUS. Cetakan dipusatkan dengan ruang di sisi tali. UV mengikuti panjang dan lebar tali, sehingga proporsi huruf terjaga saat tali pendek, diregangkan, atau viewport berubah. Pemetaan dan repeat mengikuti [dokumentasi tekstur Three.js](https://threejs.org/manual/en/textures.html), diperiksa melalui Context7.
- Kartu, lubang gantungan, ring, dan penjepit dibuat secara prosedural; implementasi baru tidak memuat `card.glb`.
- Default situs memakai finish matte dengan roughness 0.85 dan clearcoat 0, tepi hitam, logam silver, ukuran kartu 0.52, panjang tali 0.32, damping 0.7, dan breeze 0.16. Warna dasar tali `#171c22` sama dengan latar aset BINUS, sehingga bidang gambar tidak membentuk kotak berbeda warna. Tepi mengikuti finish kartu agar tidak memantulkan lapisan glossy. Props tampilan lainnya dari source tetap tersedia.

## Interaksi

Kartu muncul dari samping saat About terlihat. Pengunjung dapat menarik, meregangkan, melepaskan, atau mengeklik kartu untuk membaliknya. Tidak ada panel kontrol di bawah kartu. Fokuskan area kartu dengan Tab, lalu tekan Enter atau Space untuk membaliknya; outline fokus hanya muncul saat memakai keyboard. Simulasi serta render berhenti ketika canvas di luar viewport atau tab tersembunyi. Geometri, material, tekstur, environment, observer, dan listener dibersihkan ketika komponen dilepas.

Intro dimainkan saat kartu pertama terlihat. Kembali ke About mempertahankan canvas dan sisi kartu, sehingga tidak ada reset mendadak. `.lanyard-scene` menyediakan `data-ready` untuk pemeriksaan browser. Reduced motion atau kegagalan WebGL memakai kartu statis dengan tepi hitam yang bisa dibalik lewat klik atau keyboard.

## Pemeriksaan

- `npx playwright test tests/lanyard-drag.spec.mjs --workers=1`: drag melewati frame, kembali setelah dilepas, flip, reduced motion, dan mobile.
- Tes browser memakai server pada `http://127.0.0.1:3000` secara default; `PORTFOLIO_TEST_URL` dapat diarahkan ke port preview lain.

Periksa juga logo BINUS, tepi kartu, kedua sisi gambar, serta scroll sentuh di luar kartu saat mengubah prop ukuran atau panjang tali.
