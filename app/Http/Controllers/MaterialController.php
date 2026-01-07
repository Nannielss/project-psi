<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MaterialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Material::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_bahan', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $materials = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Materials/Index', [
            'materials' => $materials,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nama_bahan' => 'required|string|max:255',
                'stok' => 'required|integer|min:0',
                'satuan' => 'required|string|max:255',
                'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'keterangan' => 'nullable|string',
            ]);

            // Handle photo upload
            if ($request->hasFile('foto')) {
                // Ensure directory exists
                $directory = storage_path('app/public/materials');
                if (!file_exists($directory)) {
                    mkdir($directory, 0755, true);
                }
                
                $validated['foto'] = $request->file('foto')->store('materials', 'public');
            }

            Material::create($validated);

            return redirect()->route('materials.index')
                ->with('success', 'Bahan berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Error storing material: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Terjadi kesalahan saat menyimpan bahan: ' . $e->getMessage()]);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Material $material)
    {
        try {
            $validated = $request->validate([
                'nama_bahan' => 'required|string|max:255',
                'stok' => 'required|integer|min:0',
                'satuan' => 'required|string|max:255',
                'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'keterangan' => 'nullable|string',
            ]);

            // Handle photo upload
            if ($request->hasFile('foto')) {
                // Ensure directory exists
                $directory = storage_path('app/public/materials');
                if (!file_exists($directory)) {
                    mkdir($directory, 0755, true);
                }
                
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

            return redirect()->route('materials.index')
                ->with('success', 'Bahan berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Error updating material: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'material_id' => $material->id,
                'request' => $request->all()
            ]);
            
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Terjadi kesalahan saat memperbarui bahan: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Material $material)
    {
        // Delete photo if exists
        if ($material->foto && Storage::disk('public')->exists($material->foto)) {
            Storage::disk('public')->delete($material->foto);
        }

        $material->delete();

        return redirect()->route('materials.index')
            ->with('success', 'Bahan berhasil dihapus.');
    }
}
