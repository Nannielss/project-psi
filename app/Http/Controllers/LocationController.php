<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function index()
    {
        return Inertia::render('Locations/Index', [
            'locations' => Location::withCount('items')->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Location::create($validated);

        return redirect()->back()->with('success', 'Lokasi berhasil ditambahkan.');
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $location->update($validated);

        return redirect()->back()->with('success', 'Lokasi berhasil diperbarui.');
    }

    public function destroy(Location $location)
    {
        if ($location->items()->exists()) {
            return redirect()->back()->with('error', 'Lokasi masih dipakai oleh barang dan belum bisa dihapus.');
        }

        $location->delete();

        return redirect()->back()->with('success', 'Lokasi berhasil dihapus.');
    }
}
