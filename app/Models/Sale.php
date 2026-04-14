<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'subtotal_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'cash_received' => 'decimal:2',
            'change_amount' => 'decimal:2',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
