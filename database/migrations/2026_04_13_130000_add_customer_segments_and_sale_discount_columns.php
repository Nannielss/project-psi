<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('tier')->default('retail')->after('address');
            $table->string('category')->nullable()->after('tier');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('customer_mode')->default('non_member')->after('customer_id');
            $table->decimal('subtotal_amount', 15, 2)->default(0)->after('total_amount');
            $table->decimal('discount_amount', 15, 2)->default(0)->after('subtotal_amount');
        });

        DB::table('customers')->whereNull('category')->update(['category' => 'general']);
        DB::table('sales')->update([
            'customer_mode' => DB::raw("CASE WHEN customer_id IS NULL THEN 'non_member' ELSE 'member' END"),
            'subtotal_amount' => DB::raw('total_amount'),
            'discount_amount' => 0,
        ]);
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['customer_mode', 'subtotal_amount', 'discount_amount']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['tier', 'category']);
        });
    }
};
