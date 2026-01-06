<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Teacher::with('subjects');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nip', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        $subjects = Subject::orderBy('nama')->get();

        return Inertia::render('Teachers/Index', [
            'teachers' => $teachers,
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
            'nip' => 'required|string|unique:teachers,nip|max:255',
            'name' => 'required|string|max:255',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $teacher = Teacher::create([
            'nip' => $validated['nip'],
            'name' => $validated['name'],
        ]);

        if (!empty($validated['subject_ids'])) {
            $teacher->subjects()->attach($validated['subject_ids']);
        }

        return redirect()->route('teachers.index')
            ->with('success', 'Guru berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Teacher $teacher)
    {
        $user = auth()->user();
        
        // If user is guru, they can only edit their own teacher record
        if ($user && $user->role === 'guru') {
            // Check if this teacher is linked to the current user
            if (!$user->teacher_id || $user->teacher_id !== $teacher->id) {
                abort(403, 'Anda hanya dapat mengedit mapel guru Anda sendiri.');
            }
            
            // Guru can only update subject_ids, not nip or name
            $validated = $request->validate([
                'subject_ids' => 'nullable|array',
                'subject_ids.*' => 'exists:subjects,id',
            ]);
            
            // Sync subjects only
            $teacher->subjects()->sync($validated['subject_ids'] ?? []);
            
            return redirect()->route('teachers.index')
                ->with('success', 'Mapel berhasil diperbarui.');
        }
        
        // Admin, kajur, wakajur can edit everything
        $validated = $request->validate([
            'nip' => 'required|string|max:255|unique:teachers,nip,' . $teacher->id,
            'name' => 'required|string|max:255',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $teacher->update([
            'nip' => $validated['nip'],
            'name' => $validated['name'],
        ]);

        // Sync subjects
        $teacher->subjects()->sync($validated['subject_ids'] ?? []);

        return redirect()->route('teachers.index')
            ->with('success', 'Guru berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Teacher $teacher)
    {
        $teacher->delete();

        return redirect()->route('teachers.index')
            ->with('success', 'Guru berhasil dihapus.');
    }

    /**
     * Get all teachers for QR printing (without pagination).
     */
    public function forQr(Request $request)
    {
        $query = Teacher::with('subjects');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nip', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $teachers,
        ]);
    }
}
