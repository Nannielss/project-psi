<?php

namespace App\Http\Controllers;

use App\Models\DeviceLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceLocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = DeviceLocation::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by active status
        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active === 'true');
        }

        $locations = $query->orderBy('name')->paginate(10)->withQueryString();
        
        // Ensure plain_password is included in the response
        $locations->getCollection()->transform(function ($location) {
            return $location->append('plain_password');
        });

        return Inertia::render('DeviceLocations/Index', [
            'locations' => $locations,
            'filters' => $request->only(['search', 'is_active']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:device_locations,name',
            'password' => 'required|string|min:4|max:255',
            'is_active' => 'boolean',
        ]);

        DeviceLocation::create($validated);

        return redirect()->route('device-locations.index')
            ->with('success', 'Lokasi device berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DeviceLocation $deviceLocation)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:device_locations,name,' . $deviceLocation->id,
            'password' => 'nullable|string|min:4|max:255',
            'is_active' => 'boolean',
        ]);

        // Only update password if provided
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $deviceLocation->update($validated);

        return redirect()->route('device-locations.index')
            ->with('success', 'Lokasi device berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DeviceLocation $deviceLocation)
    {
        // Check if location has active loans
        if ($deviceLocation->toolLoans()->where('status', 'borrowed')->count() > 0) {
            return redirect()->route('device-locations.index')
                ->with('error', 'Lokasi tidak dapat dihapus karena masih memiliki pinjaman aktif.');
        }

        $deviceLocation->delete();

        return redirect()->route('device-locations.index')
            ->with('success', 'Lokasi device berhasil dihapus.');
    }
}