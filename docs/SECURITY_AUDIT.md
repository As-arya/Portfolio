# Record audit keamanan sebelum deploy

Tanggal: **10 Oktober 2026 (Asia/Bangkok)**. Target: source dan build produksi lokal portfolio Next.js, Firebase, Cloudinary, Gmail, dan Turnstile. Asumsi beban: satu pemilik admin, satu akun pemulihan, pengunjung publik, dan volume Contact rendah.

**Keputusan saat ini: perbaikan kode selesai untuk temuan lokal, tetapi belum siap dinyatakan selesai untuk deploy.** Origin/domain produksi dan kunci Turnstile masih perlu diisi; pentest Strix belum bisa berjalan karena koneksi autentikasi. Tabel di bawah membedakan perbaikan yang sudah diverifikasi dari pekerjaan yang masih tertunda.

## Record masalah dan perbaikan

`done` berarti perubahan kode sudah dibuat dan diuji dalam cakupan yang disebutkan. `verified` berarti kontrol yang sudah ada diperiksa tanpa perlu perbaikan. `not done` dan `blocked` belum boleh dianggap lulus.

| ID | Judul masalah | Deskripsi singkat dan perbaikan | Status |
| --- | --- | --- | --- |
| SEC-01 | Dependensi dengan advisory keamanan | Audit awal melaporkan 7 entri high: Next.js, sharp, source-map-js, serta gRPC dan rantai dependensi Firebase. Next.js terpasang 16.4.0, sharp 0.35.5, source-map-js 1.2.2; gRPC Firebase Web dinaikkan ke 1.14.6 melalui override khusus. gRPC Admin sudah 1.14.5. Audit npm akhir melaporkan 0 kerentanan. Tidak setiap advisory terbukti dapat dieksploitasi pada konfigurasi aplikasi ini. | done |
| SEC-02 | Body JSON besar dibaca sebelum ditolak | Sebelumnya `request.text()` mengalokasikan seluruh body, lalu memeriksa jumlah karakter. Parser sekarang membatasi byte ketika stream dibaca, membatalkan stream saat melewati batas, memeriksa Content-Length, menolak UTF-8/JSON rusak, dan mewajibkan application/json. Contact dibatasi 32 KiB, session 16 KiB, editor konten 1 MB. | done |
| SEC-03 | Pemeriksaan origin bergantung pada Host/protokol request | Origin dari proxy atau Host yang salah tidak lagi menentukan kepercayaan pada produksi. Mutasi membandingkan Origin dengan `APP_ORIGIN` yang dikonfigurasi, menolak Sec-Fetch-Site cross-site, dan menolak konfigurasi produksi yang kosong/rusak. Tes mencakup TLS termination dan Host palsu. | done — kode |
| SEC-04 | Token Turnstile belum terikat ke form dan hostname | Verifikasi sebelumnya hanya memeriksa success. Sekarang token produksi harus success=true, hostname sesuai origin aplikasi, dan action=contact. Widget mengirim action yang sama. Panjang maksimal 2048, timeout layanan 10 detik, error layanan menolak pengiriman sebelum ada write/email. Kunci tes tetap dapat digunakan melalui next dev. | done |
| SEC-05 | Kunci Turnstile tes dapat terbawa ke produksi | Runtime produksi menolak kunci tes site/secret. `npm run check:deploy` memeriksa konfigurasi tanpa mencetak nilai secret. ENV lokal masih memakai pasangan tes, sehingga Contact pada build produksi lokal sengaja ditolak dengan 503. | done — guard; konfigurasi belum selesai |
| SEC-06 | Pesan Contact tidak memiliki batas volume setelah CAPTCHA | Transaksi Firestore sekarang menyimpan pesan dan counter secara atomik: 3 pesan per email dan 30 total per 15 menit. Counter memakai hash email, berlaku lintas instance, dan tidak bergantung pada X-Forwarded-For yang dapat dipalsukan. Tes paralel memastikan pesan di atas batas tidak tersimpan. Ini membatasi write/email setelah challenge lolos; tidak menggantikan perlindungan trafik di hosting. | done |
| SEC-07 | Formula CSV dapat disamarkan dengan whitespace | Ekspor sebelumnya hanya mendeteksi =,+,-,@ pada karakter pertama. Sekarang prefix whitespace/control juga diperiksa dan sel berbahaya diberi apostrof. Kutip, koma, dan multiline tetap di-escape. | done |
| SEC-08 | Alamat email Contact menerima delimiter/query | Validasi lama menerima alamat seperti `ada@example.com?bcc=victim%40evil.com`, yang tidak aman untuk alur mailto/Reply-To. Validasi sekarang membatasi alamat sederhana yang valid, menolak delimiter/query, domain rusak, CRLF, dan titik lokal ganda; plus-address tetap diterima. | done |
| SEC-09 | Refresh token Firebase dapat tersimpan di browser | Login sekarang memakai persistence in-memory, lalu signOut client setelah cookie server terbentuk. Sesi aplikasi tetap memakai HttpOnly/Secure/SameSite Strict dengan expiry 5 hari dan pengecekan revocation. Ini mengurangi akses JavaScript ke kredensial Firebase yang persisten. | done — kode/build; login nyata ulang ada di checklist staging |
| SEC-10 | Browser belum menerima proteksi CSP/frame/sniffing | CSP memakai nonce acak per respons, tanpa unsafe-inline/unsafe-eval untuk script produksi. Sumber layanan dibatasi; object/base/frame embedding ditolak. Ditambahkan X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin (no-referrer khusus recovery), Permissions-Policy, dan HSTS; header X-Powered-By dihapus. Iframe Firebase hanya diizinkan dari authDomain yang dikonfigurasi, untuk inisialisasi SDK di mobile/Safari. Browser memblokir sisipan script tanpa nonce dan fitur publik tetap berjalan. | done |
| SEC-11 | Respons admin tidak menyatakan larangan cache secara merata | Halaman admin dan seluruh API admin diberi private/no-store. Tes HTTP memastikan respons 401 berisi data minimal, tidak di-cache, dan tidak membuat cookie. Reset link dan CSV tetap memakai no-store. | done |
| SEC-12 | Batas format upload belum terikat pada signature | Signature dan request upload kini menyertakan allowed_formats jpg,png,webp, beserta preset/folder/prefix portfolio. Primary tetap wajib; backup/anonim tidak memperoleh signature. Preset layanan asli diperiksa dan bertipe Signed. Batas 10 MB masih pemeriksaan client/permintaan signature; bytes upload langsung tidak dihitung oleh backend ini. | done — format/akses |
| QA-01 | Tes posisi kartu salah membaca tulisan tali | Detektor abu-abu pada tes drag menangkap tulisan BINUS ketika tali memanjang. Gambar diagnostik menunjukkan kartu turun dengan benar. Detektor diganti dengan area badan kartu yang gelap dan lebar; tes drag kembali lulus. Kode lanyard tidak diubah. | done |
| CHECK-01 | Batas primary dan backup | UID+email+provider password harus cocok. Backup hanya boleh recovery. Tes memeriksa batas dua role, token revoked/stale, cookie palsu, dan penolakan endpoint admin tanpa sesi. Draft tidak masuk daftar publik atau detail publik. | verified |
| CHECK-02 | Dokumen Firestore privat | Rules repo menolak semua read/write client. Pada layanan asli, pembacaan anonim settings/public, security/recovery, contacts, dan security/contact-global semuanya mendapat 403. | verified |
| CHECK-03 | Secret dalam repo/browser | Pemeriksaan nilai secret server yang dikonfigurasi: 141 file tracked, 9 commit lokal yang tersedia, dan 24 file JS/JSON/map bundle browser. Tidak ada kecocokan secret; file ENV privat tidak muncul di riwayat yang diperiksa. Pemeriksaan ini tidak menjangkau branch remote yang belum di-fetch atau kredensial lama yang tidak lagi ada di ENV. | verified |
| DEPLOY-01 | Origin dan CAPTCHA produksi belum dikonfigurasi | `check:deploy` saat audit gagal karena APP_ORIGIN belum diisi dan kedua kunci Turnstile masih kunci tes. Isi origin HTTPS domain yang benar, pasangkan kunci produksi, daftarkan domain, dan build ulang. | not done — perlu konfigurasi domain |
| STRIX-01 | Pentest Strix belum dapat dijalankan | Panggilan daftar repository/domain berulang mengembalikan “Authentication for Strix was requested and accepted. Retry this tool call now.” termasuk setelah restart. Tidak ada scan ID atau hasil pentest yang diterima. Perlu memperbaiki koneksi, lalu scan/retest snapshot kode akhir dan target staging milik sendiri. | blocked — autentikasi plugin |
| DEPLOY-02 | Pengujian positif pada konfigurasi staging akhir | Login primary/backup nyata, cookie HTTPS, upload dengan signature baru, pengiriman Contact memakai CAPTCHA produksi dan Gmail, serta recovery nyata belum diulang dalam audit ini. Tes mock/negatif lokal tidak menggantikan langkah tersebut. | not done — target/konfigurasi akhir |

