# Lanyard

Implementasi berada di `app/lanyard.tsx`, mengikuti pola rope joint dan spherical joint React Bits dari prompt yang diberikan pengguna, disesuaikan untuk Next.js dan TypeScript.

## Aset

- `public/lanyard/strap.png`: desain BINUS pengguna, ditampilkan sekali dengan `repeat={[-1, 1]}`. Nilai negatif mempertahankan arah tulisan pada kurva tali.
- `public/lanyard/front.png` dan `back.png`: desain pengguna, dipasang dengan perbandingan ukuran asli (cover).
- `public/lanyard/card.glb`: model kartu. Lisensi ada di folder yang sama.

Atlas kartu memakai ukuran tekstur asli model. Area di luar kedua sisi diisi warna holder gelap, lalu baris bawah gambar diperpanjang 8 piksel untuk mencegah filtering mengambil warna terang di luar UV gambar.

## Animasi

Saat setidaknya separuh Home kembali terlihat, posisi, rotasi, dan kecepatan benda fisika disiapkan ulang. Canvas dan aset tetap terpasang. Simulasi dijeda ketika About di luar layar, sehingga animasi jatuh terlihat ketika kembali ke lanyard. Preferensi reduced motion memakai kartu statis.

## Pemeriksaan regresi manual

1. Jalankan `npm run dev`, buka Home, lalu About. Pastikan kartu jatuh dan berhenti tergantung pada tali.
2. Pastikan hanya ada satu BINUS di tengah tali serta tidak ada garis putih pada bagian bawah kartu.
3. Kembali ke Home, tunggu scroll selesai, lalu buka About lagi. Animasi jatuh harus berulang tanpa memuat ulang GLB. Atribut `data-replay` pada `.lanyard-scene` bertambah ketika Home dikunjungi kembali.
4. Klik Balik kartu, kemudian Lihat depan. Tarik dan lepaskan kartu; tali harus tetap tersambung.
5. Dengan reduced motion aktif, kartu statis tetap bisa dibalik dan tidak menjalankan animasi jatuh.

Validasi 27 September 2026: production build dan pemeriksaan TypeScript berhasil; logo tunggal, tepi bawah, kontrol balik, dan penghitung replay diperiksa di browser. Tidak ada error console yang tercatat selama pemeriksaan. Fallback reduced motion diperiksa pada kode, belum dengan emulasi preferensi browser.
