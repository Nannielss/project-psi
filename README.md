# Sistem Manajemen Stock Gudang & Kasir

Aplikasi web berbasis Laravel, Inertia, React, dan TypeScript untuk mengelola persediaan gudang, restock, barang rusak, pelanggan/reseller, barcode, riwayat transaksi, dan kasir penjualan.

## Fitur Utama

- Dashboard gudang dengan ringkasan stok, nilai inventaris, transaksi hari ini, dan restock terbaru
- Master barang dengan indikator stok (hijau, kuning, merah)
- Manajemen stok masuk, stok keluar, dan penyesuaian manual
- Barang rusak / expired yang otomatis memengaruhi stok
- Supplier, pelanggan / reseller, dan lokasi penyimpanan
- Barcode barang dan halaman cetak barcode
- Kasir penjualan dengan:
  - Member / non-member
  - Diskon nominal atau persen
  - Metode pembayaran: cash, transfer, QRIS, debit
  - Hitung uang diterima dan kembalian
  - Cetak struk thermal 58mm
- Riwayat transaksi lengkap dengan detail barang, pembeli, kasir, dan pembayaran
- Role akses: `admin`, `petugas`, dan `kasir`
- Branding usaha: nama toko, tagline, alamat, telepon, dan logo
- Dark mode, light mode, dan system mode

## Tech Stack

- PHP 8.4+
- Laravel 12
- Inertia.js
- React + TypeScript
- Tailwind CSS
- Vite
- SQLite / MySQL

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

## Akun Default (Seeder)

Password default mengikuti `ADMIN_DEFAULT_PASSWORD` di `.env`, fallback ke `changeme`.

| Username | Role |
|---|---|
| `admin` | Admin |
| `petugas` | Petugas Gudang |
| `kasir` | Kasir |

## Modul

| Route | Deskripsi |
|---|---|
| `/dashboard` | Ringkasan stok dan transaksi |
| `/items` | Master barang |
| `/stock-transactions` | Transaksi stok masuk/keluar |
| `/damaged-items` | Barang rusak / expired |
| `/suppliers` | Data supplier |
| `/customers` | Pelanggan / reseller |
| `/locations` | Lokasi penyimpanan |
| `/history` | Riwayat transaksi lengkap |
| `/barcode` | Cetak barcode barang |
| `/sales` | Kasir penjualan |
| `/users` | Manajemen pengguna |