## Bukti verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Audit dependency registry npm | 0 kerentanan akhir; 7 entri high sebelum perbaikan |
| TypeScript dan build produksi Next.js 16.4.0 | Lulus |
| Unit keamanan, validasi backend, recovery | 26 tes lulus |
| HTTP/browser keamanan dan akses admin pada next start | 7 tes lulus |
| Regresi UI: animasi, Certificates, glass, gradient, lanyard, public content, tema | 16 tes lulus pada build akhir; tes deteksi kartu diperbaiki |
| Regresi Node navigation dan GitHub parser | 2 pemeriksaan lulus |
| Preset Cloudinary asli | Signed; tidak ada perubahan aset/preset |
| Firestore anonim | 4 request ditolak dengan 403 |
| Guard ENV sebelum deploy | Gagal sesuai harapan pada konfigurasi lokal yang belum siap |

Permintaan HTTP Contact pada audit ini memakai input tidak valid/token tidak terverifikasi dan ditolak. Tidak ada pesan Contact baru, upload baru, penggantian password, deploy, push, atau perubahan konfigurasi layanan cloud yang dilakukan.

## Selesaikan sebelum deploy publik

1. Isi `APP_ORIGIN=https://domain-anda` pada ENV hosting. Gunakan satu origin kanonis; redirect alias/www di hosting ke origin itu. Nilai tidak boleh berisi path/query atau kredensial. HTTP localhost hanya tersedia untuk pengujian build produksi lokal.
2. Ganti **kedua** kunci Turnstile dengan pasangan produksi. Daftarkan hostname di widget Turnstile dan Authorized domains Firebase. Build ulang setelah mengubah NEXT_PUBLIC_*.
3. Jalankan `npm run check:deploy`, `npm audit`, `npm run check`, `npm run test:security`, dan `npm run build` pada konfigurasi akhir. Guard ENV hanya memeriksa bentuk/keberadaan nilai; bukan validitas kredensial di layanan.
4. Jalankan build produksi/staging melalui HTTPS. Jalankan `npm run test:security:http` dengan `PORTFOLIO_TEST_URL` yang sesuai, lalu uji login primary/backup, upload JPEG/PNG/WebP, Contact yang berhasil tersimpan dan terkirim lewat Gmail, serta recovery nyata.
5. Perbaiki koneksi Strix dan jalankan code review atas snapshot akhir atau pentest pada staging yang terverifikasi. Tutup temuan yang relevan, lalu retest. Saat ini langkah ini **belum lulus**.
6. Aktifkan TTL `expiresAt` untuk collection group security agar marker rate limit email dibersihkan otomatis. Tanpa TTL, rate limit tetap berfungsi, tetapi marker email lama akan bertambah. Jangan menambahkan TTL pada dokumen kontak yang ingin disimpan.
7. Pastikan rules Firestore deny-all tetap terpasang pada project produksi. Atur batas trafik/WAF dan budget alert pada hosting/layanan sesuai penggunaan; batas Contact aplikasi mulai bekerja setelah Siteverify lolos.

