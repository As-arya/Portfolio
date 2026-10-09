# Persiapan upload GitHub

Gunakan folder **Portfolio** sebagai root repository. Folder induk `Porto` juga berisi konfigurasi skill dan eksperimen desain lokal yang bukan bagian dari website ini.

## File yang disertakan

- `app/`, `lib/`, `public/`: kode dan aset website, termasuk kredit/lisensi aset.
- `scripts/`, `tests/`, `docs/`: setup, pemeriksaan keamanan, tes regresi, dan record perbaikan.
- `package.json`, `package-lock.json`, `next.config.ts`, `proxy.ts`, `tsconfig.json`, `next-env.d.ts`, dan `firestore.rules`: dependency dan konfigurasi aplikasi.
- `.env.example`: template konfigurasi tanpa kredensial pribadi.
- `.gitignore`, `.gitattributes`, `README.md`, `AGENTS.md`, dan `CLAUDE.md`: aturan repository dan petunjuk pemeliharaan. Petunjuk agent tidak berisi kredensial.

## File lokal yang dikecualikan

`.gitignore` mengecualikan `.env.local` dan ENV privat lainnya, dependency `node_modules/`, hasil build `.next/`/`out/`, cache, `.temp/`, hasil tes, coverage, log, backup editor, serta file credential/private key. Semua ini tetap tersedia lokal ketika diperlukan.

Folder dependency/cache/hasil tes yang sudah ada dan `.env.local` diberi atribut Hidden di Windows agar folder kerja lebih ringkas. Atribut Hidden hanya memengaruhi tampilan Explorer; perlindungan upload lewat Git tetap berasal dari `.gitignore`.

## Upload melalui Git

Dari folder `Portfolio`, periksa daftar file terlebih dahulu:

```bash
git status --short
git ls-files --cached --others --exclude-standard
```

Setelah daftar sesuai, jalankan sendiri:

```bash
git add .
git diff --cached --name-only
git commit -m "Harden security and prepare portfolio for deployment"
git push origin HEAD
```

File lokal/credential tidak boleh muncul di daftar staged. `.gitignore` tidak menghentikan file yang sudah tracked atau perintah `git add -f`; jangan memaksa memasukkan file privat.

## Upload manual melalui browser

Upload hanya file yang muncul pada `git ls-files --cached --others --exclude-standard`, dengan struktur folder yang sama. `.gitignore` tidak menyaring drag-and-drop melalui browser. Jangan memilih seluruh folder kerja beserta `.git`, `.env.local`, `node_modules`, cache, atau hasil build.

## Setelah repository tersedia

Pilih root aplikasi yang memiliki `package.json` pada platform deploy. Masukkan ENV privat lewat pengaturan environment platform; gunakan `.env.example` sebagai template. Jangan mengunggah `.env.local` ke repository untuk menjalankan hosting.

Jalankan `npm run check:deploy` dengan ENV target. Status keamanan dan pekerjaan yang masih tertunda tetap dicatat pada [SECURITY_AUDIT.md](SECURITY_AUDIT.md), termasuk APP_ORIGIN, kunci Turnstile produksi, koneksi Strix, dan pengujian layanan pada domain final.
