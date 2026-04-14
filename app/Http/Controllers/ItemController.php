<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function index()
    {
        $items = Item::with('location')->latest()->get();
        $locations = Location::all();
        return Inertia::render('Items/Index', [
            'items' => $items,
            'locations' => $locations
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_barang' => 'required|string|max:255',
            'satuan' => 'required|string|max:50',
            'stok' => 'required|integer|min:0',
            'harga_grosir' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        Item::create($validated);

        return redirect()->back()->with('success', 'Barang berhasil ditambahkan.');
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'nama_barang' => 'required|string|max:255',
            'satuan' => 'required|string|max:50',
            'stok' => 'required|integer|min:0',
            'harga_grosir' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'Data barang berhasil diupdate.');
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return redirect()->back()->with('success', 'Barang berhasil dihapus.');
    }
}
