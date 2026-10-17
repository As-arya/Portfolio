# Domain Hostinger untuk portfolio Vercel

Status diperiksa **13 Oktober 2026**. Project Vercel: `AS-Arya's projects / portfolio`. Source produksi: branch `main`, commit `2bdaf5e`.

## Record persiapan

| Judul | Deskripsi singkat | Status |
| --- | --- | --- |
| Domain utama di Vercel | `asaryaalotia.com` sudah ditambahkan ke environment Production. | done — pengaturan Vercel |
| Redirect www | `www.asaryaalotia.com` sudah ditambahkan dengan redirect permanen 308 ke `asaryaalotia.com`. | done — pengaturan Vercel; DNS belum aktif |
| Akses publik | Deployment Protection memakai Standard Protection. Homepage domain produksi saat ini berhasil dibuka melalui browser tanpa sesi Vercel. | verified — domain Vercel saat ini |
| Pembelian domain | Portfolio domain Hostinger masih kosong. Pemilik mengonfirmasi pembelian/pembayaran belum selesai. | not done — pemilik menyelesaikan pembelian |
| DNS dan HTTPS domain sendiri | Kedua domain di Vercel masih Invalid Configuration karena DNS belum dipasang. | not done — menunggu domain aktif |
| Origin dan layanan pada domain sendiri | APP_ORIGIN, Authorized domains Firebase, dan hostname Turnstile perlu disesuaikan setelah domain aktif. Pengujian login/Contact pada domain baru belum dilakukan. | not done |

Domain publik sementara: [asaryajachredalotia.vercel.app](https://asaryajachredalotia.vercel.app/) (sebelumnya `portfolio-gilt-ten-35.vercel.app`). Setelah pergantian ini, `APP_ORIGIN` pada ENV Production harus diubah ke `https://asaryajachredalotia.vercel.app` lalu Redeploy; jika tidak, login admin menampilkan **Permintaan lintas situs ditolak.** URL per-deployment yang memakai hash dapat meminta login Vercel dan menunjuk ke versi tertentu.

## Setelah pembelian selesai

1. Selesaikan pembelian **domain saja** di Hostinger; website tetap dihosting Vercel. Pastikan `asaryaalotia.com` muncul aktif pada Domains.
2. Buka Hostinger **Domains > DNS**, pilih `asaryaalotia.com`, lalu pasang record berikut. Nilai ini disalin dari kartu domain project Vercel pada tanggal pemeriksaan; periksa kembali kartu bila pengaturan project berubah.

| Type | Name | Value |
| --- | --- | --- |
| A | @ | `216.198.79.1` |
| CNAME | www | `69cf2f1cae172e84.vercel-dns-017.com` |

Jika record website `@` atau `www` sudah ada, edit record yang sesuai dan selesaikan konflik pada hostname tersebut. Pertahankan record email seperti MX, SPF, DKIM, dan DMARC. Gunakan nameserver Hostinger yang aktif; tidak perlu memindahkan nameserver ke Vercel. TTL dapat memakai default Hostinger.

3. Buka [Vercel > Domains](https://vercel.com/as-aryas-projects/portfolio/settings/domains), tekan Refresh, lalu tunggu **Valid Configuration** dan HTTPS aktif untuk kedua domain. Propagasi DNS bisa memerlukan hingga 24 jam. Periksa `https://www.asaryaalotia.com` mengarah ke `https://asaryaalotia.com`.
4. Tambahkan `asaryaalotia.com` ke Firebase **Authentication > Settings > Authorized domains** dan daftar hostname widget Cloudflare Turnstile. Pastikan pasangan Site Key/Secret Key produksi benar. Homepage saat pemeriksaan masih menampilkan formulir Contact belum dikonfigurasi.
5. Setelah DNS/HTTPS siap, edit ENV **Production** Vercel: `APP_ORIGIN` bernilai `https://asaryaalotia.com`, tanpa tanda petik, path, atau trailing slash. Redeploy source produksi terbaru untuk menerapkan ENV. Nilai `NEXT_PUBLIC_*` tetap memakai nama lengkap dari template. Panduan: [ENV_SETUP.md](ENV_SETUP.md).
6. Gunakan domain utama untuk homepage, admin, dan Contact. Setelah perpindahan, arahkan alias produksi lama ke domain utama agar permintaan mutasi selalu datang dari origin yang sama.
7. Uji domain baru melalui browser tanpa sesi Vercel: homepage terbuka, www redirect, login admin berjalan, dan Contact dengan Turnstile produksi berhasil. Login admin aplikasi tetap diperlukan untuk mengelola konten.

Standard Protection sudah sesuai: domain produksi publik, sedangkan preview dan URL per-deployment tetap terlindungi. Tidak perlu mematikan seluruh Vercel Authentication.

## Referensi

- [Menambahkan domain di Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
- [Cakupan Deployment Protection](https://vercel.com/docs/deployment-protection).
- [Mengelola DNS Hostinger](https://www.hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger/).
- [Hostname Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/).
