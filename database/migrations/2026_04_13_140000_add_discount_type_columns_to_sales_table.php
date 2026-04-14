<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('discount_type')->default('nominal')->after('discount_amount');
            $table->decimal('discount_value', 15, 2)->default(0)->after('discount_type');
        });

        DB::table('sales')->update([
            'discount_type' => 'nominal',
            'discount_value' => DB::raw('discount_amount'),
        ]);
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount_value']);
        });
    }
};
