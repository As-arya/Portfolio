# Hasil pemeriksaan sebelum deploy

> Pembaruan keamanan 10 Oktober 2026: lihat [SECURITY_AUDIT.md](SECURITY_AUDIT.md) untuk record terbaru, status perbaikan, dan syarat deploy yang belum selesai. Kunci Turnstile tes sekarang ditolak pada runtime produksi, dan APP_ORIGIN wajib untuk mutasi produksi. Hasil di bawah adalah pemeriksaan sebelumnya, sebelum perubahan keamanan ini.

Pemeriksaan lokal pada 10 Oktober 2026. Konten awal dipulihkan; proyek, pesan Contact, dan empat aset Cloudinary sementara sudah dibersihkan. Tidak ada deploy atau perubahan kata sandi.

## Perubahan akun

- Primary dan backup memakai akun Firebase Email/Password yang sudah ada. Login Google dihapus.
- Primary membuka dashboard. Backup hanya untuk pemulihan akun utama.
- Pemulihan backup membuat tautan langsung di halaman, tanpa SMTP/Gmail. Respons tidak boleh di-cache. Selama 15 menit, permintaan berikutnya mengambil tautan yang sama dari dokumen `security/recovery` yang hanya dapat diakses backend, sehingga reload tidak menghilangkan akses. Kegagalan pembuatan menghapus pembatas sementara.
- Gmail opsional untuk notifikasi Contact. Pesan tetap tersimpan jika email gagal.

## Pemeriksaan yang lulus

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript dan build produksi | Lulus |
| Suite regresi aplikasi | 24 tes lulus |
| Pemulihan langsung | 5 tes tambahan lulus: tautan, batas peran, rate limit, rollback, dan pengambilan ulang tautan setelah reload |
| Backup asli | Login Email/Password membuka pemulihan; tautan reset Firebase dibuat tanpa Gmail dan dapat diambil setelah reload; membuka `/admin` dialihkan kembali ke pemulihan |
| Build produksi lokal | 6 tes akses admin, proyek/Contact, dan Certificates lulus |
| Firebase | Terhubung; kedua UID/email cocok, provider password aktif |
| Cloudinary | Kredensial valid, preset Signed terbaca |
| Education | PNG diunggah, disimpan, dan ditampilkan; judul materi Indonesia/Inggris dapat diedit dan tampil sesuai bahasa |
| Certificates | JPEG diunggah, disimpan, ditampilkan, dan diperbesar |
| Proyek | Sampul WebP dan gambar isi PNG diunggah; draft tersimpan dan halaman publiknya 404; publish dua bahasa berhasil |
| Validasi upload/publish | TXT dan file di atas 10 MB ditolak; publish isi dua bahasa yang belum lengkap ditolak |
| Penghapusan gambar | Logo/sertifikat tes dihapus melalui admin dan ketiadaannya diverifikasi di Cloudinary |
| Status kerja dan inbox | Status Hired tampil di situs; inbox dan ekspor CSV berfungsi |
| Contact | Turnstile tes diverifikasi oleh layanan asli; pesan tersimpan di Firestore saat SMTP tidak tersedia |
| Antarmuka | Desktop/mobile, bahasa, tema, animasi, dialog, dan lanyard lulus regresi |
| Pembatasan akses | Seluruh endpoint admin yang diuji menolak akses tanpa sesi; perubahan sesi lintas situs ditolak |
| Dokumen privat Firestore | Pembacaan publik `settings/public` dan `security/recovery` ditolak dengan 403 |

## Yang masih perlu diperhatikan

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` masih pasangan tes. Ganti dengan pasangan produksi untuk domain situs sebelum deploy.
- `BACKUP_GMAIL_ADDRESS` dan `BACKUP_GMAIL_APP_PASSWORD` masih kosong. Notifikasi email Contact belum diuji; penyimpanan Contact dan pemulihan backup tetap tersedia.
- Tambahkan domain deploy ke Authorized domains Firebase dan pengaturan Turnstile. Salin ENV ke platform deploy, lalu build dengan nilai publik yang benar.
- Penggantian kata sandi akhir dilakukan sendiri melalui formulir Firebase. Pemeriksaan tidak mengganti kredensial akun.
- Navigasi langsung ke JSON API melalui Brave diblokir browser. Pembatasan API sudah diperiksa oleh tes otomatis; navigasi dashboard menggunakan sesi backup asli juga telah diperiksa.

Panduan konfigurasi: [ENV_SETUP.md](ENV_SETUP.md).
