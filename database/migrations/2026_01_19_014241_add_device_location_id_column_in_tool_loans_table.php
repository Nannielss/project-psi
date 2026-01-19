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
        Schema::table('tool_loans', function (Blueprint $table) {
            $table->foreignId('device_location_id')
                ->nullable()
                ->after('id')
                ->constrained('device_locations')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tool_loans', function (Blueprint $table) {
            $table->dropForeign(['device_location_id']);
            $table->dropColumn('device_location_id');
        });
    }
};
