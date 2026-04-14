<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DamagedItem extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date_reported' => 'date',
            'quantity' => 'integer',
        ];
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
