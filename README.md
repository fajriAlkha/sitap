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

## Deploy ke Render

Repository ini menyertakan `render.yaml` untuk membuat web service Node.js di Render. Hubungkan repository GitHub ke Render sebagai Blueprint dan deploy dari branch `main`.

Blueprint menggunakan paket gratis tanpa persistent disk. Database SQLite dan berkas yang diunggah dapat hilang saat service dimulai ulang atau deploy ulang; gunakan hanya untuk demo dengan data fiktif.

## Profil simulasi

Informasi Publik adalah menu yang tersedia untuk semua profil, bukan role login. Saat pertama kali dibuka, aplikasi memakai profil Ahmad Pratama, masyarakat berdomisili di Kelurahan Tembalang, Kota Semarang. Pemilih profil di header beralih di antara contoh masyarakat, operator desa/kecamatan, OPD, pejabat, Pemerintah Pusat, auditor, dan administrator demo. Profil Andi Pratama di Desa Sukamaju dipertahankan agar data seed lama tetap dapat dijelajahi.

Masyarakat dapat mencari ringkasan program di seluruh wilayah. Detail administratif dibatasi pada wilayah domisili simulasi dan pengajuan milik profil tersebut; tahapan program di wilayah lain baru ditampilkan setelah disetujui. Formulir pengajuan mengisi domisili dari profil dan meminta tingkat tujuan (desa/kelurahan, kecamatan, kabupaten/kota, atau provinsi).

- Operator Desa/Kecamatan: verifikasi serta meneruskan pengajuan.
- Operator OPD: memperbarui penanganan, progres, dan bukti simulasi.
- Pejabat Berwenang: menetapkan diterima/ditolak dengan alasan serta pertimbangan wajib.
- Pemerintah Pusat: meninjau dokumen yang dikirim ke pusat, lalu menyetujui atau meminta perbaikan dengan catatan.
- Auditor: audit trail read-only.
- Administrator Demo: reset dataset demonstrasi.

## Visibilitas informasi

Semua profil dapat mencari program berdasarkan nama, kategori, provinsi, dan kabupaten/kota. Tampilan lintas wilayah berisi ringkasan publik dan hasil yang boleh diumumkan, tanpa identitas pelapor, lokasi rinci, atau tahapan administratif untuk kasus yang belum disetujui. Tahapan publik ditampilkan setelah program disetujui; masyarakat pada wilayah simulasi dan pemilik pengajuan dapat melihat rincian yang relevan dengan mereka. Profil petugas melihat detail sesuai konteks kerja simulasinya.

Wilayah dan role pada prototipe dipilih melalui menu demo dan parameter API, sehingga bukan pembatasan akses produksi. Database yang sudah ada dimigrasikan untuk mencatat ID pemilik profil, tingkat/wilayah tujuan, dan hasil review dokumen tanpa menghapus data. Jangan gunakan data nyata; sistem produksi harus memverifikasi identitas, domisili, serta kewenangan di server sebelum mengirimkan data.

## Skenario demo

1. Dari landing page pilih **Ikuti Demo Terpandu**.
2. Ikuti panel panduan mengambang: informasi publik, pengajuan warga, pemeriksaan desa dan kecamatan, penanganan OPD, keputusan pejabat, pengiriman dokumen ke pusat, persetujuan pusat, lalu audit.
3. Panel tetap tersedia saat berpindah profil dan halaman, serta menjelaskan peran, tujuan langkah, dan tindakan yang perlu dicoba.
4. Pada tahap dokumen, kasus yang dibuat di langkah warga terisi otomatis. Setelah dokumen didaftarkan, demo langsung berpindah ke antrean Pemerintah Pusat untuk menyetujui atau meminta perbaikan.
5. Pilih **Reset data demo** sebelum presentasi berikutnya.

## Batasan prototype

Pemilihan profil memakai localStorage dan parameter API hanya untuk pengalaman simulasi, bukan autentikasi atau otorisasi aman. Untuk produksi dibutuhkan autentikasi, RBAC server-side, proteksi CSRF, pengamanan berkas, manajemen retensi, integrasi resmi, serta tanda tangan elektronik sesuai ketentuan.
