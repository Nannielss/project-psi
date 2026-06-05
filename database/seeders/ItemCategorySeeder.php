<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\ItemCategory;
use Illuminate\Database\Seeder;

class ItemCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = collect([
            ['name' => 'Umum', 'slug' => 'umum', 'description' => 'Kategori default untuk barang umum.'],
            ['name' => 'Bahan Baku', 'slug' => 'bahan-baku', 'description' => 'Bahan utama produksi atau penjualan.'],
            ['name' => 'Minuman & Sirup', 'slug' => 'minuman-sirup', 'description' => 'Produk minuman, sirup, dan pendukung beverage.'],
            ['name' => 'Kemasan', 'slug' => 'kemasan', 'description' => 'Cup, paper bag, dus, dan kebutuhan packing.'],
            ['name' => 'Frozen & Cold Storage', 'slug' => 'frozen-cold-storage', 'description' => 'Barang yang memerlukan penyimpanan dingin.'],
            ['name' => 'Elektronik', 'slug' => 'elektronik', 'description' => 'Aksesoris dan barang elektronik.'],
        ])->mapWithKeys(function (array $category) {
            $record = ItemCategory::updateOrCreate(['slug' => $category['slug']], $category);

            return [$record->name => $record];
        });

        Item::where('nama_barang', 'Arabica Coffee Beans 1kg')->update(['item_category_id' => $categories['Bahan Baku']->id]);
        Item::where('nama_barang', 'Botol Sirup Vanilla')->update(['item_category_id' => $categories['Minuman & Sirup']->id]);
        Item::whereIn('nama_barang', ['Cup Plastik 16oz', 'Paper Bag Kraft Small'])->update(['item_category_id' => $categories['Kemasan']->id]);
        Item::where('nama_barang', 'Es Krim Gelato Mix')->update(['item_category_id' => $categories['Frozen & Cold Storage']->id]);
        Item::where('nama_barang', 'Kabel Charger USB-C')->update(['item_category_id' => $categories['Elektronik']->id]);
    }
}
