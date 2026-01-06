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
            // Make student_id nullable to support teacher borrowing
            $table->foreignId('student_id')->nullable()->change();
            
            // Add borrower_teacher_id for teacher self-borrowing
            $table->foreignId('borrower_teacher_id')->nullable()->after('student_id')->constrained('teachers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tool_loans', function (Blueprint $table) {
            $table->dropForeign(['borrower_teacher_id']);
            $table->dropColumn('borrower_teacher_id');
            
            // Revert student_id to not nullable (if needed)
            // Note: This might fail if there are null values
            $table->foreignId('student_id')->nullable(false)->change();
        });
    }
};


