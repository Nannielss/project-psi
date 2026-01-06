<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (Schema::hasColumn('subjects', 'hari')) {
                $table->dropColumn('hari');
            }
            if (Schema::hasColumn('subjects', 'jam_mulai')) {
                $table->dropColumn('jam_mulai');
            }
            if (Schema::hasColumn('subjects', 'jam_selesai')) {
                $table->dropColumn('jam_selesai');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'hari')) {
                $table->string('hari')->nullable()->after('nama');
            }
            if (!Schema::hasColumn('subjects', 'jam_mulai')) {
                $table->time('jam_mulai')->nullable()->after('hari');
            }
            if (!Schema::hasColumn('subjects', 'jam_selesai')) {
                $table->time('jam_selesai')->nullable()->after('jam_mulai');
            }
        });
    }
};
