<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ToolUnit extends Model
{
    protected $fillable = [
        'tool_id',
        'unit_number',
        'unit_code',
        'condition',
        'description',
    ];

    protected $casts = [
        'unit_number' => 'integer',
    ];

    /**
     * Get the tool that owns this unit.
     */
    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    /**
     * Get the tool loans for this unit.
     */
    public function toolLoans(): HasMany
    {
        return $this->hasMany(ToolLoan::class);
    }

    /**
     * Check if this unit is currently borrowed.
     */
    public function isBorrowed(): bool
    {
        return $this->toolLoans()->active()->exists();
    }

    /**
     * Get the active loan for this unit.
     */
    public function activeLoan()
    {
        return $this->toolLoans()->active()->first();
    }
}

