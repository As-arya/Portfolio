# Menghubungkan Gmail ke portofolio

Panduan ini mengikuti konfigurasi yang sudah dipakai proyek. Gmail dihubungkan melalui Nodemailer dan App Password. Pengaturan email pengirim cukup dilakukan sekali untuk notifikasi Contact dan tombol **Kirim ulang email**.

## 1. Kenali fungsi setiap email

| Fitur | Pengirim / mekanisme | Pengaturan yang dipakai |
| --- | --- | --- |
| Notifikasi Contact | Gmail melalui backend | `BACKUP_GMAIL_ADDRESS` dan `BACKUP_GMAIL_APP_PASSWORD`; penerima `PRIMARY_ADMIN_EMAIL` |
| Kirim ulang notifikasi Contact | Gmail yang sama | Pengaturan yang sama dengan Contact |
| Lupa kata sandi admin utama | Firebase Authentication mengirim email reset | Konfigurasi Firebase dan `NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL` |
| Pemulihan melalui akun cadangan | Backend membuat tautan reset dan menampilkannya di halaman recovery | Konfigurasi Firebase serta akun cadangan; tidak memerlukan Gmail pengirim |

Nama `BACKUP_GMAIL_ADDRESS` adalah nama variabel yang sudah digunakan kode. Alamat ini berfungsi sebagai pengirim notifikasi; boleh memakai Gmail cadangan yang Anda miliki, tetapi tidak harus sama dengan `BACKUP_ADMIN_EMAIL`. Login admin tetap menggunakan akun Email/Password Firebase.

## 2. Aktifkan Verifikasi 2 Langkah pada Gmail pengirim

