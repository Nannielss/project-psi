<?php

namespace App\Http\Controllers;

use App\Models\Student;
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
     * Store a new tool loan (borrow).
     */
    public function storeBorrow(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'tool_unit_id' => 'required|exists:tool_units,id',
            'borrow_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
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
        ToolLoan::create([
            'student_id' => $validated['student_id'],
            'tool_unit_id' => $validated['tool_unit_id'],
            'borrow_photo' => $photoPath,
            'borrowed_at' => now(),
            'status' => 'borrowed',
            'notes' => $validated['notes'] ?? null,
        ]);

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
        // Get statistics
        $totalLoans = ToolLoan::count();
        $activeLoans = ToolLoan::where('status', 'borrowed')->count();
        $returnedLoans = ToolLoan::where('status', 'returned')->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_loans' => $totalLoans,
                'active_loans' => $activeLoans,
                'returned_loans' => $returnedLoans,
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
