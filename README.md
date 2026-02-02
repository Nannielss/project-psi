# Sistem Inventaris Sekolah (Inventory Web)

Sistem manajemen inventaris berbasis web untuk sekolah yang mencakup pengelolaan peminjaman alat, pengambilan bahan praktikum, data siswa, guru, dan mata pelajaran.

## Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Database](#-struktur-database)
- [Panduan Penggunaan](#-panduan-penggunaan)
- [API Routes](#-api-routes)
- [Role & Permissions](#-role--permissions)
- [Screenshots](#-screenshots)
- [Lisensi](#-lisensi)

## Tentang Proyek

**Inventory Web** adalah sistem manajemen inventaris sekolah yang dirancang untuk:

- Mengelola peminjaman alat/peralatan laboratorium
- Mencatat pengambilan bahan praktikum oleh guru
- Menyimpan data master siswa, guru, jurusan, dan mata pelajaran
- Menghasilkan QR Code untuk identifikasi siswa, guru, dan alat
- Melacak kondisi dan maintenance peralatan

Sistem ini menggunakan QR Code untuk mempercepat proses peminjaman dan pengembalian alat.

## Fitur Utama

### Manajemen Inventaris
- **Alat (Tools)**: CRUD alat dengan dukungan multiple unit per alat
- **Bahan (Materials)**: Manajemen stok bahan praktikum
- **Unit Alat**: Tracking kondisi setiap unit (baik, rusak, dibuang)
- **Maintenance**: Halaman khusus untuk pengelolaan alat rusak

### Peminjaman Alat (Tool Loans)
- Peminjaman dengan scan QR Code siswa/guru
- Scan QR Code alat untuk identifikasi
- Foto dokumentasi saat peminjaman dan pengembalian
- Riwayat peminjaman lengkap
- Export history ke Excel

### Pengambilan Bahan (Material Pickups)
- Pencatatan pengambilan bahan oleh guru
- Otomatis mengurangi stok
- Histori pengambilan

### Manajemen Data
- **Siswa**: Import dari Excel, generate QR Code
- **Guru**: Pengelolaan data guru dengan mata pelajaran
- **Jurusan**: Master data jurusan/program keahlian
- **Mata Pelajaran**: Relasi many-to-many dengan guru

### Autentikasi & Otorisasi
- Login berbasis role
- Device Location dengan password terpisah untuk akses peminjaman publik
- Session management

### QR Code
- Generate QR Code untuk siswa
- Generate QR Code untuk guru
- Generate QR Code untuk alat
- Print QR Code dalam batch

## Tech Stack

### Backend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| PHP | ^8.2 | Bahasa pemrograman utama |
| Laravel | ^12.0 | PHP Framework |
| Laravel Sanctum | ^4.0 | API Authentication |
| Inertia.js | ^2.0 | Modern monolith |
| PHPSpreadsheet | ^5.3 | Excel import/export |

### Frontend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| React | ^18.2 | UI Library |
| TypeScript | ^5.0 | Type-safe JavaScript |
| Tailwind CSS | ^3.2 | Utility-first CSS |
| Shadcn/ui | - | Component library |
| Radix UI | - | Headless UI components |
| Lucide React | - | Icons |
| html5-qrcode | ^2.3 | QR Code scanner |
| qrcode.react | ^4.2 | QR Code generator |

### Build Tools
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| Vite | ^7.0 | Build tool |
| ESLint | ^9.39 | Linting |

## Persyaratan Sistem

- **PHP** >= 8.2
- **Composer** >= 2.0
- **Node.js** >= 18.x atau **Bun**
- **MySQL** >= 8.0 / MySQL
- **Git**

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd inventory-web
```

### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies (pilih salah satu)
npm install
# atau
bun install
```

### 3. Setup Environment

```bash
# Copy file environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Konfigurasi Database

Edit file `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Migrasi Database

```bash
php artisan migrate
```

### 6. (Opsional) Seed Data

```bash
php artisan db:seed
```

### 7. Build Assets

```bash
# Development
npm run dev
# atau
bun run dev

# Production
npm run build
# atau
bun run build
```

### 8. Storage Link

```bash
php artisan storage:link
```

## Konfigurasi

### Konfigurasi Penting di `.env`

```env
APP_NAME="Inventaris Sekolah"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_web
DB_USERNAME=root
DB_PASSWORD=

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

## Menjalankan Aplikasi

### Development Mode

Gunakan script composer untuk menjalankan semua service sekaligus:

```bash
composer dev
```

Ini akan menjalankan:
- Laravel development server (`php artisan serve`)
- Queue listener (`php artisan queue:listen`)
- Vite dev server (`bun run dev`)

### Manual

```bash
# Terminal 1 - Laravel Server
php artisan serve

# Terminal 2 - Vite
npm run dev

# Terminal 3 - Queue (opsional)
php artisan queue:listen
```

Akses aplikasi di: `http://localhost:8000`

## Struktur Database

### Entity Relationship

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Students  │     │   Majors    │     │  Teachers   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │────▶│ id          │     │ id          │
│ nis         │     │ name        │     │ nip         │
│ name        │     └─────────────┘     │ name        │
│ major_id    │                         └──────┬──────┘
│ class       │                                │
└──────┬──────┘                                │
       │                                       │
       │         ┌─────────────────────────────┘
       │         │
       ▼         ▼
┌──────────────────┐     ┌─────────────┐     ┌─────────────┐
│    Tool Loans    │     │   Subjects  │     │   Users     │
├──────────────────┤     ├─────────────┤     ├─────────────┤
│ id               │     │ id          │     │ id          │
│ student_id       │     │ name        │     │ username    │
│ borrower_teacher │     │ code        │     │ password    │
│ tool_unit_id     │     └─────────────┘     │ role        │
│ teacher_id       │                         │ teacher_id  │
│ subject_id       │                         └─────────────┘
│ device_location  │
│ borrowed_at      │
│ returned_at      │
│ status           │
│ return_condition │
└────────┬─────────┘
         │
         ▼
┌─────────────┐     ┌─────────────┐
│  Tool Units │────▶│   Tools     │
├─────────────┤     ├─────────────┤
│ id          │     │ id          │
│ tool_id     │     │ code        │
│ unit_number │     │ name        │
│ unit_code   │     │ location    │
│ condition   │     │ photo       │
└─────────────┘     │ description │
                    └─────────────┘

┌─────────────┐     ┌──────────────────┐
│  Materials  │────▶│ Material Pickups │
├─────────────┤     ├──────────────────┤
│ id          │     │ id               │
│ nama_bahan  │     │ material_id      │
│ stok        │     │ teacher_id       │
│ satuan      │     │ jumlah           │
│ foto        │     │ keterangan       │
│ keterangan  │     └──────────────────┘
└─────────────┘

┌──────────────────┐
│ Device Locations │
├──────────────────┤
│ id               │
│ name             │
│ password         │
│ is_active        │
└──────────────────┘
```

### Daftar Model

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `User` | users | Data pengguna sistem |
| `Student` | students | Data siswa |
| `Teacher` | teachers | Data guru |
| `Major` | majors | Data jurusan |
| `Subject` | subjects | Data mata pelajaran |
| `Tool` | tools | Data alat |
| `ToolUnit` | tool_units | Unit per alat |
| `ToolLoan` | tool_loans | Transaksi peminjaman |
| `Material` | materials | Data bahan praktikum |
| `MaterialPickup` | material_pickups | Pengambilan bahan |
| `DeviceLocation` | device_locations | Lokasi device peminjaman |

## Panduan Penggunaan

### 1. Login Admin

1. Akses halaman login di `/login`
2. Masukkan username dan password
3. Setelah login, Anda akan diarahkan ke Dashboard

### 2. Proses Peminjaman Alat (Publik)

1. Akses halaman peminjaman di `/tool-loans`
2. Pilih lokasi dan masukkan password lokasi
3. Pilih menu **Pinjam**
4. Scan QR Code siswa atau guru
5. Scan QR Code alat yang akan dipinjam
6. Pilih guru penanggung jawab dan mata pelajaran
7. Ambil foto dokumentasi
8. Konfirmasi peminjaman

### 3. Proses Pengembalian Alat

1. Akses halaman peminjaman di `/tool-loans`
2. Pilih lokasi (jika belum login lokasi)
3. Pilih menu **Kembali**
4. Scan QR Code siswa/guru yang meminjam
5. Pilih alat yang akan dikembalikan
6. Pilih kondisi alat (baik/rusak)
7. Ambil foto dokumentasi
8. Konfirmasi pengembalian

### 4. Import Data Siswa

1. Login sebagai Admin/Kajur/Wakajur
2. Buka menu **Siswa**
3. Klik tombol **Import**
4. Download template Excel terlebih dahulu
5. Isi data sesuai format template
6. Upload file Excel
7. Data siswa akan diimport

### 5. Print QR Code

1. Login ke sistem
2. Buka menu **Print QR**
3. Pilih kategori (Siswa/Guru/Alat)
4. Pilih item yang akan dicetak QR-nya
5. Klik Print

## API Routes

### Public Routes (Tanpa Auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/tool-loans` | Halaman index peminjaman |
| GET | `/tool-loans/location-login` | Halaman login lokasi |
| POST | `/tool-loans/location-login` | Verifikasi password lokasi |
| GET | `/tool-loans/borrow` | Halaman peminjaman |
| GET | `/tool-loans/return` | Halaman pengembalian |
| POST | `/tool-loans/verify-borrower` | Verifikasi peminjam |
| POST | `/tool-loans/verify-tool` | Verifikasi alat |
| POST | `/tool-loans/borrow` | Simpan peminjaman |
| POST | `/tool-loans/return` | Simpan pengembalian |

### Protected Routes (Dengan Auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/dashboard` | Dashboard utama |
| GET | `/history` | Riwayat peminjaman |
| GET | `/history/export` | Export history Excel |
| Resource | `/students` | CRUD Siswa |
| Resource | `/teachers` | CRUD Guru |
| Resource | `/majors` | CRUD Jurusan |
| Resource | `/subjects` | CRUD Mata Pelajaran |
| Resource | `/tools` | CRUD Alat |
| Resource | `/materials` | CRUD Bahan |
| Resource | `/users` | CRUD Pengguna |
| Resource | `/device-locations` | CRUD Lokasi Device |
| GET | `/maintenance` | Halaman maintenance |
| GET | `/material-pickups` | Pengambilan bahan |
| GET | `/print-qr` | Print QR Code |

## Role & Permissions

### Daftar Role

| Role | Deskripsi |
|------|-----------|
| `admin` | Administrator sistem, akses penuh |
| `kajur` | Kepala Jurusan |
| `wakajur` | Wakil Kepala Jurusan |
| `guru` | Guru (akses terbatas) |

## Struktur Folder

```
inventory-web/
├── app/
│   ├── Console/Commands/     # Artisan commands
│   ├── Http/
│   │   ├── Controllers/      # HTTP Controllers
│   │   ├── Middleware/       # HTTP Middleware
│   │   └── Requests/         # Form Requests
│   ├── Models/               # Eloquent Models
│   └── Providers/            # Service Providers
├── bootstrap/                # Bootstrap files
├── config/                   # Configuration files
├── database/
│   ├── factories/            # Model factories
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── public/                   # Public assets
├── resources/
│   ├── css/                  # CSS files
│   ├── js/                   # React/TypeScript files
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── layouts/          # Layout components
│   │   ├── lib/              # Utility functions
│   │   ├── pages/            # Inertia pages
│   │   └── types/            # TypeScript types
│   └── views/                # Blade templates
├── routes/
│   ├── auth.php              # Auth routes
│   ├── console.php           # Console routes
│   └── web.php               # Web routes
├── storage/                  # Storage files
├── tests/                    # Test files
└── vendor/                   # Composer dependencies
```

## Testing

```bash
# Jalankan semua tests
php artisan test

# Atau menggunakan composer
composer test

# Jalankan dengan coverage
php artisan test --coverage
```

## Scripts

| Script | Deskripsi |
|--------|-----------|
| `composer setup` | Setup lengkap project |
| `composer dev` | Jalankan development server |
| `composer test` | Jalankan tests |
| `npm run dev` / `bun run dev` | Jalankan Vite dev server |
| `npm run build` / `bun run build` | Build assets untuk production |
| `npm run lint` | Jalankan ESLint |
| `npm run lint:fix` | Fix ESLint errors |

## Troubleshooting

### Storage Permission Error

```bash
chmod -R 775 storage bootstrap/cache
```

### Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Regenerate Autoload

```bash
composer dump-autoload
```

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](https://opensource.org/licenses/MIT).