1. Masuk ke akun Gmail yang akan dipakai mengirim notifikasi.
2. Buka [Keamanan Akun Google](https://myaccount.google.com/security).
3. Pada bagian **Cara Anda login ke Google**, buka **Verifikasi 2 Langkah**.
4. Ikuti proses Google sampai statusnya aktif.

Pastikan akun Google yang dipilih adalah akun pengirim. [Panduan resmi Verifikasi 2 Langkah](https://support.google.com/accounts/answer/185839?hl=id)

## 3. Buat App Password

1. Dalam akun pengirim yang sama, buka [Sandi aplikasi / App Passwords](https://myaccount.google.com/apppasswords).
2. Jika diminta, verifikasi login Anda.
3. Beri nama aplikasi, misalnya **Portfolio Asarya**, lalu buat sandi aplikasi.
4. Salin kode 16 karakter yang ditampilkan. Ketika Google menampilkan beberapa kelompok karakter, gabungkan tanpa spasi pemisah.

Gunakan App Password ini untuk aplikasi, bukan kata sandi login Google. App Password memerlukan Verifikasi 2 Langkah. Simpan kode langsung di konfigurasi lokal; jangan kirimkan melalui chat atau masukkan ke Git. [Bantuan Google tentang App Password](https://support.google.com/accounts/answer/185833?hl=en)

## 4. Isi konfigurasi proyek

Buka berkas `.env.local` yang berada di `D:\Binus\Porto\Portfolio`, sejajar dengan `package.json`. Lengkapi dua baris berikut; pertahankan pengaturan Firebase dan layanan lain yang sudah terisi.

```dotenv
BACKUP_GMAIL_ADDRESS=alamat-pengirim@gmail.com
BACKUP_GMAIL_APP_PASSWORD=GANTI_DENGAN_APP_PASSWORD
```

Ganti contoh alamat dengan Gmail yang membuat App Password. Ganti teks contoh sandi dengan kode asli 16 karakter.

Pastikan `PRIMARY_ADMIN_EMAIL` sudah berisi email akun admin utama. Notifikasi dikirim ke alamat tersebut. `NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL` harus berisi email admin utama yang sama untuk fitur reset kata sandi.

Jangan mengganti email admin utama hanya untuk mencoba Gmail: nilai email dan UID admin harus tetap cocok dengan akun Firebase yang digunakan login. Cukup isi pengaturan Gmail pengirim bila admin utama sudah benar.

Proyek sudah memakai `service: "gmail"`, sehingga pengaturan host dan port SMTP dipilih oleh Nodemailer. Untuk cara yang sudah diimplementasikan ini, tidak perlu membuat API key Gmail atau OAuth client. [Dokumentasi Nodemailer untuk Gmail](https://nodemailer.com/guides/using-gmail)

## 5. Mulai ulang server

Hentikan development server dari terminal yang menjalankannya dengan **Ctrl+C**, lalu:

```powershell
Set-Location 'D:\Binus\Porto\Portfolio'
npm run dev
```

Buka alamat yang dicetak server, biasanya [http://127.0.0.1:3000](http://127.0.0.1:3000).

Saat aplikasi nanti dipublikasikan, isi variabel yang sama pada pengaturan environment layanan hosting, lalu mulai ulang atau deploy ulang aplikasinya. `.env.local` di komputer tidak otomatis menjadi konfigurasi server hosting.

## 6. Uji Contact sampai email diterima

Firebase harus sudah siap untuk menyimpan pesan, dan Turnstile harus siap memverifikasi formulir. Jika belum, ikuti [panduan ENV](ENV_SETUP.md).

1. Buka halaman utama, lalu bagian **Contact**.
2. Isi nama, email Anda, dan pesan uji minimal 10 karakter, misalnya `Pengujian notifikasi Gmail dari portofolio.`
3. Tunggu verifikasi keamanan siap, lalu tekan **Kirim pesan**.
4. Login sebagai admin utama di `/admin/login`, lalu buka tab **Pesan**.
5. Pilih pesan uji dan periksa status **Email terkirim**.
6. Buka kotak masuk email admin utama. Cari subjek **Portfolio contact: [nama yang diisi]**; periksa folder Spam jika belum terlihat.

Notifikasi dikirim dari Gmail pengirim. Jika Anda membalas notifikasi tersebut, alamat balasannya mengarah ke email yang diisi pengunjung pada formulir.

Pesan berhasil tersimpan belum memastikan notifikasi email terkirim. Backend menyimpan Contact terlebih dahulu; bila Gmail gagal, pesan tetap ada di admin dengan status **Email gagal**. Setelah memperbaiki konfigurasi dan memulai ulang server, pilih pesan tersebut lalu klik **Kirim ulang email**.

## 7. Periksa reset kata sandi secara terpisah

Halaman `/admin/forgot-password` memakai `sendPasswordResetEmail` dari Firebase. Pastikan akun admin utama terdaftar di **Firebase Authentication > Users**, provider **Email/Password** aktif, dan `NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL` cocok dengan akun itu.

Template reset dapat dikelola melalui tab **Templates** pada Firebase Authentication. App Password Gmail di atas tidak mengatur pengiriman reset ini. [Dokumentasi reset email Firebase](https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email)

Jika email utama tidak dapat diakses, login memakai akun cadangan di `/admin/login`. Pada halaman recovery, gunakan **Buat tautan reset**. Alur ini menampilkan tautan langsung dan tetap bekerja tanpa SMTP Gmail.

## Jika terjadi masalah

| Gejala | Langkah pemeriksaan |
| --- | --- |
| Menu App Password tidak muncul | Pastikan Verifikasi 2 Langkah aktif pada akun yang benar. Akun kantor/sekolah, Advanced Protection, atau Verifikasi 2 Langkah yang hanya memakai security key dapat membatasi fitur ini. [Bantuan Google](https://support.google.com/accounts/answer/185833?hl=en) |
| `Gmail pengirim belum dikonfigurasi` | Isi kedua variabel Gmail di `.env.local`, lalu mulai ulang server. |
| `Email admin utama belum dikonfigurasi` | Lengkapi `PRIMARY_ADMIN_EMAIL` sesuai akun Firebase admin utama. |
| Log menunjukkan `EAUTH` / `Invalid login` | Pastikan App Password berasal dari Gmail pengirim yang sama, tanpa spasi pemisah. Jangan gunakan sandi Google biasa. [Referensi error Nodemailer](https://nodemailer.com/errors) |
| Sebelumnya berhasil, lalu gagal setelah mengganti sandi Google | Google mencabut App Password saat sandi akun berubah. Buat App Password baru, perbarui ENV, dan mulai ulang server. [Bantuan Google](https://support.google.com/accounts/answer/185833?hl=en) |
| Status terkirim, tetapi email belum ditemukan | Pastikan penerima `PRIMARY_ADMIN_EMAIL` benar dan periksa Spam. |
| Pesan ada di admin, tetapi email gagal | Periksa log terminal yang menjalankan server, perbaiki Gmail, lalu gunakan **Kirim ulang email**. |
| Reset kata sandi gagal | Periksa konfigurasi Firebase dan email admin utama; perbaikan App Password Contact tidak mengubah alur reset Firebase. |

Panduan ini disusun dari kode proyek dan dokumentasi resmi. Kredensial Google belum diisi atau diuji, dan tidak ada email sungguhan yang dikirim saat penyusunan panduan.
