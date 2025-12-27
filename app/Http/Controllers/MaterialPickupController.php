<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialPickup;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaterialPickupController extends Controller
{
    /**
     * Show the form for creating a new material pickup.
     */
    public function create(): Response
    {
        $materials = Material::orderBy('nama_bahan')->get();

        return Inertia::render('MaterialPickups/Create', [
            'materials' => $materials,
        ]);
    }

    /**
     * Verify QR code and return teacher data.
     */
    public function verifyQR(Request $request)
    {
        $request->validate([
            'nip' => 'required|string',
        ]);

        $teacher = Teacher::where('nip', $request->nip)->first();

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Guru dengan NIP tersebut tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'teacher' => $teacher->load('subjects'),
        ]);
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
}
