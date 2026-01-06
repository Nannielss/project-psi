<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Subject::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('nama', 'like', "%{$search}%");
        }

        $subjects = $query->orderBy('nama')->paginate(10)->withQueryString();

        return Inertia::render('Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:subjects,nama',
        ]);

        $subject = Subject::create($validated);

        // If request comes from teachers page, redirect back to teachers
        if ($request->has('from') && $request->from === 'teachers') {
            return redirect()->route('teachers.index')
                ->with('success', 'Mata pelajaran berhasil ditambahkan.');
        }

        return redirect()->route('subjects.index')
            ->with('success', 'Mata pelajaran berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:subjects,nama,' . $subject->id,
        ]);

        $subject->update($validated);

        return redirect()->route('subjects.index')
            ->with('success', 'Mata pelajaran berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {
        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', 'Mata pelajaran berhasil dihapus.');
    }
}
