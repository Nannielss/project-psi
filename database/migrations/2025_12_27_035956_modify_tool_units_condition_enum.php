<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update all 'service' records to 'damaged'
        DB::table('tool_units')
            ->where('condition', 'service')
            ->update(['condition' => 'damaged']);

        // Modify the enum column to include 'scrapped' and remove 'service'
        // Note: MySQL doesn't support modifying enum directly, so we need to use raw SQL
        // Using backticks because 'condition' is a reserved keyword in MySQL
        DB::statement("ALTER TABLE tool_units MODIFY COLUMN `condition` ENUM('good', 'damaged', 'scrapped') DEFAULT 'good'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert 'scrapped' back to 'damaged' before reverting enum
        DB::table('tool_units')
            ->where('condition', 'scrapped')
            ->update(['condition' => 'damaged']);

        // Revert enum back to original
        DB::statement("ALTER TABLE tool_units MODIFY COLUMN `condition` ENUM('good', 'damaged', 'service') DEFAULT 'good'");
    }
};
