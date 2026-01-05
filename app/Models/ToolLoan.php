<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ToolLoan extends Model
{
    protected $fillable = [
        'student_id',
        'tool_unit_id',
        'teacher_id',
        'subject_id',
        'borrow_photo',
        'return_photo',
        'borrowed_at',
        'returned_at',
        'status',
        'return_condition',
        'notes',
    ];

    protected $casts = [
        'borrowed_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    /**
     * Get the student that owns the loan.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the tool unit that is loaned.
     */
    public function toolUnit(): BelongsTo
    {
        return $this->belongsTo(ToolUnit::class);
    }

    /**
     * Get the teacher associated with the loan.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Get the subject associated with the loan.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Scope a query to only include active (borrowed) loans.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'borrowed');
    }

    /**
     * Scope a query to only include returned loans.
     */
    public function scopeReturned(Builder $query): Builder
    {
        return $query->where('status', 'returned');
    }
}
