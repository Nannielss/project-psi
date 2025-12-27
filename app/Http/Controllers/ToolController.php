<?php

namespace App\Http\Controllers;

use App\Models\Tool;
use App\Models\ToolUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ToolController extends Controller
{
    /**
     * Extract initial unit count from tool code.
     * Format: WK.09.03.131.1.2025 -> extract "1" (5th segment)
     */
    private function extractUnitCountFromCode(string $code): int
    {
        $parts = explode('.', $code);
        if (count($parts) >= 5) {
            $unitCount = (int) $parts[4]; // Index 4 is the 5th segment
            return $unitCount > 0 ? $unitCount : 1; // Default to 1 if invalid
        }
        return 1; // Default to 1 if format is invalid
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Tool::withCount([
            'units as total_units',
            'units as good_count' => function ($q) {
                $q->where('condition', 'good');
            },
            'units as damaged_count' => function ($q) {
                $q->where('condition', 'damaged');
            },
            'units as service_count' => function ($q) {
                $q->where('condition', 'service');
            },
        ]);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tools = $query->with('units')->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Tools/Index', [
            'tools' => $tools,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:tools,code',
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('tools', 'public');
        }

        $tool = Tool::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'location' => $validated['location'],
            'photo' => $validated['photo'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        // Extract initial unit count from code (5th segment)
        $initialCount = $this->extractUnitCountFromCode($tool->code);
        
        // Create initial units
        for ($i = 1; $i <= $initialCount; $i++) {
            ToolUnit::create([
                'tool_id' => $tool->id,
                'unit_number' => $i,
                'unit_code' => $tool->code . '-' . $i,
                'condition' => 'good',
            ]);
        }

        return redirect()->route('tools.index')
            ->with('success', 'Alat berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tool $tool)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:tools,code,' . $tool->id,
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($tool->photo && Storage::disk('public')->exists($tool->photo)) {
                Storage::disk('public')->delete($tool->photo);
            }
            $validated['photo'] = $request->file('photo')->store('tools', 'public');
        } else {
            // Keep existing photo if not uploading new one
            unset($validated['photo']);
        }

        $oldCode = $tool->code;
        $tool->update($validated);

        // Update unit codes if code changed
        if ($oldCode !== $tool->code) {
            foreach ($tool->units as $unit) {
                $unit->update([
                    'unit_code' => $tool->code . '-' . $unit->unit_number,
                ]);
            }
        }

        return redirect()->route('tools.index')
            ->with('success', 'Alat berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tool $tool)
    {
        // Delete photo if exists
        if ($tool->photo && Storage::disk('public')->exists($tool->photo)) {
            Storage::disk('public')->delete($tool->photo);
        }

        // Units will be deleted automatically due to cascade
        $tool->delete();

        return redirect()->route('tools.index')
            ->with('success', 'Alat berhasil dihapus.');
    }

    /**
     * Get units for a specific tool.
     */
    public function getUnits(Tool $tool)
    {
        $units = $tool->units()->orderBy('unit_number')->get();

        return response()->json([
            'units' => $units,
        ]);
    }

    /**
     * Add a new unit to a tool.
     */
    public function addUnit(Request $request, Tool $tool)
    {
        $validated = $request->validate([
            'condition' => 'required|in:good,damaged,service',
            'description' => 'nullable|string',
        ]);

        // Get the next unit number
        $maxUnitNumber = $tool->units()->max('unit_number');
        $nextUnitNumber = ($maxUnitNumber ?? 0) + 1;

        ToolUnit::create([
            'tool_id' => $tool->id,
            'unit_number' => $nextUnitNumber,
            'unit_code' => $tool->code . '-' . $nextUnitNumber,
            'condition' => $validated['condition'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'Unit berhasil ditambahkan.');
    }

    /**
     * Update a unit.
     */
    public function updateUnit(Request $request, Tool $tool, ToolUnit $unit)
    {
        // Verify unit belongs to tool
        if ($unit->tool_id !== $tool->id) {
            abort(404);
        }

        $validated = $request->validate([
            'condition' => 'required|in:good,damaged,service',
            'description' => 'nullable|string',
        ]);

        $unit->update($validated);

        return redirect()->back()
            ->with('success', 'Unit berhasil diperbarui.');
    }

    /**
     * Delete a unit.
     */
    public function deleteUnit(Tool $tool, ToolUnit $unit)
    {
        // Verify unit belongs to tool
        if ($unit->tool_id !== $tool->id) {
            abort(404);
        }

        $unit->delete();

        return redirect()->back()
            ->with('success', 'Unit berhasil dihapus.');
    }

    /**
     * Import tools from Excel file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:2048',
        ]);

        $file = $request->file('file');
        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Skip header row (index 0)
            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Validate row has at least 3 columns
                if (count($row) < 3) {
                    $errors[] = "Baris " . ($i + 1) . " tidak valid: kurang dari 3 kolom";
                    continue;
                }

                $code = trim($row[0] ?? '');
                $name = trim($row[1] ?? '');
                $location = trim($row[2] ?? '');
                $description = trim($row[3] ?? '');

                // Validate required fields
                if (empty($code) || empty($name) || empty($location)) {
                    $errors[] = "Baris " . ($i + 1) . " tidak valid: Code, Name, atau Location kosong";
                    continue;
                }

                // Check if tool already exists
                if (Tool::where('code', $code)->exists()) {
                    $errors[] = "Baris " . ($i + 1) . " (Code: {$code}): Alat dengan kode ini sudah ada";
                    continue;
                }

                // Create tool
                $tool = Tool::create([
                    'code' => $code,
                    'name' => $name,
                    'location' => $location,
                    'description' => !empty($description) ? $description : null,
                ]);

                // Extract initial unit count from code (5th segment)
                $initialUnitCount = $this->extractUnitCountFromCode($tool->code);

                // Create initial units
                for ($j = 1; $j <= $initialUnitCount; $j++) {
                    ToolUnit::create([
                        'tool_id' => $tool->id,
                        'unit_number' => $j,
                        'unit_code' => $tool->code . '-' . $j,
                        'condition' => 'good',
                    ]);
                }

                $imported++;
            }

            DB::commit();

            $message = "Berhasil mengimpor {$imported} alat.";
            if (count($errors) > 0) {
                $message .= " Terjadi " . count($errors) . " error.";
            }

            return redirect()->route('tools.index')
                ->with('success', $message)
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->route('tools.index')
                ->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
        }
    }

    /**
     * Get all tool units for QR printing (without pagination).
     */
    public function forQr(Request $request)
    {
        $query = Tool::with('units');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tools = $query->orderBy('created_at', 'desc')->get();

        // Build response with all units from all tools
        $units = [];
        foreach ($tools as $tool) {
            foreach ($tool->units as $unit) {
                $units[] = [
                    'id' => $unit->id,
                    'unit_code' => $unit->unit_code,
                    'unit_number' => $unit->unit_number,
                    'tool' => [
                        'id' => $tool->id,
                        'name' => $tool->name,
                        'location' => $tool->location,
                    ],
                ];
            }
        }

        return response()->json([
            'data' => $units,
        ]);
    }

    /**
     * Download Excel template for tool import.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'code');
        $sheet->setCellValue('B1', 'name');
        $sheet->setCellValue('C1', 'location');
        $sheet->setCellValue('D1', 'description');

        // Style header row
        $sheet->getStyle('A1:D1')->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);
        $sheet->getColumnDimension('C')->setAutoSize(true);
        $sheet->getColumnDimension('D')->setAutoSize(true);

        // Add example row
        $sheet->setCellValue('A2', 'WK.09.03.131.1.2025');
        $sheet->setCellValue('B2', 'Hand Bor MAKTEC MT 817');
        $sheet->setCellValue('C2', 'Lab Teknik Mesin');
        $sheet->setCellValue('D2', 'Alat bor tangan');
        
        // Add note about unit count
        $sheet->setCellValue('A4', 'Catatan:');
        $sheet->setCellValue('A5', 'Jumlah unit akan diambil otomatis dari angka ke-5 pada kode alat');
        $sheet->setCellValue('A6', 'Contoh: WK.09.03.131.1.2025 -> jumlah unit = 1');

        $writer = new Xlsx($spreadsheet);
        
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template_import_alat.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}

