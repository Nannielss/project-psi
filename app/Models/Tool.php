<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tool extends Model
{
    protected $fillable = [
        'code',
        'name',
        'location',
        'photo',
        'description',
    ];

    /**
     * Get the units for this tool.
     */
    public function units(): HasMany
    {
        return $this->hasMany(ToolUnit::class);
    }
}

