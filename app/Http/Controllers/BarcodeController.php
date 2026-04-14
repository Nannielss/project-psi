<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Location;
use Inertia\Inertia;
use Inertia\Response;

class BarcodeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Barcode/Index', [
            'items' => Item::query()
                ->select('id', 'kode_barang', 'nama_barang', 'satuan', 'stok', 'harga_jual', 'location_id')
                ->latest()
                ->get(),
            'locations' => Location::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
