<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damaged_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->integer('quantity');
            $table->string('kondisi'); // rusak, expired, hilang
            $table->text('catatan_maintenance')->nullable();
            $table->date('date_reported');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damaged_items');
    }
};
