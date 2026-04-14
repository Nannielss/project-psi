<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function stockTransactions()
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function damagedItems()
    {
        return $this->hasMany(DamagedItem::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    protected static function booted()
    {
        static::creating(function ($item) {
            if (empty($item->kode_barang)) {
                $lastItem = self::orderBy('id', 'desc')->first();
                $lastId = $lastItem ? $lastItem->id : 0;
                // Generate auto increment code e.g. BRG-000001
                $item->kode_barang = 'BRG-' . str_pad($lastId + 1, 6, '0', STR_PAD_LEFT);
            }
        });
    }
}
