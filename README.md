# Sistem Manajemen Stock Gudang & Kasir

Aplikasi web berbasis Laravel, Inertia, React, dan TypeScript untuk mengelola persediaan gudang, restock, barang rusak, pelanggan/reseller, barcode, riwayat transaksi, dan kasir penjualan.

## Fitur Utama

- Dashboard gudang dengan ringkasan stok, nilai inventaris, transaksi hari ini, dan restock terbaru
- Master barang dengan warna indikator stok hijau, kuning, dan merah
- Manajemen stok masuk, stok keluar, dan penyesuaian manual
- Barang rusak / expired yang otomatis memengaruhi stok
- Supplier, pelanggan / reseller, dan lokasi penyimpanan
- Barcode barang dan halaman cetak barcode
- Kasir penjualan dengan:
  - member / non-member
  - diskon nominal atau persen
  - metode pembayaran cash, transfer, QRIS, debit
  - hitung uang diterima dan kembalian
  - cetak struk thermal 58mm
- Role akses `admin`, `petugas`, dan `kasir`
- Branding usaha: nama toko, tagline, alamat, telepon, dan logo

## Tech Stack

- PHP 8.4+
- Laravel 12
- Inertia.js
- React + TypeScript
- Tailwind CSS
- Vite
- SQLite/MySQL

## Instalasi

```bash
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate
php artisan db:seed
npm run dev
```

Untuk build production:

```bash
npm run build
```

## Akun Dummy Seeder

Password default mengikuti `ADMIN_DEFAULT_PASSWORD` di `.env` atau fallback `changeme`.

- `admin`
- `petugas`
- `kasir`

## Modul Utama

- `/dashboard`
- `/items`
- `/stock-transactions`
- `/damaged-items`
- `/suppliers`
- `/customers`
- `/locations`
- `/history`
- `/barcode`
- `/sales`
- `/users`

## Catatan Upload GitHub

File berikut tidak ikut repository:

- `.env`
- `database/database.sqlite`
- `storage/app/private/*`
- `public/build`
- `node_modules`
- `vendor`

## Lisensi

Digunakan untuk kebutuhan pembelajaran dan pengembangan proyek sistem informasi.
