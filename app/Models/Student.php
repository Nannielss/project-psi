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
}
