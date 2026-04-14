<?php

namespace App\Http\Controllers;

use App\Models\User;
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

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return Inertia::render('Users/Index', [
            'users' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:admin,petugas,kasir',
        ]);

        User::create([
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $currentUser = auth()->user();

        if ($user->role === 'admin' && $currentUser?->role !== 'admin') {
            return redirect()->back()
                ->withErrors(['role' => 'Anda tidak memiliki izin untuk mengubah user dengan role admin.'])
                ->withInput();
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|in:admin,petugas,kasir',
        ]);

        if ($user->role === 'admin' && $validated['role'] !== 'admin' && $currentUser?->role !== 'admin') {
            return redirect()->back()
                ->withErrors(['role' => 'Anda tidak memiliki izin untuk mengubah role admin.'])
                ->withInput();
        }

        $updateData = [
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'username' => $validated['username'],
            'role' => $validated['role'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
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

        if ($currentUser?->role !== 'admin') {
            return redirect()->route('users.index')
                ->with('access_denied', 'Anda tidak berhak menghapus akun ini.');
        }

        if ($user->id === $currentUser?->id) {
            return redirect()->route('users.index')
                ->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        if ($user->role === 'admin' && $currentUser?->role !== 'admin') {
            return redirect()->route('users.index')
                ->with('error', 'Anda tidak memiliki izin untuk menghapus user dengan role admin.');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User berhasil dihapus.');
    }
}
