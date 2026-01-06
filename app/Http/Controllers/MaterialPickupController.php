<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialPickup;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MaterialPickupController extends Controller
{
    /**
     * Show the form for creating a new material pickup.
     * Redirect to materials page since it's now combined.
     */
    public function create()
    {
        return redirect()->route('materials.index');
    }

    /**
     * Store a newly created material pickup.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'teacher_id' => 'required|exists:teachers,id',
            'jumlah' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        // Check if material has enough stock
        $material = Material::findOrFail($validated['material_id']);
        if ($material->stok < $validated['jumlah']) {
            return redirect()->back()
                ->withErrors(['jumlah' => 'Stok tidak mencukupi. Stok tersedia: ' . $material->stok])
                ->withInput();
        }

        // Create pickup record
        MaterialPickup::create($validated);

        // Update material stock
        $material->decrement('stok', $validated['jumlah']);

        return redirect()->route('material-pickups.index')
            ->with('success', 'Pengambilan bahan berhasil dicatat.');
    }

    /**
     * Display a listing of material pickups.
     */
    public function index(Request $request): Response
    {
        $query = MaterialPickup::with(['material', 'teacher']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('material', function ($q) use ($search) {
                    $q->where('nama_bahan', 'like', "%{$search}%");
                })
                ->orWhereHas('teacher', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%");
                });
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $pickups = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('MaterialPickups/Index', [
            'pickups' => $pickups,
            'filters' => $request->only(['search', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Store a newly created material.
     */
    public function storeMaterial(Request $request)
    {
        $validated = $request->validate([
            'nama_bahan' => 'required|string|max:255',
            'stok' => 'required|integer|min:0',
            'satuan' => 'required|string|max:255',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'keterangan' => 'nullable|string',
        ]);

        // Handle photo upload
        if ($request->hasFile('foto')) {
            $validated['foto'] = $request->file('foto')->store('materials', 'public');
        }

        Material::create($validated);

        return redirect()->route('material-pickups.create')
            ->with('success', 'Bahan berhasil ditambahkan.');
    }

    /**
     * Update the specified material.
     */
    public function updateMaterial(Request $request, Material $material)
    {
        $validated = $request->validate([
            'nama_bahan' => 'required|string|max:255',
            'stok' => 'required|integer|min:0',
            'satuan' => 'required|string|max:255',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'keterangan' => 'nullable|string',
        ]);

        // Handle photo upload
        if ($request->hasFile('foto')) {
            // Delete old photo if exists
            if ($material->foto && Storage::disk('public')->exists($material->foto)) {
                Storage::disk('public')->delete($material->foto);
            }
            $validated['foto'] = $request->file('foto')->store('materials', 'public');
        } else {
            // Keep existing photo if not uploading new one
            unset($validated['foto']);
        }

        $material->update($validated);

        return redirect()->route('material-pickups.create')
            ->with('success', 'Bahan berhasil diperbarui.');
    }

    /**
     * Remove the specified material.
     */
    public function destroyMaterial(Material $material)
    {
        // Delete photo if exists
        if ($material->foto && Storage::disk('public')->exists($material->foto)) {
            Storage::disk('public')->delete($material->foto);
        }

        $material->delete();

        return redirect()->route('material-pickups.create')
            ->with('success', 'Bahan berhasil dihapus.');
    }
}
