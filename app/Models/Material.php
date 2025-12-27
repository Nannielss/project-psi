<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    protected $fillable = [
        'nama_bahan',
        'stok',
        'satuan',
        'foto',
        'keterangan',
    ];

    /**
     * Get the pickups for this material.
     */
    public function pickups(): HasMany
    {
        return $this->hasMany(MaterialPickup::class);
    }
}
