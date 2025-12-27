<?php

namespace App\Http\Controllers;

use App\Models\ToolUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    /**
     * Display a listing of damaged tool units.
     */
    public function index(Request $request): Response
    {
        $query = ToolUnit::with('tool')
            ->where('condition', 'damaged');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('unit_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('tool', function ($q) use ($search) {
                        $q->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('location', 'like', "%{$search}%");
                    });
            });
        }

        $units = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Maintenance/Index', [
            'units' => $units,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Mark a tool unit as repaired (change condition to 'good').
     */
    public function markAsRepaired(Request $request, $unit)
    {
        try {
            $toolUnit = ToolUnit::findOrFail($unit);

            // Verify unit is damaged
            if ($toolUnit->condition !== 'damaged') {
                return redirect()->route('maintenance.index')
                    ->with('error', 'Unit ini tidak dalam kondisi rusak.');
            }

            $toolUnit->update([
                'condition' => 'good',
            ]);

            return redirect()->route('maintenance.index')
                ->with('success', 'Alat berhasil ditandai sebagai sudah diperbaiki.');
        } catch (\Exception $e) {
            return redirect()->route('maintenance.index')
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Mark a tool unit as scrapped (change condition to 'scrapped').
     */
    public function markAsScrapped(Request $request, $unit)
    {
        try {
            $toolUnit = ToolUnit::findOrFail($unit);

            // Verify unit is damaged
            if ($toolUnit->condition !== 'damaged') {
                return redirect()->route('maintenance.index')
                    ->with('error', 'Unit ini tidak dalam kondisi rusak.');
            }

            $toolUnit->update([
                'condition' => 'scrapped',
            ]);

            return redirect()->route('maintenance.index')
                ->with('success', 'Alat berhasil ditandai sebagai rusak total.');
        } catch (\Exception $e) {
            return redirect()->route('maintenance.index')
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}
