<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('kode_barang')->unique();
            $table->string('nama_barang');
            $table->string('satuan')->default('pcs'); 
            $table->integer('stok')->default(0);
            $table->decimal('harga_grosir', 15, 2)->default(0);
            $table->decimal('harga_jual', 15, 2)->default(0);
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
