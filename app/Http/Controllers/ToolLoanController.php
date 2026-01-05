<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\MaterialPickup;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Tool;
use App\Models\ToolLoan;
use App\Models\ToolUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ToolLoanController extends Controller
{
    /**
     * Show the landing page to choose between borrow or return.
     */
    public function indexPage(): Response
    {
        return Inertia::render('ToolLoans/IndexPage');
    }

    /**
     * Show the form for borrowing a tool (public page).
     */
    public function borrowPage(): Response
    {
        return Inertia::render('ToolLoans/Borrow');
    }

    /**
     * Show the form for returning a tool (public page).
     */
    public function returnPage(): Response
    {
        return Inertia::render('ToolLoans/Return');
    }

    /**
     * Verify student by NIS.
     */
    public function verifyStudent(Request $request)
    {
        $request->validate([
            'nis' => 'required|string',
        ]);

        $student = Student::where('nis', $request->nis)->with('major')->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Siswa dengan NIS tersebut tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'student' => $student,
        ]);
    }

    /**
     * Verify tool unit by code.
     */
    public function verifyTool(Request $request)
    {
        $request->validate([
            'unit_code' => 'required|string',
        ]);

        $toolUnit = ToolUnit::where('unit_code', $request->unit_code)
            ->with('tool')
            ->first();

        if (!$toolUnit) {
            return response()->json([
                'success' => false,
                'message' => 'Alat dengan kode tersebut tidak ditemukan.',
            ], 404);
        }

        // Check if tool unit is available (not borrowed and condition is good)
        if ($toolUnit->isBorrowed()) {
            return response()->json([
                'success' => false,
                'message' => 'Alat sedang dipinjam oleh siswa lain.',
            ], 422);
        }

        if ($toolUnit->condition !== 'good') {
            $conditionMessages = [
                'damaged' => 'rusak',
                'scrapped' => 'rusak total',
            ];
            $conditionMessage = $conditionMessages[$toolUnit->condition] ?? $toolUnit->condition;
            
            return response()->json([
                'success' => false,
                'message' => 'Alat tidak dapat dipinjam karena kondisinya ' . $conditionMessage . '.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'tool_unit' => $toolUnit,
        ]);
    }

    /**
     * Get all teachers with their subjects (public API).
     */
    public function getTeachers()
    {
        $teachers = Teacher::with('subjects')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Search tools by partial code or name match (public API).
     */
    public function searchTools(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $query = $request->input('query');

        // Search tool units by partial code match OR tool name match
        $toolUnits = ToolUnit::where('unit_code', 'like', "%{$query}%")
            ->orWhereHas('tool', function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->with('tool')
            ->get()
            ->map(function ($unit) {
                // Calculate available stock (units with condition='good' and not borrowed)
                $availableStock = ToolUnit::where('tool_id', $unit->tool_id)
                    ->where('condition', 'good')
                    ->whereDoesntHave('toolLoans', function ($q) {
                        $q->where('status', 'borrowed');
                    })
                    ->count();

                return [
                    'unit_code' => $unit->unit_code,
                    'tool_name' => $unit->tool->name,
                    'available_stock' => $availableStock,
                    'tool_id' => $unit->tool_id,
                ];
            })
            ->unique('unit_code')
            ->values();

        return response()->json([
            'success' => true,
            'tools' => $toolUnits,
        ]);
    }

    /**
     * Store a new tool loan (borrow).
     */
    public function storeBorrow(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'tool_unit_id' => 'required|exists:tool_units,id',
            'borrow_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'teacher_id' => 'nullable|exists:teachers,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'notes' => 'nullable|string',
        ]);

        // Verify tool unit is available
        $toolUnit = ToolUnit::findOrFail($validated['tool_unit_id']);
        if ($toolUnit->isBorrowed()) {
            return redirect()->back()
                ->withErrors(['tool_unit_id' => 'Alat sedang dipinjam oleh siswa lain.'])
                ->withInput();
        }

        if ($toolUnit->condition !== 'good') {
            $conditionMessages = [
                'damaged' => 'rusak',
                'scrapped' => 'rusak total',
            ];
            $conditionMessage = $conditionMessages[$toolUnit->condition] ?? $toolUnit->condition;
            
            return redirect()->back()
                ->withErrors(['tool_unit_id' => 'Alat tidak dapat dipinjam karena kondisinya ' . $conditionMessage . '.'])
                ->withInput();
        }

        // Handle photo upload
        $photoPath = $request->file('borrow_photo')->store('tool-loans/borrow', 'public');

        // Create loan record
        $loanData = [
            'student_id' => $validated['student_id'],
            'tool_unit_id' => $validated['tool_unit_id'],
            'borrow_photo' => $photoPath,
            'borrowed_at' => now(),
            'status' => 'borrowed',
            'notes' => $validated['notes'] ?? null,
        ];

        // Only add teacher_id and subject_id if they have values
        if (!empty($validated['teacher_id'])) {
            $loanData['teacher_id'] = $validated['teacher_id'];
        }
        if (!empty($validated['subject_id'])) {
            $loanData['subject_id'] = $validated['subject_id'];
        }

        ToolLoan::create($loanData);

        return redirect()->route('tool-loans.borrow')
            ->with('success', 'Peminjaman alat berhasil dicatat.');
    }

    /**
     * Store tool return.
     */
    public function storeReturn(Request $request)
    {
        $validated = $request->validate([
            'tool_unit_id' => 'required|exists:tool_units,id',
            'return_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'return_condition' => 'required|in:good,damaged',
            'notes' => 'nullable|string',
        ]);

        // Find active loan for this tool unit
        $toolUnit = ToolUnit::findOrFail($validated['tool_unit_id']);
        $activeLoan = ToolLoan::where('tool_unit_id', $toolUnit->id)
            ->where('status', 'borrowed')
            ->first();

        if (!$activeLoan) {
            return redirect()->back()
                ->withErrors(['tool_unit_id' => 'Alat ini tidak sedang dipinjam.'])
                ->withInput();
        }

        // Handle photo upload
        $photoPath = $request->file('return_photo')->store('tool-loans/return', 'public');

        // Update loan record
        $activeLoan->update([
            'return_photo' => $photoPath,
            'returned_at' => now(),
            'status' => 'returned',
            'return_condition' => $validated['return_condition'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update tool unit condition
        $toolUnit = $activeLoan->toolUnit;
        $toolUnit->update([
            'condition' => $validated['return_condition'],
        ]);

        return redirect()->route('tool-loans.return')
            ->with('success', 'Pengembalian alat berhasil dicatat.');
    }

    /**
     * Get active loan by tool unit code and student (for return page).
     */
    public function getActiveLoanByTool(Request $request)
    {
        $request->validate([
            'unit_code' => 'required|string',
            'student_id' => 'required|exists:students,id',
        ]);

        $toolUnit = ToolUnit::where('unit_code', $request->unit_code)->first();

        if (!$toolUnit) {
            return response()->json([
                'success' => false,
                'message' => 'Alat dengan kode tersebut tidak ditemukan.',
            ], 404);
        }

        // Find active loan for this tool unit and student
        $activeLoan = ToolLoan::where('tool_unit_id', $toolUnit->id)
            ->where('student_id', $request->student_id)
            ->where('status', 'borrowed')
            ->with(['student.major', 'toolUnit.tool'])
            ->first();

        if (!$activeLoan) {
            return response()->json([
                'success' => false,
                'message' => 'Alat ini tidak sedang dipinjam oleh siswa ini.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'loan' => $activeLoan->load('toolUnit.tool'),
        ]);
    }

    /**
     * Display dashboard with tool loans statistics.
     */
    public function dashboard(Request $request): Response
    {
        // ===== STATISTICS =====
        // Tools statistics
        $toolsCount = Tool::count();
        $toolUnitsCount = ToolUnit::count();
        $toolsAvailable = ToolUnit::where('condition', 'good')
            ->whereDoesntHave('toolLoans', function ($query) {
                $query->where('status', 'borrowed');
            })
            ->count();
        $toolsBorrowed = ToolUnit::whereHas('toolLoans', function ($query) {
            $query->where('status', 'borrowed');
        })->count();
        $toolsDamaged = ToolUnit::where('condition', 'damaged')->count();
        $toolsScrapped = ToolUnit::where('condition', 'scrapped')->count();

        // Materials statistics
        $materialsCount = Material::count();
        $materialsTotalStock = Material::sum('stok');
        $materialsLowStock = Material::where('stok', '<', 10)->count(); // Threshold: 10

        // Loans statistics
        $totalLoans = ToolLoan::count();
        $activeLoans = ToolLoan::where('status', 'borrowed')->count();
        $returnedLoans = ToolLoan::where('status', 'returned')->count();
        $loansToday = ToolLoan::whereDate('borrowed_at', today())->count();
        $returnsToday = ToolLoan::whereDate('returned_at', today())->count();

        // Users statistics
        $studentsCount = Student::count();
        $teachersCount = Teacher::count();

        // ===== RECENT ACTIVITIES =====
        // Recent loans (5 latest)
        $recentLoans = ToolLoan::with(['student.major', 'toolUnit.tool'])
            ->orderBy('borrowed_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'student_name' => $loan->student->name,
                    'student_nis' => $loan->student->nis,
                    'major_name' => $loan->student->major->name ?? '-',
                    'tool_name' => $loan->toolUnit->tool->name,
                    'unit_code' => $loan->toolUnit->unit_code,
                    'status' => $loan->status,
                    'borrowed_at' => $loan->borrowed_at->format('d M Y H:i'),
                ];
            })
            ->values()
            ->toArray();


        // ===== ALERTS =====
        // Overdue loans (borrowed more than 8 hours ago)
        $overdueLoans = ToolLoan::with(['student.major', 'toolUnit.tool'])
            ->where('status', 'borrowed')
            ->where('borrowed_at', '<', now()->subHours(8))
            ->orderBy('borrowed_at', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($loan) {
                $hoursAgo = now()->diffInHours($loan->borrowed_at);
                return [
                    'id' => $loan->id,
                    'student_name' => $loan->student->name,
                    'student_nis' => $loan->student->nis,
                    'tool_name' => $loan->toolUnit->tool->name,
                    'unit_code' => $loan->toolUnit->unit_code,
                    'borrowed_at' => $loan->borrowed_at->format('d M Y H:i'),
                    'hours_ago' => $hoursAgo,
                ];
            })
            ->values()
            ->toArray();

        // Low stock materials
        $lowStockMaterials = Material::where('stok', '<', 10)
            ->orderBy('stok', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($material) {
                return [
                    'id' => $material->id,
                    'nama_bahan' => $material->nama_bahan,
                    'stok' => $material->stok,
                    'satuan' => $material->satuan,
                ];
            })
            ->values()
            ->toArray();

        // Damaged tools pending repair
        $damagedToolsPending = ToolUnit::with('tool')
            ->where('condition', 'damaged')
            ->limit(10)
            ->get()
            ->map(function ($unit) {
                return [
                    'id' => $unit->id,
                    'tool_name' => $unit->tool->name,
                    'unit_code' => $unit->unit_code,
                    'condition' => $unit->condition,
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('Dashboard', [
            'stats' => [
                'tools_count' => $toolsCount,
                'tools_available' => $toolsAvailable,
                'tools_borrowed' => $toolsBorrowed,
                'total_loans' => $totalLoans,
                'active_loans' => $activeLoans,
                'loans_today' => $loansToday,
                'returns_today' => $returnsToday,
            ],
            'recent_loans' => $recentLoans,
            'alerts' => [
                'overdue_loans' => $overdueLoans,
                'low_stock_materials' => $lowStockMaterials,
                'damaged_tools_pending' => $damagedToolsPending,
            ],
        ]);
    }

    /**
     * Display history page with tool loans list.
     */
    public function history(Request $request): Response
    {
        $query = ToolLoan::with(['student.major', 'toolUnit.tool']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($q) use ($search) {
                    $q->where('nis', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('toolUnit', function ($q) use ($search) {
                    $q->where('unit_code', 'like', "%{$search}%")
                        ->orWhereHas('tool', function ($q) use ($search) {
                            $q->where('code', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('borrowed_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('borrowed_at', '<=', $request->date_to);
        }

        $loans = $query->orderBy('borrowed_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('History', [
            'loans' => $loans,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display a listing of tool loans (admin only).
     */
    public function index(Request $request): Response
    {
        $query = ToolLoan::with(['student.major', 'toolUnit.tool']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($q) use ($search) {
                    $q->where('nis', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('toolUnit', function ($q) use ($search) {
                    $q->where('unit_code', 'like', "%{$search}%")
                        ->orWhereHas('tool', function ($q) use ($search) {
                            $q->where('code', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('borrowed_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('borrowed_at', '<=', $request->date_to);
        }

        $loans = $query->orderBy('borrowed_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('ToolLoans/Index', [
            'loans' => $loans,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }
}
