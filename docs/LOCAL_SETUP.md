# Menjalankan backend dan admin secara lokal

Untuk sumber nilai setiap variabel, urutan pendaftaran akun, dan troubleshooting, ikuti [`ENV_SETUP.md`](ENV_SETUP.md). Lengkapi `.env.local` yang sudah ada tanpa menimpanya.

Fitur admin dan Contact membutuhkan Firebase dan Cloudinary. Gmail bersifat opsional untuk notifikasi Contact; pemulihan akun backup menampilkan tautan langsung. Turnstile dapat memakai kunci tes resmi selama pengembangan. Tidak ada langkah deploy dalam panduan ini.

## 1. Siapkan berkas environment

Gunakan Node.js 24. Dari folder `Portfolio`, jalankan `npm ci`, lalu salin `.env.example` menjadi `.env.local`. Isi nilai yang kosong sesuai langkah di bawah. Berkas `.env.local` sudah diabaikan oleh Git; jangan memasukkan service account JSON atau sandi aplikasi ke repo.

## 2. Firebase Spark

1. Buat project di [Firebase Console](https://console.firebase.google.com/) dengan paket Spark. Tambahkan Web app dan isi empat nilai `NEXT_PUBLIC_FIREBASE_*` dari konfigurasi aplikasinya.
2. Di Authentication, aktifkan **Email/Password**. Tambahkan `127.0.0.1` dan `localhost` ke Authorized domains; project baru tidak selalu menyertakan localhost. [Panduan Firebase](https://firebase.google.com/docs/auth/faq-and-troubleshooting)
3. Di Firestore Database, buat database. Salin isi `firestore.rules` ke tab Rules lalu publish rules tersebut. Browser ditolak membaca atau menulis Firestore; hanya backend dengan service account yang mengaksesnya.
4. Di Project settings > Service accounts, buat private key Admin SDK. Isi `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, dan `FIREBASE_PRIVATE_KEY` dari JSON tersebut. Pada `.env.local`, jadikan private key satu baris dengan `\n` untuk setiap baris baru. [Panduan Admin SDK](https://firebase.google.com/docs/admin/setup)
5. Di Authentication > Users, gunakan akun Email/Password utama yang sudah ada. Salin UID ke `PRIMARY_ADMIN_UID`, dan alamat email ke `PRIMARY_ADMIN_EMAIL` serta `NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL`.
6. Gunakan akun Email/Password cadangan yang sudah ada. Salin UID ke `BACKUP_ADMIN_UID` dan email ke `BACKUP_ADMIN_EMAIL`, lalu mulai ulang server. Kedua akun masuk melalui formulir `/admin/login` yang sama; akun cadangan hanya dapat membuka `/admin/recovery`.

## 3. Cloudinary dan Gmail

1. Buat akun [Cloudinary](https://console.cloudinary.com/) dengan mode **Dynamic folders**. Buat *signed upload preset* yang hanya mengizinkan JPG, PNG, WebP. Batas 10 MB diperiksa oleh aplikasi; preset tidak menyediakan batas ukuran per preset. Isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, dan `CLOUDINARY_UPLOAD_PRESET`. [Dokumentasi preset](https://cloudinary.com/documentation/upload_presets)
2. Jika membutuhkan notifikasi Contact melalui email, pada Gmail pengirim aktifkan Verifikasi 2 Langkah dan buat [App Password](https://support.google.com/accounts/answer/185833?hl=id). Isi `BACKUP_GMAIL_ADDRESS` dan `BACKUP_GMAIL_APP_PASSWORD`. Backend memakai akun ini untuk mengirim notifikasi Contact ke email utama. Pemulihan backup tidak memerlukan Gmail. Jangan gunakan sandi login Google biasa.

## 4. Turnstile lokal

Isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` dan `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` untuk pengujian lokal. Ini adalah [kunci tes resmi](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) dan tidak memerlukan akun Cloudflare. Saat situs nanti dipublikasikan, ganti keduanya dengan kunci widget sungguhan.

## 5. Jalankan dan cek

Jalankan `npm run seed` satu kali setelah Firebase aktif untuk menyalin tiga proyek contoh. Perintah seed hanya membuat data yang belum ada. Lalu jalankan `npm run dev` dan buka `http://127.0.0.1:3000` serta `/admin/login`.

Jalankan `npm run check` dan `npm run build`. Dengan `npm run dev` aktif, jalankan `npx playwright test` di terminal lain. Uji status kerja, proyek dua bahasa dan foto, draft lalu publish, Contact, reset sandi ke email utama, serta pemulihan melalui email dan kata sandi cadangan. Setelah login backup, pilih **Buat tautan reset** dan pastikan tombol **Reset kata sandi akun utama** muncul tanpa mengirim email. Jangan menyebarkan tautan reset. Untuk menguji email gagal, kosongkan sementara `BACKUP_GMAIL_APP_PASSWORD`, mulai ulang server, kirim Contact, lalu cek pesan tetap ada di admin dengan status email gagal. Kembalikan App Password, mulai ulang server, dan gunakan tombol **Kirim ulang email**. Tanpa kredensial layanan, build dan tampilan contoh dapat diuji, tetapi alur yang memakai layanan eksternal belum dapat diverifikasi.
