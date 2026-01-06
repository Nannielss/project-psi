<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        $users = $query->with('teacher')->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        $teachers = Teacher::orderBy('name')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'teachers' => $teachers,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $allowedRoles = ['admin', 'kajur', 'wakajur', 'guru'];
        
        // Only admin can create users with role admin
        if ($user->role !== 'admin') {
            $allowedRoles = array_filter($allowedRoles, fn($role) => $role !== 'admin');
        }
        
        // Wakajur cannot create users with role kajur
        if ($user->role === 'wakajur') {
            $allowedRoles = array_filter($allowedRoles, fn($role) => $role !== 'kajur');
        }

        $validated = $request->validate([
            'username' => 'required|string|unique:users,username|max:255',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:' . implode(',', $allowedRoles),
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        // Validate teacher_id is required for guru role
        if ($validated['role'] === 'guru' && empty($validated['teacher_id'])) {
            return redirect()->back()
                ->withErrors(['teacher_id' => 'Guru harus dipilih untuk role guru.'])
                ->withInput();
        }

        // Validate teacher_id can only be set for guru, kajur, or wakajur role
        $rolesCanLinkTeacher = ['guru', 'kajur', 'wakajur'];
        if (!in_array($validated['role'], $rolesCanLinkTeacher) && !empty($validated['teacher_id'])) {
            return redirect()->back()
                ->withErrors(['teacher_id' => 'Teacher hanya dapat di-link untuk role guru, kajur, atau wakajur.'])
                ->withInput();
        }

        $userData = [
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ];

        // Set teacher_id for guru, kajur, or wakajur
        if (in_array($validated['role'], $rolesCanLinkTeacher) && !empty($validated['teacher_id'])) {
            $userData['teacher_id'] = $validated['teacher_id'];
        }

        User::create($userData);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $currentUser = auth()->user();
        $allowedRoles = ['admin', 'kajur', 'wakajur', 'guru'];
        
        // Only admin can update users to role admin
        if ($currentUser->role !== 'admin') {
            $allowedRoles = array_filter($allowedRoles, fn($role) => $role !== 'admin');
        }
        
        // Wakajur cannot update users to role kajur
        if ($currentUser->role === 'wakajur') {
            $allowedRoles = array_filter($allowedRoles, fn($role) => $role !== 'kajur');
        }

        // Prevent non-admin from updating existing admin users
        if ($user->role === 'admin' && $currentUser->role !== 'admin') {
            return redirect()->back()
                ->withErrors(['role' => 'Anda tidak memiliki izin untuk mengubah user dengan role admin.'])
                ->withInput();
        }

        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|in:' . implode(',', $allowedRoles),
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);
        
        // Prevent changing existing admin user to non-admin (only admin can do this)
        if ($user->role === 'admin' && $validated['role'] !== 'admin' && $currentUser->role !== 'admin') {
            return redirect()->back()
                ->withErrors(['role' => 'Anda tidak memiliki izin untuk mengubah role admin.'])
                ->withInput();
        }

        // Validate teacher_id is required for guru role
        if ($validated['role'] === 'guru' && empty($validated['teacher_id'])) {
            return redirect()->back()
                ->withErrors(['teacher_id' => 'Guru harus dipilih untuk role guru.'])
                ->withInput();
        }

        // Validate teacher_id can only be set for guru, kajur, or wakajur role
        $rolesCanLinkTeacher = ['guru', 'kajur', 'wakajur'];
        if (!in_array($validated['role'], $rolesCanLinkTeacher) && !empty($validated['teacher_id'])) {
            return redirect()->back()
                ->withErrors(['teacher_id' => 'Teacher hanya dapat di-link untuk role guru, kajur, atau wakajur.'])
                ->withInput();
        }

        $updateData = [
            'username' => $validated['username'],
            'role' => $validated['role'],
        ];

        // Only update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        // Update teacher_id for guru, kajur, or wakajur
        if (in_array($validated['role'], $rolesCanLinkTeacher)) {
            $updateData['teacher_id'] = $validated['teacher_id'] ?? null;
        } else {
            $updateData['teacher_id'] = null;
        }

        $user->update($updateData);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $currentUser = auth()->user();
        
        // Prevent user from deleting themselves
        if ($user->id === $currentUser->id) {
            return redirect()->route('users.index')
                ->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        // Only admin can delete admin users
        if ($user->role === 'admin' && $currentUser->role !== 'admin') {
            return redirect()->route('users.index')
                ->with('error', 'Anda tidak memiliki izin untuk menghapus user dengan role admin.');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User berhasil dihapus.');
    }
}