Untuk pengujian lokal: jalankan `APP_ORIGIN=http://127.0.0.1:3010` pada proses `npm run start -- -p 3010`, lalu set `PORTFOLIO_TEST_URL=http://127.0.0.1:3010` pada proses tes. Kunci Turnstile tes hanya untuk next dev; positive Contact pada next start memerlukan kunci produksi yang cocok.

## Cakupan dan batas

Ponytail dipakai untuk menelusuri flow input, sesi, peran, read/write, ekspor, upload, recovery, dan konfigurasi deploy. Context7 dipakai untuk memeriksa panduan Next.js dan Cloudflare Turnstile. Dokumentasi versi Next.js yang terpasang juga dibaca. Strix dicoba tetapi koneksinya belum berfungsi.

Belum dilakukan: pentest eksternal Strix, load/DDoS test, review IAM/service account cloud, pengujian seluruh credential lama/branch remote, dan pengujian positif layanan pada domain final. CSP masih mengizinkan inline **style** untuk komponen animasi; script produksi membutuhkan nonce. Nonce membuat halaman dirender dinamis, termasuk login/forgot-password, sehingga cache HTML publik tidak boleh menyimpan respons lintas nonce.

## Referensi utama

- [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy) dan [security advisory image optimization](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4).
- [gRPC advisory](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j), [sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w), dan [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) dan [kunci tes](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
- [Firebase session cookies dan persistence client](https://firebase.google.com/docs/auth/admin/manage-cookies).
- [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets).
