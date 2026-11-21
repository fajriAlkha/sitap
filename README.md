# SITAP Prototype

SITAP (Sistem Integrasi, Transparansi, dan Akuntabilitas Pemerintahan) adalah purwarupa full-stack untuk memperlihatkan perjalanan pengajuan dari masyarakat atau instansi hingga keputusan, realisasi, evaluasi, dan audit.

> Seluruh data, nama, instansi, dokumen, QR Code, keputusan, dan bukti dalam aplikasi ini fiktif. Ini bukan sistem pemerintah resmi dan bukan pengganti SP4N-LAPOR!, SIPD, Musrenbang, atau SPBE.

## Teknologi

- Node.js dan Express
- SQLite melalui `better-sqlite3`
- QR Code (`qrcode`) dan PDF Lembar Kendali (`pdfkit`)
- HTML, CSS, dan JavaScript responsif tanpa framework UI

## Instalasi dan menjalankan

```bash
npm install
npm run seed
npm run dev
```

Buka `http://localhost:3000`. Untuk menjalankan tanpa watch mode gunakan `npm start`.

Database dibuat otomatis di `data/sitap.db`. Tidak ada environment variable wajib untuk prototipe lokal ini; `PORT` dapat diatur bila ingin memakai port lain.

## Role simulasi

- Publik: statistik dan daftar pengajuan publik.
- Masyarakat: buat, pantau, dan evaluasi pengajuan profil demo Andi.
- Operator Desa/Kecamatan: verifikasi serta meneruskan pengajuan.
- Operator OPD: memperbarui penanganan, progres, dan bukti simulasi.
- Pejabat Berwenang: menetapkan diterima/ditolak dengan alasan serta pertimbangan wajib.
- Auditor: audit trail read-only.
- Administrator Demo: reset dataset demonstrasi.

## Skenario demo

1. Dari landing page pilih **Mulai Demo Terpandu**.
2. Ikuti delapan tahapan dari dashboard publik sampai pemeriksaan auditor.
3. Gunakan **Lihat halaman terkait** pada tiap tahap untuk melakukan tindakan nyata.
4. Pilih **Reset demo** sebelum presentasi berikutnya.

## Batasan prototype

Pemilihan role memakai localStorage hanya untuk pengalaman simulasi, bukan autentikasi atau otorisasi aman. Untuk produksi dibutuhkan autentikasi, RBAC server-side, proteksi CSRF, pengamanan berkas, manajemen retensi, integrasi resmi, serta tanda tangan elektronik sesuai ketentuan.
