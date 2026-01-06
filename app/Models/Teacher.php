<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Teacher extends Model
{
    protected $fillable = [
        'nip',
        'name',
    ];

    /**
     * Get the subjects taught by this teacher.
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject');
    }

    /**
     * Get the user associated with this teacher.
     */
    public function user()
    {
        return $this->hasOne(User::class);
    }
}
