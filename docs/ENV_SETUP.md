# Langkah melengkapi ENV

Gunakan `Portfolio/.env.local` untuk mengaktifkan admin, penyimpanan konten, upload, Contact, dan pemulihan akun. Semua nama variabel berikut sesuai dengan kode aplikasi. Gunakan dua akun Firebase Email/Password: akun utama untuk admin dan akun cadangan untuk pemulihan. Gmail pengirim diatur terpisah dari metode login admin.

## 1. Siapkan berkas lokal

Gunakan Node.js 24. Di PowerShell:

```powershell
Set-Location 'D:\Binus\Porto\Portfolio'
npm ci
if (-not (Test-Path -LiteralPath '.env.local')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
notepad .env.local
```

Jika berkas sudah ada, lengkapi nilai kosong tanpa menimpa konfigurasi yang terisi. Letakkan `.env.local` sejajar dengan `package.json`, bukan di folder `app`. Berkas ini diabaikan Git; simpan juga JSON service account dan App Password di luar repo.

Variabel `NEXT_PUBLIC_` bisa dibaca browser. Private key, Cloudinary API secret, App Password, dan Turnstile secret harus tetap memakai nama server di template. Setelah mengubah ENV, hentikan server dengan Ctrl+C lalu jalankan lagi `npm run dev`. Untuk produksi, build ulang sebelum `npm run start`: nilai publik dimasukkan saat build. [Dokumentasi ENV Next.js](https://nextjs.org/docs/app/guides/environment-variables)

## 2. Firebase Web, Admin, dan database

Di [Firebase Console](https://console.firebase.google.com/), pilih atau buat project, lalu:

1. Di **Project settings > General > Your apps**, tambahkan aplikasi Web bila belum ada dan tampilkan konfigurasi SDK.
2. Di **Authentication > Sign-in method**, aktifkan **Email/Password**. Login Google tidak digunakan aplikasi.
3. Di **Authentication > Settings > Authorized domains**, tambahkan `localhost` dan `127.0.0.1`, tanpa protokol atau port. Tambahkan domain situs saat publikasi. Project baru mungkin belum mengizinkan localhost otomatis. [Pengaturan domain Firebase](https://firebase.google.com/docs/auth/faq-and-troubleshooting)
4. Di **Firestore Database**, buat database default `(default)`. Salin [`firestore.rules`](../firestore.rules) ke tab **Rules**, lalu publish. Aplikasi mengakses Firestore melalui backend Admin SDK.
5. Di **Project settings > Service accounts > Firebase Admin SDK**, pilih **Generate new private key** dan simpan JSON secara privat. [Panduan Admin SDK](https://firebase.google.com/docs/admin/setup)

Isi tujuh variabel berikut:

| Variabel ENV | Sumber nilai |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` pada konfigurasi Web |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` pada konfigurasi Web |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` pada konfigurasi Web |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` pada konfigurasi Web |
| `FIREBASE_PROJECT_ID` | `project_id` pada JSON service account |
| `FIREBASE_CLIENT_EMAIL` | `client_email` pada JSON service account |
| `FIREBASE_PRIVATE_KEY` | `private_key` pada JSON service account |

Kedua Project ID harus sama. `FIREBASE_CLIENT_EMAIL` adalah alamat service account, bukan Gmail admin. Tempel `private_key` lengkap dalam tanda kutip ganda pada satu baris; pertahankan setiap `\n` dari JSON. Nilainya dimulai dengan `-----BEGIN PRIVATE KEY-----\n`, diikuti isi kunci asli, lalu diakhiri `\n-----END PRIVATE KEY-----\n`. Jangan menempel seluruh objek JSON atau teks placeholder.

## 3. Admin utama

1. Di **Authentication > Users**, gunakan akun Email/Password utama yang sudah ada. Jika belum ada, buat melalui **Add user**.
2. Salin **User UID** akun tersebut, lalu isi:

| Variabel ENV | Isi |
| --- | --- |
| `PRIMARY_ADMIN_UID` | UID akun Email/Password utama |
| `PRIMARY_ADMIN_EMAIL` | Email akun utama |
| `NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL` | Email yang sama dengan `PRIMARY_ADMIN_EMAIL` |

3. Mulai ulang server, buka [admin login lokal](http://127.0.0.1:3000/admin/login), dan masuk melalui formulir Email/Password.

UID bukan email atau Project ID. Kata sandi login admin tidak dimasukkan ke ENV. Email utama juga dipakai sebagai penerima Contact dan alamat reset sandi.

## 4. Akun cadangan Email/Password

1. Di **Authentication > Users**, gunakan akun Email/Password cadangan yang sudah ada. Akun utama dan cadangan harus berbeda.
2. Salin UID dan email akun tersebut ke `BACKUP_ADMIN_UID` dan `BACKUP_ADMIN_EMAIL`. Kata sandi Firebase tidak dimasukkan ke ENV.
3. Mulai ulang server, buka `/admin/login`, dan masukkan email serta kata sandi cadangan melalui formulir yang sama.
4. Akun cadangan membuka `/admin/recovery`. Pilih **Buat tautan reset**, lalu **Reset kata sandi akun utama** untuk membuka formulir Firebase. Tautan tampil langsung tanpa email/Gmail. Pengelolaan konten tetap memakai akun utama.

Jika muncul `auth/operation-not-allowed`, aktifkan provider Email/Password. Jika akun lama hanya memiliki provider Google, tambahkan metode Email/Password pada akun yang sama sebelum menggunakannya; pertahankan UID yang tercantum di ENV. [Panduan Email/Password](https://firebase.google.com/docs/auth/web/password-auth)

## 5. Cloudinary untuk upload gambar

1. Di [Cloudinary Console](https://console.cloudinary.com/), pilih product environment yang dipakai aplikasi. Gunakan **Dynamic folders**, karena upload mengirim `asset_folder` dan `public_id_prefix`.
2. Dari halaman kredensial/API Keys, salin cloud name, API key, dan API secret.
3. Di pengaturan **Upload > Upload presets**, buat preset, misalnya `portfolio_signed`, dengan **Signing mode: Signed** dan **Allowed formats: jpg,png,webp**.

| Variabel ENV | Isi |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloud name product environment |
| `CLOUDINARY_API_KEY` | API key environment tersebut |
| `CLOUDINARY_API_SECRET` | API secret pasangan API key |
| `CLOUDINARY_UPLOAD_PRESET` | Nama preset Signed, persis seperti yang disimpan |

Aplikasi memeriksa format dan batas 10 MB pada file serta permintaan tanda tangan. Dokumentasi Cloudinary saat ini menyatakan preset tidak mendukung batas ukuran file per preset; tidak perlu mencari `max_file_size` di preset. [Dokumentasi upload presets](https://cloudinary.com/documentation/upload_presets)

Mulai ulang server, lalu coba upload logo di **Education** atau gambar di **Certificates** melalui admin utama.

## 6. Gmail pengirim Contact (opsional)

Untuk langkah lengkap dari pengaturan akun Google sampai uji notifikasi, ikuti [panduan menghubungkan Gmail](GMAIL_SETUP.md).

1. Pada akun Gmail yang akan mengirim notifikasi Contact, aktifkan **Verifikasi 2 Langkah**.
2. Buka [App Passwords](https://myaccount.google.com/apppasswords), lalu buat sandi aplikasi untuk portofolio.
3. Isi `BACKUP_GMAIL_ADDRESS` dengan Gmail yang membuat App Password. Akun Gmail ini hanya untuk notifikasi Contact dan dapat memakai Gmail cadangan yang sudah ada.
4. Isi `BACKUP_GMAIL_APP_PASSWORD` dengan App Password 16 karakter tanpa spasi pemisah, bukan kata sandi login Gmail.

Menu App Password dapat tidak tersedia pada akun organisasi, Advanced Protection, atau konfigurasi Verifikasi 2 Langkah tertentu. [Bantuan resmi Google](https://support.google.com/accounts/answer/185833?hl=en)

Backend memakai Gmail ini untuk mengirim notifikasi Contact ke `PRIMARY_ADMIN_EMAIL`. Tanpa kedua nilai tersebut, pesan Contact tetap tersimpan di admin dengan status email gagal. Pemulihan akun backup tidak memakai SMTP. Mulai ulang server setelah mengisi keduanya.

## 7. Turnstile

Untuk pengujian lokal, gunakan pasangan kunci tes resmi berikut:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Kunci ini selalu lolos untuk pengujian. Saat publikasi, buat widget di Cloudflare Turnstile, daftarkan hostname situs, lalu ganti **kedua** nilai dengan Site Key dan Secret Key widget yang sama. Build ulang setelah mengganti Site Key. Jangan mencampur pasangan tes dan produksi. [Pengujian Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)

## 8. Periksa hasilnya

Jalankan `npm run check` dan `npm run build`, kemudian `npm run dev`. Buka alamat yang dicetak server. Jika server portofolio sudah aktif pada port 3000, gunakan server tersebut.

- **Admin utama:** login Email/Password membuka dashboard.
- **Education:** ubah **Judul bagian materi (Indonesia)**, beralih ke **English** untuk mengubah judul Inggris, lalu klik **Simpan pendidikan**. Muat ulang situs dan cek kedua bahasa. Judul kosong memakai teks bawaan; judul tampil jika daftar materi berisi entri.
- **Upload:** unggah logo atau sertifikat, simpan, dan cek gambar pada situs.
- **Contact:** kirim pesan uji setelah widget siap. Cek pesan di admin dan notifikasi di Gmail utama. Jika status email gagal, perbaiki Gmail lalu gunakan **Kirim ulang email**.
- **Cadangan:** login email dan kata sandi membuka halaman pemulihan. Tautan dibuat saat tombol ditekan dan ditampilkan langsung; akun ini tidak dapat mengakses konten admin. Selama 15 menit, tombol mengambil tautan yang sama setelah halaman dimuat ulang; setelah itu tautan baru dapat dibuat.

`npm run seed` bersifat opsional untuk menyalin tiga proyek contoh ke Firestore. Jalankan sekali setelah Firebase siap; perintah ini menulis ke project yang dipilih dan hanya membuat proyek yang belum ada. Education dan Certificates memiliki contoh yang bisa diganti dari admin tanpa seed.

Dengan server aktif di terminal lain, tes lokal berikut tidak mengirim email sungguhan:

```powershell
npx playwright test tests/backend-validation.spec.mjs tests/certificates.spec.mjs tests/public-content.spec.mjs tests/lanyard-drag.spec.mjs --workers=1
```

Untuk port lain, atur `$env:PORTFOLIO_TEST_URL='http://127.0.0.1:3001'` sebelum tes. Tes Contact memakai respons tiruan; kelulusan tes tidak memastikan kredensial layanan atau Gmail sudah benar.

## Jika masih gagal

| Gejala | Periksa |
| --- | --- |
| Firebase belum dikonfigurasi | Nilai Web Firebase, lokasi `.env.local`, dan restart server |
| Private key / PEM tidak valid | Kunci lengkap, tanda kutip ganda, dan `\n` dari JSON |
| Akun ini tidak memiliki akses | UID, email, dan cara login sesuai peran utama/cadangan |
| Database tidak ditemukan | Firestore default dibuat di project yang sama |
| Cloudinary belum dikonfigurasi / preset gagal | Empat nilai, environment yang sama, dan preset Signed |
| Pesan tersimpan tetapi email gagal | Gmail pengirim cocok dengan App Password; email utama terisi |
| Verifikasi Contact gagal | Pasangan kunci cocok, hostname diizinkan, widget selesai |
| Perubahan ENV belum terlihat | Restart development server; build ulang untuk nilai publik di produksi |
