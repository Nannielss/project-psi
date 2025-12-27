<?php

namespace App\Http\Controllers;

use App\Models\Major;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MajorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Major::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $majors = $query->orderBy('name')->paginate(10)->withQueryString();

        return Inertia::render('Majors/Index', [
            'majors' => $majors,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|unique:majors,kode|max:10',
            'name' => 'required|string|max:255',
        ]);

        Major::create($validated);

        return redirect()->route('majors.index')
            ->with('success', 'Jurusan berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Major $major)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:10|unique:majors,kode,' . $major->id,
            'name' => 'required|string|max:255',
        ]);

        $major->update($validated);

        return redirect()->route('majors.index')
            ->with('success', 'Jurusan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Major $major)
    {
        // Check if major has students
        if ($major->students()->count() > 0) {
            return redirect()->route('majors.index')
                ->with('error', 'Jurusan tidak dapat dihapus karena masih memiliki siswa.');
        }

        $major->delete();

        return redirect()->route('majors.index')
            ->with('success', 'Jurusan berhasil dihapus.');
    }
}
