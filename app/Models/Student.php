<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = [
        'nis',
        'name',
        'major_id',
        'class',
    ];

    /**
     * Get the major that owns the student.
     */
    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class);
    }

    /**
     * Get the tool loans for this student.
     */
    public function toolLoans(): HasMany
    {
        return $this->hasMany(ToolLoan::class);
    }

    /**
     * Check if student has an active loan.
     */
    public function hasActiveLoan(): bool
    {
        return $this->toolLoans()->active()->exists();
    }

    /**
     * Get the active loan for this student.
     */
    public function activeLoan()
    {
        return $this->toolLoans()->active()->first();
    }

    /**
     * Check if student can borrow today (same-day borrowing allowed).
     * Returns true if:
     * - No active loans, OR
     * - All active loans were borrowed today (same calendar day, until midnight)
     */
    public function canBorrowToday(): bool
    {
        $activeLoans = $this->toolLoans()->active()->get();
        
        // If no active loans, can borrow
        if ($activeLoans->isEmpty()) {
            return true;
        }

        // Get today's date string (Y-m-d format) using Asia/Jakarta timezone
        $todayDate = now()->setTimezone('Asia/Jakarta')->format('Y-m-d');
        
        // Check if all active loans were borrowed today (same calendar day)
        // If any loan was borrowed before today, student cannot borrow
        $allBorrowedToday = $activeLoans->every(function ($loan) use ($todayDate) {
            // Format borrowed_at date to Y-m-d using Asia/Jakarta timezone for comparison
            $borrowedDate = $loan->borrowed_at->setTimezone('Asia/Jakarta')->format('Y-m-d');
            return $borrowedDate === $todayDate;
        });

        return $allBorrowedToday;
    }
}
