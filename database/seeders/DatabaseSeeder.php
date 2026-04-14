<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\DamagedItem;
use App\Models\Item;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockTransaction;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $password = Hash::make(env('ADMIN_DEFAULT_PASSWORD', 'changeme'));

            $admin = User::updateOrCreate(
                ['username' => 'admin'],
                ['password' => $password, 'role' => 'admin', 'name' => 'Administrator', 'email' => 'admin@velocity.test'],
            );

            $warehouseStaff = User::updateOrCreate(
                ['username' => 'petugas'],
                ['password' => $password, 'role' => 'petugas', 'name' => 'Petugas Gudang', 'email' => 'petugas@velocity.test'],
            );

            $cashier = User::updateOrCreate(
                ['username' => 'kasir'],
                ['password' => $password, 'role' => 'kasir', 'name' => 'Kasir Utama', 'email' => 'kasir@velocity.test'],
            );

            $locations = collect([
                ['name' => 'Gudang Utama', 'description' => 'Pusat penyimpanan stok reguler dan fast moving items'],
                ['name' => 'Rak A1', 'description' => 'Rak barang retail dan penjualan harian'],
                ['name' => 'Cold Storage', 'description' => 'Penyimpanan produk sensitif suhu'],
                ['name' => 'Area Packing', 'description' => 'Buffer stok untuk pengiriman reseller'],
            ])->mapWithKeys(function (array $location) {
                $record = Location::updateOrCreate(['name' => $location['name']], $location);

                return [$record->name => $record];
            });

            collect([
                ['name' => 'Global Logistic Supply', 'phone' => '0812-1200-4500', 'address' => 'Jl. Industri Raya No. 15, Bekasi'],
                ['name' => 'Sinar Pangan Nusantara', 'phone' => '0813-2200-8700', 'address' => 'Jl. Niaga Timur No. 8, Jakarta'],
                ['name' => 'Berkah Elektronik Grosir', 'phone' => '0821-3344-5500', 'address' => 'Jl. Cempaka Baru No. 21, Tangerang'],
                ['name' => 'Fresh Mart Distribution', 'phone' => '0819-7150-6000', 'address' => 'Jl. Jababeka Selatan Blok C-12'],
            ])->each(fn (array $supplier) => Supplier::updateOrCreate(['name' => $supplier['name']], $supplier));

            $customers = collect([
                [
                    'shop_name' => 'Toko Makmur Jaya',
                    'phone' => '0812-3456-7890',
                    'address' => 'Jl. Gajah Mada No. 12, Jakarta',
                    'tier' => 'retail',
                    'category' => 'kelontong',
                ],
                [
                    'shop_name' => 'Pusat Grosir Indo',
                    'phone' => '0811-2233-4455',
                    'address' => 'Kawasan Industri Delta, Bekasi',
                    'tier' => 'wholesale',
                    'category' => 'distributor',
                ],
                [
                    'shop_name' => 'Rumah Digital',
                    'phone' => '0856-7788-9900',
                    'address' => 'Jl. Melati No. 8, Bogor',
                    'tier' => 'member',
                    'category' => 'elektronik',
                ],
                [
                    'shop_name' => 'Cafe Sudut Kota',
                    'phone' => '0813-9900-1122',
                    'address' => 'Jl. Pahlawan No. 17, Depok',
                    'tier' => 'member',
                    'category' => 'cafe',
                ],
                [
                    'shop_name' => 'Direct Walk-in',
                    'phone' => null,
                    'address' => 'Pembeli umum toko depan',
                    'tier' => 'retail',
                    'category' => 'general',
                ],
            ])->mapWithKeys(function (array $customer) {
                $record = Customer::updateOrCreate(['shop_name' => $customer['shop_name']], $customer);

                return [$record->shop_name => $record];
            });

            $items = collect([
                [
                    'kode_barang' => 'BRG-000101',
                    'nama_barang' => 'Arabica Coffee Beans 1kg',
                    'satuan' => 'kg',
                    'stok' => 80,
                    'harga_grosir' => 110000,
                    'harga_jual' => 145000,
                    'location_id' => $locations['Gudang Utama']->id,
                ],
                [
                    'kode_barang' => 'BRG-000102',
                    'nama_barang' => 'Botol Sirup Vanilla',
                    'satuan' => 'pcs',
                    'stok' => 45,
                    'harga_grosir' => 48000,
                    'harga_jual' => 69000,
                    'location_id' => $locations['Rak A1']->id,
                ],
                [
                    'kode_barang' => 'BRG-000103',
                    'nama_barang' => 'Cup Plastik 16oz',
                    'satuan' => 'dus',
                    'stok' => 30,
                    'harga_grosir' => 185000,
                    'harga_jual' => 235000,
                    'location_id' => $locations['Area Packing']->id,
                ],
                [
                    'kode_barang' => 'BRG-000104',
                    'nama_barang' => 'Es Krim Gelato Mix',
                    'satuan' => 'kg',
                    'stok' => 18,
                    'harga_grosir' => 95000,
                    'harga_jual' => 135000,
                    'location_id' => $locations['Cold Storage']->id,
                ],
                [
                    'kode_barang' => 'BRG-000105',
                    'nama_barang' => 'Paper Bag Kraft Small',
                    'satuan' => 'dus',
                    'stok' => 24,
                    'harga_grosir' => 76000,
                    'harga_jual' => 98000,
                    'location_id' => $locations['Area Packing']->id,
                ],
                [
                    'kode_barang' => 'BRG-000106',
                    'nama_barang' => 'Kabel Charger USB-C',
                    'satuan' => 'pcs',
                    'stok' => 60,
                    'harga_grosir' => 22000,
                    'harga_jual' => 39000,
                    'location_id' => $locations['Rak A1']->id,
                ],
            ])->mapWithKeys(function (array $item) {
                $record = Item::updateOrCreate(['nama_barang' => $item['nama_barang']], $item);

                return [$record->nama_barang => $record];
            });

            if (StockTransaction::count() === 0) {
                $this->createStockTransaction($items['Arabica Coffee Beans 1kg'], $warehouseStaff, 'in', 25, 'Restock awal mingguan', Carbon::now()->subDays(8));
                $this->createStockTransaction($items['Cup Plastik 16oz'], $warehouseStaff, 'in', 18, 'Restock bulk untuk reseller', Carbon::now()->subDays(5));
                $this->createStockTransaction($items['Paper Bag Kraft Small'], $warehouseStaff, 'adjustment', -4, 'Penyesuaian setelah stock opname', Carbon::now()->subDays(3));
                $this->createStockTransaction($items['Kabel Charger USB-C'], $admin, 'in', 15, 'Barang masuk dari supplier baru', Carbon::now()->subDay());
            }

            if (Sale::count() === 0) {
                $this->createSale($cashier, $customers['Toko Makmur Jaya'], [
                    ['item' => $items['Arabica Coffee Beans 1kg'], 'quantity' => 3],
                    ['item' => $items['Botol Sirup Vanilla'], 'quantity' => 4],
                ], Carbon::now()->subDays(2), 'Penjualan reseller reguler', 'transfer', null, 10, 'percent');

                $this->createSale($cashier, $customers['Pusat Grosir Indo'], [
                    ['item' => $items['Cup Plastik 16oz'], 'quantity' => 2],
                    ['item' => $items['Paper Bag Kraft Small'], 'quantity' => 1],
                ], Carbon::now()->subDay(), 'Order bulk mingguan', 'qris', null, 50000, 'nominal');

                $this->createSale($cashier, null, [
                    ['item' => $items['Kabel Charger USB-C'], 'quantity' => 5],
                ], Carbon::now()->subHours(4), 'Walk-in store', 'cash', 250000);
            }

            Sale::query()->whereNull('cash_received')->update([
                'payment_method' => 'cash',
                'cash_received' => DB::raw('total_amount'),
                'change_amount' => 0,
            ]);

            if (DamagedItem::count() === 0) {
                $this->createDamagedRecord(
                    $items['Es Krim Gelato Mix'],
                    2,
                    'expired',
                    'Batch lama dipisahkan untuk pemusnahan.',
                    Carbon::now()->subDays(1),
                );

                $this->createDamagedRecord(
                    $items['Botol Sirup Vanilla'],
                    1,
                    'rusak',
                    'Segel botol rusak saat bongkar muat.',
                    Carbon::now()->subDays(4),
                );
            }
        });
    }

    private function createStockTransaction(Item $item, User $user, string $type, int $quantity, string $remarks, Carbon $timestamp): void
    {
        StockTransaction::create([
            'item_id' => $item->id,
            'user_id' => $user->id,
            'type' => $type,
            'quantity' => $quantity,
            'remarks' => $remarks,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        $item->update([
            'stok' => match ($type) {
                'in' => $item->stok + $quantity,
                'out' => $item->stok - $quantity,
                'adjustment' => $item->stok + $quantity,
                default => $item->stok,
            },
        ]);
    }

    private function createSale(
        User $cashier,
        ?Customer $customer,
        array $lines,
        Carbon $timestamp,
        string $notes,
        string $paymentMethod = 'cash',
        ?float $cashReceived = null,
        float $discountValue = 0,
        string $discountType = 'nominal'
    ): void
    {
        $subtotal = collect($lines)->sum(fn (array $line) => (float) $line['item']->harga_jual * $line['quantity']);
        $discountAmount = $discountType === 'percent'
            ? round($subtotal * min($discountValue, 100) / 100, 2)
            : min($discountValue, $subtotal);
        $total = max($subtotal - $discountAmount, 0);
        $cashValue = $paymentMethod === 'cash' ? ($cashReceived ?? $total) : $total;
        $changeAmount = $paymentMethod === 'cash' ? max($cashValue - $total, 0) : 0;

        $sale = Sale::create([
            'customer_id' => $customer?->id,
            'customer_mode' => $customer ? 'member' : 'non_member',
            'user_id' => $cashier->id,
            'subtotal_amount' => $subtotal,
            'discount_amount' => $discountAmount,
            'discount_type' => $discountType,
            'discount_value' => $discountType === 'percent' ? min($discountValue, 100) : min($discountValue, $subtotal),
            'total_amount' => $total,
            'payment_method' => $paymentMethod,
            'cash_received' => $cashValue,
            'change_amount' => $changeAmount,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        foreach ($lines as $line) {
            /** @var Item $item */
            $item = $line['item'];
            $quantity = (int) $line['quantity'];
            $price = (float) $item->harga_jual;

            SaleItem::create([
                'sale_id' => $sale->id,
                'item_id' => $item->id,
                'quantity' => $quantity,
                'price' => $price,
                'subtotal' => $price * $quantity,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            $item->decrement('stok', $quantity);

            StockTransaction::create([
                'item_id' => $item->id,
                'user_id' => $cashier->id,
                'type' => 'out',
                'quantity' => $quantity,
                'remarks' => 'Seeder kasir #' . $sale->id . ' - ' . $notes,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }

    private function createDamagedRecord(Item $item, int $quantity, string $condition, string $note, Carbon $date): void
    {
        DamagedItem::create([
            'item_id' => $item->id,
            'quantity' => $quantity,
            'kondisi' => $condition,
            'catatan_maintenance' => $note,
            'date_reported' => $date->toDateString(),
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        $item->decrement('stok', $quantity);
    }
}
