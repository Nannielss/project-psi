<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $categoryId = DB::table('item_categories')->insertGetId([
            'name' => 'Umum',
            'slug' => Str::slug('Umum'),
            'description' => 'Kategori default untuk barang yang belum dikelompokkan.',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('item_category_id')
                ->nullable()
                ->after('nama_barang')
                ->constrained('item_categories')
                ->nullOnDelete();
        });

        DB::table('items')->update(['item_category_id' => $categoryId]);
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('item_category_id');
        });
    }
};
