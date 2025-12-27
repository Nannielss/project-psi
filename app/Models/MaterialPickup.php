<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialPickup extends Model
{
    protected $fillable = [
        'material_id',
        'teacher_id',
        'jumlah',
        'keterangan',
    ];

    /**
     * Get the material for this pickup.
     */
    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * Get the teacher for this pickup.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
