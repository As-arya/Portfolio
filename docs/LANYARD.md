# Lanyard

Implementasi berada di `app/lanyard.tsx`, mengikuti pola rope joint dan spherical joint React Bits dari prompt yang diberikan pengguna, disesuaikan untuk Next.js dan TypeScript.

## Aset

- `public/lanyard/strap.png`: desain BINUS pengguna, ditampilkan sekali dengan `repeat={[-1, 1]}`. Nilai negatif mempertahankan arah tulisan pada kurva tali.
- `public/lanyard/front.png` dan `back.png`: desain pengguna, dipasang dengan perbandingan ukuran asli (cover).
- `public/lanyard/card.glb`: model kartu. Lisensi ada di folder yang sama.

Atlas kartu memakai ukuran tekstur asli model. Area di luar kedua sisi diisi warna holder gelap, lalu baris bawah gambar diperpanjang 8 piksel untuk mencegah filtering mengambil warna terang di luar UV gambar.

## Animasi

Reset hanya disiapkan ketika scroll sudah mencapai bagian paling atas (toleransi 2 px) dan seluruh canvas berada di luar viewport. Canvas dan aset tetap terpasang. Posisi awal kartu dan tali terlipat berada di atas kamera; gravitasi menjatuhkannya ketika About kembali terlihat. Pangkal tali juga berada di luar kamera, dengan transisi transparan di tepi atas canvas.

Kartu tetap berupa benda dinamis saat ditarik. Spherical joint sementara menghubungkan titik yang diklik ke pointer sehingga kartu bebas berputar. Saat dilepas, momentum dipertahankan; koreksi arah depan/belakang yang lembut baru aktif setelah 2,5 detik. Foto menggunakan material tanpa pencahayaan dan tanpa tone mapping untuk mempertahankan warna aset; klip logam tetap menerima cahaya. Preferensi reduced motion memakai kartu statis.

Jalankan `node tests/lanyard-motion.test.mjs` (Node.js 22.18+) untuk memeriksa batas reset dan geometri awal di luar frame.

## Pemeriksaan regresi manual

1. Jalankan `npm run dev`, buka Home, lalu About. Pastikan kartu jatuh dan berhenti tergantung pada tali.
2. Pastikan hanya ada satu BINUS di tengah tali serta tidak ada garis putih pada bagian bawah kartu.
3. Kembali ke Home, tunggu scroll selesai, lalu buka About lagi. Animasi jatuh harus berulang tanpa memuat ulang GLB. Atribut `data-replay` pada `.lanyard-scene` bertambah ketika Home dikunjungi kembali.
   Berhenti di tengah perjalanan ke Home: penghitung tidak boleh bertambah dan kartu tidak boleh berpindah posisi mendadak.
4. Klik Balik kartu, kemudian Lihat depan. Tarik dan lepaskan kartu; tali harus tetap tersambung.
   Tarik dari tepi kartu ke samping lalu lepaskan: kartu harus bisa berputar hingga sisi belakang terlihat sesaat.
5. Dengan reduced motion aktif, kartu statis tetap bisa dibalik dan tidak menjalankan animasi jatuh.

Validasi 27 September 2026: production build dan pemeriksaan TypeScript berhasil; logo tunggal, tepi bawah, kontrol balik, dan penghitung replay diperiksa di browser. Tidak ada error console yang tercatat selama pemeriksaan. Fallback reduced motion diperiksa pada kode, belum dengan emulasi preferensi browser.
