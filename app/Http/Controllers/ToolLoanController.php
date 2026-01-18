<?php

namespace App\Http\Controllers;

use App\Models\DeviceLocation;
use App\Models\Material;
use App\Models\MaterialPickup;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Tool;
use App\Models\ToolLoan;
use App\Models\ToolUnit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ToolLoanController extends Controller
{
    /**
     * Show the landing page to choose between borrow or return.
     * Requires device location to be set in session.
     */
    public function indexPage(): Response|RedirectResponse
    {
        // Check if device location is set in session
        $deviceLocationId = session('device_location_id');
        
        if (!$deviceLocationId) {
            return redirect()->route('tool-loans.location-login');
        }

        // Verify location still exists and is active
        $deviceLocation = DeviceLocation::find($deviceLocationId);
        if (!$deviceLocation || !$deviceLocation->is_active) {
            session()->forget(['device_location_id', 'device_location_name']);
            return redirect()->route('tool-loans.location-login')
                ->with('error', 'Lokasi device tidak ditemukan atau tidak aktif.');
        }

        return Inertia::render('ToolLoans/IndexPage', [
            'deviceLocation' => [
                'id' => $deviceLocation->id,
                'name' => $deviceLocation->name,
            ],
        ]);
    }

    /**
     * Show the location login page.
     */
    public function locationLoginPage(): Response
    {
        // Get all active device locations
        $locations = DeviceLocation::where('is_active', true)
            ->orderBy('name')
            ->select('id', 'name')
            ->get();

        return Inertia::render('ToolLoans/LocationLogin', [
            'locations' => $locations,
        ]);
    }

    /**
     * Verify location password and set session.
     */
    public function verifyLocationPassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'device_location_id' => 'required|exists:device_locations,id',
            'password' => 'required|string',
        ]);

        $deviceLocation = DeviceLocation::findOrFail($validated['device_location_id']);

        // Check if location is active
        if (!$deviceLocation->is_active) {
            return redirect()->back()
                ->withErrors(['password' => 'Lokasi device tidak aktif.'])
                ->withInput();
        }

        // Verify password
        if (!$deviceLocation->verifyPassword($validated['password'])) {
            return redirect()->back()
                ->withErrors(['password' => 'Password salah.'])
                ->withInput();
        }

        // Set session
        session([
            'device_location_id' => $deviceLocation->id,
            'device_location_name' => $deviceLocation->name,
        ]);

        return redirect()->route('tool-loans.index-page')
            ->with('success', 'Berhasil masuk sebagai ' . $deviceLocation->name);
    }

    /**
     * Logout from device location.
     */
    public function locationLogout(): RedirectResponse
    {
        session()->forget(['device_location_id', 'device_location_name']);

        return redirect()->route('tool-loans.location-login')
            ->with('success', 'Berhasil logout dari lokasi device.');
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
    public function returnPage(): Response|RedirectResponse
    {
        // Check if device location is set in session
        $deviceLocationId = session('device_location_id');
        
        if (!$deviceLocationId) {
            return redirect()->route('tool-loans.location-login');
        }

        // Verify location still exists and is active
        $deviceLocation = DeviceLocation::find($deviceLocationId);
        if (!$deviceLocation || !$deviceLocation->is_active) {
            session()->forget(['device_location_id', 'device_location_name']);
            return redirect()->route('tool-loans.location-login')
                ->with('error', 'Lokasi device tidak ditemukan atau tidak aktif.');
        }

        return Inertia::render('ToolLoans/Return', [
            'deviceLocation' => [
                'id' => $deviceLocation->id,
                'name' => $deviceLocation->name,
            ],
        ]);
    }

    /**
     * Verify borrower by NIS (student) or NIP (teacher) - unified endpoint.
     */
    public function verifyBorrower(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = $request->code;

        // Try to find student first by NIS
        $student = Student::where('nis', $code)->with('major')->first();

        if ($student) {
            // Check if student has active loans
            $hasActiveLoan = $student->hasActiveLoan();
            $canBorrowToday = $student->canBorrowToday();
            $activeLoans = [];

            if ($hasActiveLoan) {
                $activeLoans = ToolLoan::where('student_id', $student->id)
                    ->where('status', 'borrowed')
                    ->with('toolUnit.tool')
                    ->get()
                    ->map(function ($loan) {
                        return [
                            'id' => $loan->id,
                            'tool_name' => $loan->toolUnit->tool->name,
                            'unit_code' => $loan->toolUnit->unit_code,
                            'borrowed_at' => $loan->borrowed_at->format('Y-m-d H:i:s'),
                        ];
                    });
            }

            return response()->json([
                'success' => true,
                'type' => 'student',
                'student' => $student,
                'teacher' => null,
                'has_active_loan' => $hasActiveLoan,
                'can_borrow_today' => $canBorrowToday,
                'active_loans' => $activeLoans,
            ]);
        }

        // If not found as student, try to find teacher by NIP
        $teacher = Teacher::where('nip', $code)->with('subjects')->first();

        if ($teacher) {
            // Hide NIP from response for privacy
            $teacher->makeHidden('nip');

            return response()->json([
                'success' => true,
                'type' => 'teacher',
                'student' => null,
                'teacher' => $teacher,
            ]);
        }

        // Not found in both tables
        return response()->json([
            'success' => false,
            'message' => 'Siswa dengan NIS atau guru dengan NIP tersebut tidak ditemukan.',
        ], 404);
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
        $teachers = Teacher::with('subjects')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->makeHidden('nip');

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
     * Get tools catalog with available stock (public API).
     */
    public function getToolsCatalog()
    {
        $tools = Tool::withCount([
            'units as total_units',
            'units as available_units' => function ($q) {
                $q->where('condition', 'good')
                    ->whereDoesntHave('toolLoans', function ($q) {
                        $q->where('status', 'borrowed');
                    });
            },
        ])
            ->having('available_units', '>', 0)
            ->orderBy('name')
            ->get()
            ->map(function ($tool) {
                return [
                    'id' => $tool->id,
                    'name' => $tool->name,
                    'code' => $tool->code,
                    'location' => $tool->location,
                    'photo' => $tool->photo,
                    'description' => $tool->description,
                    'available_stock' => $tool->available_units,
                ];
            });

        return response()->json([
            'success' => true,
            'tools' => $tools,
        ]);
    }

    /**
     * Get available units for a specific tool (public API).
     */
    public function getAvailableUnits($toolId)
    {
        $tool = Tool::findOrFail($toolId);

        $availableUnits = ToolUnit::where('tool_id', $toolId)
            ->where('condition', 'good')
            ->whereDoesntHave('toolLoans', function ($q) {
                $q->where('status', 'borrowed');
            })
            ->orderBy('unit_code')
            ->get()
            ->map(function ($unit) {
                return [
                    'id' => $unit->id,
                    'unit_code' => $unit->unit_code,
                    'unit_number' => $unit->unit_number,
                    'condition' => $unit->condition,
                ];
            });

        return response()->json([
            'success' => true,
            'tool' => [
                'id' => $tool->id,
                'name' => $tool->name,
                'code' => $tool->code,
            ],
            'available_units' => $availableUnits,
        ]);
    }

    /**
     * Store a new tool loan (borrow).
     */
    public function storeBorrow(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'borrower_teacher_id' => 'nullable|exists:teachers,id',
            'tool_unit_id' => 'required|exists:tool_units,id',
            'borrow_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'teacher_id' => 'nullable|exists:teachers,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'notes' => 'nullable|string',
        ]);

        // Validate that either student_id or borrower_teacher_id is provided
        if (empty($validated['student_id']) && empty($validated['borrower_teacher_id'])) {
            return redirect()->back()
                ->withErrors(['student_id' => 'Siswa atau guru peminjam harus dipilih.'])
                ->withInput();
        }

        // Check if student can borrow (same-day borrowing allowed)
        if (!empty($validated['student_id'])) {
            $student = Student::findOrFail($validated['student_id']);
            $hasActiveLoan = $student->hasActiveLoan();
            $canBorrowToday = $student->canBorrowToday();

            // Block if has active loan AND cannot borrow today (loans from previous day)
            if ($hasActiveLoan && !$canBorrowToday) {
                $activeLoans = ToolLoan::where('student_id', $validated['student_id'])
                    ->where('status', 'borrowed')
                    ->with('toolUnit.tool')
                    ->get();

                $toolNames = $activeLoans->map(function ($loan) {
                    return $loan->toolUnit->tool->name . ' (' . $loan->toolUnit->unit_code . ')';
                })->join(', ');

                $errorMessage = 'Siswa masih memiliki pinjaman aktif. Harap kembalikan terlebih dahulu: ' . $toolNames;

                // Return JSON response for axios requests
                if ($request->expectsJson() || $request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $errorMessage,
                        'errors' => ['student_id' => [$errorMessage]],
                    ], 422);
                }

                return redirect()->back()
                    ->withErrors(['student_id' => $errorMessage])
                    ->withInput();
            }
        }

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

        // Handle photo upload (store privately)
        $photoPath = $request->file('borrow_photo')->store('tool-loans/borrow');

        // Create loan record
        $loanData = [
            'tool_unit_id' => $validated['tool_unit_id'],
            'borrow_photo' => $photoPath,
            'borrowed_at' => now(),
            'status' => 'borrowed',
            'notes' => $validated['notes'] ?? null,
        ];

        // Add device_location_id from session if available
        $deviceLocationId = session('device_location_id');
        if ($deviceLocationId) {
            $loanData['device_location_id'] = $deviceLocationId;
        }

        // Add student_id or borrower_teacher_id
        if (!empty($validated['student_id'])) {
            $loanData['student_id'] = $validated['student_id'];
        }
        if (!empty($validated['borrower_teacher_id'])) {
            $loanData['borrower_teacher_id'] = $validated['borrower_teacher_id'];
        }

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
     * Store multiple tool loans in batch (borrow multiple tools at once).
     */
    public function storeBorrowBatch(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'borrower_teacher_id' => 'nullable|exists:teachers,id',
            'tool_unit_ids' => 'required|array|min:1',
            'tool_unit_ids.*' => 'required|exists:tool_units,id',
            'borrow_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'teacher_id' => 'nullable|exists:teachers,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'notes' => 'nullable|string',
        ]);

        // Validate that either student_id or borrower_teacher_id is provided
        if (empty($validated['student_id']) && empty($validated['borrower_teacher_id'])) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa atau guru peminjam harus dipilih.',
                    'errors' => ['student_id' => ['Siswa atau guru peminjam harus dipilih.']],
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['student_id' => 'Siswa atau guru peminjam harus dipilih.'])
                ->withInput();
        }

        // Check if student can borrow (same-day borrowing allowed)
        // This check happens ONCE before processing any items
        if (!empty($validated['student_id'])) {
            $student = Student::findOrFail($validated['student_id']);
            $hasActiveLoan = $student->hasActiveLoan();
            $canBorrowToday = $student->canBorrowToday();

            // Block if has active loan AND cannot borrow today (loans from previous day)
            if ($hasActiveLoan && !$canBorrowToday) {
                $activeLoans = ToolLoan::where('student_id', $validated['student_id'])
                    ->where('status', 'borrowed')
                    ->with('toolUnit.tool')
                    ->get();

                $toolNames = $activeLoans->map(function ($loan) {
                    return $loan->toolUnit->tool->name . ' (' . $loan->toolUnit->unit_code . ')';
                })->join(', ');

                $errorMessage = 'Siswa masih memiliki pinjaman aktif. Harap kembalikan terlebih dahulu: ' . $toolNames;

                if ($request->expectsJson() || $request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $errorMessage,
                        'errors' => ['student_id' => [$errorMessage]],
                    ], 422);
                }

                return redirect()->back()
                    ->withErrors(['student_id' => $errorMessage])
                    ->withInput();
            }
        }

        // Handle photo upload (store privately)
        $photoPath = $request->file('borrow_photo')->store('tool-loans/borrow');

        // Validate all tool units before creating any loans
        $toolUnitIds = $validated['tool_unit_ids'];
        $toolUnits = ToolUnit::whereIn('id', $toolUnitIds)->get();

        if ($toolUnits->count() !== count($toolUnitIds)) {
            $errorMessage = 'Beberapa alat tidak ditemukan.';
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'errors' => ['tool_unit_ids' => [$errorMessage]],
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['tool_unit_ids' => $errorMessage])
                ->withInput();
        }

        // Check availability and condition for all tool units
        $errors = [];
        foreach ($toolUnits as $toolUnit) {
            if ($toolUnit->isBorrowed()) {
                $errors[] = 'Alat ' . $toolUnit->unit_code . ' sedang dipinjam oleh siswa lain.';
            }
            if ($toolUnit->condition !== 'good') {
                $conditionMessages = [
                    'damaged' => 'rusak',
                    'scrapped' => 'rusak total',
                ];
                $conditionMessage = $conditionMessages[$toolUnit->condition] ?? $toolUnit->condition;
                $errors[] = 'Alat ' . $toolUnit->unit_code . ' tidak dapat dipinjam karena kondisinya ' . $conditionMessage . '.';
            }
        }

        if (!empty($errors)) {
            $errorMessage = implode(' ', $errors);
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'errors' => ['tool_unit_ids' => [$errorMessage]],
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['tool_unit_ids' => $errorMessage])
                ->withInput();
        }

        // Create all loans in a database transaction
        try {
            DB::beginTransaction();

            // Get device_location_id from session if available
            $deviceLocationId = session('device_location_id');

            $createdLoans = [];
            foreach ($toolUnits as $toolUnit) {
                $loanData = [
                    'tool_unit_id' => $toolUnit->id,
                    'borrow_photo' => $photoPath,
                    'borrowed_at' => now(),
                    'status' => 'borrowed',
                    'notes' => $validated['notes'] ?? null,
                ];

                // Add device_location_id from session if available
                if ($deviceLocationId) {
                    $loanData['device_location_id'] = $deviceLocationId;
                }

                // Add student_id or borrower_teacher_id
                if (!empty($validated['student_id'])) {
                    $loanData['student_id'] = $validated['student_id'];
                }
                if (!empty($validated['borrower_teacher_id'])) {
                    $loanData['borrower_teacher_id'] = $validated['borrower_teacher_id'];
                }

                // Only add teacher_id and subject_id if they have values
                if (!empty($validated['teacher_id'])) {
                    $loanData['teacher_id'] = $validated['teacher_id'];
                }
                if (!empty($validated['subject_id'])) {
                    $loanData['subject_id'] = $validated['subject_id'];
                }

                $loan = ToolLoan::create($loanData);
                $createdLoans[] = $loan;
            }

            DB::commit();

            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => count($createdLoans) . ' alat berhasil dipinjam.',
                    'loans' => $createdLoans,
                ]);
            }

            return redirect()->route('tool-loans.borrow')
                ->with('success', count($createdLoans) . ' alat berhasil dipinjam.');
        } catch (\Exception $e) {
            DB::rollBack();

            $errorMessage = 'Terjadi kesalahan saat menyimpan data: ' . $e->getMessage();
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                ], 500);
            }

            return redirect()->back()
                ->withErrors(['error' => $errorMessage])
                ->withInput();
        }
    }

    /**
     * Store tool return (supports batch return).
     */
    public function storeReturn(Request $request)
    {
        // Handle returns as JSON string from FormData
        $returnsJson = $request->input('returns');
        $returns = is_string($returnsJson) ? json_decode($returnsJson, true) : $returnsJson;

        $validated = $request->validate([
            'return_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Validate returns array
        if (!is_array($returns) || count($returns) === 0) {
            return redirect()->back()
                ->withErrors(['returns' => 'Minimal satu alat harus dikembalikan.'])
                ->withInput();
        }

        foreach ($returns as $returnData) {
            if (!isset($returnData['tool_unit_id']) || !isset($returnData['return_condition'])) {
                return redirect()->back()
                    ->withErrors(['returns' => 'Data pengembalian tidak valid.'])
                    ->withInput();
            }
        }

        // Handle photo upload (store privately)
        $photoPath = $request->file('return_photo')->store('tool-loans/return');

        $successCount = 0;
        $errors = [];
        $locationMismatchErrors = []; // Store location mismatch errors separately

        foreach ($returns as $returnData) {
            try {
                // Find active loan for this tool unit
                $toolUnit = ToolUnit::findOrFail($returnData['tool_unit_id']);
                $activeLoan = ToolLoan::where('tool_unit_id', $toolUnit->id)
                    ->where('status', 'borrowed')
                    ->with('deviceLocation')
                    ->first();

                if (!$activeLoan) {
                    $errors[] = "Alat dengan kode {$toolUnit->unit_code} tidak sedang dipinjam.";
                    continue;
                }

                // Validate device location (if loan has device_location_id)
                if ($activeLoan->device_location_id) {
                    $currentLocationId = session('device_location_id');
                    if (!$currentLocationId || $currentLocationId != $activeLoan->device_location_id) {
                        $loanLocation = $activeLoan->deviceLocation;
                        $locationName = $loanLocation ? $loanLocation->name : 'lokasi yang berbeda';
                        $locationMismatchErrors[] = [
                            'code' => $toolUnit->unit_code,
                            'location' => $locationName,
                        ];
                        continue;
                    }
                }

                // Update loan record
                $activeLoan->update([
                    'return_photo' => $photoPath,
                    'returned_at' => now(),
                    'status' => 'returned',
                    'return_condition' => $returnData['return_condition'],
                    'notes' => $returnData['notes'] ?? null,
                ]);

                // Update tool unit condition
                $toolUnit->update([
                    'condition' => $returnData['return_condition'],
                ]);

                $successCount++;
            } catch (\Exception $e) {
                $errors[] = "Gagal mengembalikan alat dengan kode {$returnData['tool_unit_id']}: " . $e->getMessage();
            }
        }

        // Format location mismatch errors more compactly
        if (count($locationMismatchErrors) > 0) {
            // Group by location
            $groupedByLocation = [];
            foreach ($locationMismatchErrors as $error) {
                $loc = $error['location'];
                if (!isset($groupedByLocation[$loc])) {
                    $groupedByLocation[$loc] = [];
                }
                $groupedByLocation[$loc][] = $error['code'];
            }

            // Build compact error message
            $locationMessages = [];
            foreach ($groupedByLocation as $location => $codes) {
                $count = count($codes);
                if ($count <= 3) {
                    // Show all codes if 3 or less
                    $locationMessages[] = "{$count} alat (" . implode(', ', $codes) . ") harus dikembalikan di {$location}";
                } else {
                    // Show first 3 codes + count if more than 3
                    $shownCodes = array_slice($codes, 0, 3);
                    $remaining = $count - 3;
                    $locationMessages[] = "{$count} alat (" . implode(', ', $shownCodes) . ", dan {$remaining} lainnya) harus dikembalikan di {$location}";
                }
            }

            $locationErrorMsg = implode('. ', $locationMessages);
            $errors[] = $locationErrorMsg;
        }

        if ($successCount > 0) {
            $message = "{$successCount} alat berhasil dikembalikan.";
            if (count($errors) > 0) {
                $message .= ' ' . implode(' ', $errors);
            }
            return redirect()->route('tool-loans.return')
                ->with('success', $message);
        }

        return redirect()->back()
            ->withErrors(['returns' => 'Gagal mengembalikan alat. ' . implode(' ', $errors)])
            ->withInput();
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

        // Hide sensitive data from public route
        $loanData = $activeLoan->load('toolUnit.tool')->toArray();

        // Remove NIP if borrowerTeacher exists
        if (isset($loanData['borrower_teacher']) && isset($loanData['borrower_teacher']['nip'])) {
            unset($loanData['borrower_teacher']['nip']);
        }

        return response()->json([
            'success' => true,
            'loan' => $loanData,
        ]);
    }

    /**
     * Get all active loans for a student (for return page).
     */
    public function getActiveLoansByStudent($studentId)
    {
        $student = Student::find($studentId);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Siswa tidak ditemukan.',
            ], 404);
        }

        $activeLoans = ToolLoan::where('student_id', $studentId)
            ->where('status', 'borrowed')
            ->with(['toolUnit.tool', 'deviceLocation'])
            ->orderBy('borrowed_at', 'asc')
            ->get()
            ->map(function ($loan) {
                $loanData = $loan->toArray();
                // Remove NIP if borrowerTeacher exists (security: hide sensitive data from public route)
                if (isset($loanData['borrower_teacher']) && isset($loanData['borrower_teacher']['nip'])) {
                    unset($loanData['borrower_teacher']['nip']);
                }
                return $loanData;
            });

        // Get current device location from session
        $currentLocationId = session('device_location_id');

        return response()->json([
            'success' => true,
            'loans' => $activeLoans,
            'current_location_id' => $currentLocationId,
        ]);
    }

    /**
     * Get all active loans for a teacher (for return page).
     */
    public function getActiveLoansByTeacher($teacherId)
    {
        $teacher = Teacher::find($teacherId);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Guru tidak ditemukan.',
            ], 404);
        }

        $activeLoans = ToolLoan::where('borrower_teacher_id', $teacherId)
            ->where('status', 'borrowed')
            ->with(['toolUnit.tool', 'deviceLocation'])
            ->orderBy('borrowed_at', 'asc')
            ->get()
            ->map(function ($loan) {
                $loanData = $loan->toArray();
                // Remove NIP if borrowerTeacher exists (security: hide sensitive data from public route)
                if (isset($loanData['borrower_teacher']) && isset($loanData['borrower_teacher']['nip'])) {
                    unset($loanData['borrower_teacher']['nip']);
                }
                return $loanData;
            });

        // Get current device location from session
        $currentLocationId = session('device_location_id');

        return response()->json([
            'success' => true,
            'loans' => $activeLoans,
            'current_location_id' => $currentLocationId,
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
        $recentLoans = ToolLoan::with(['student.major', 'borrowerTeacher', 'toolUnit.tool'])
            ->orderBy('borrowed_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($loan) {
                $borrowerName = $loan->student ? $loan->student->name : ($loan->borrowerTeacher ? $loan->borrowerTeacher->name : '-');
                $borrowerId = $loan->student ? $loan->student->nis : ($loan->borrowerTeacher ? $loan->borrowerTeacher->nip : '-');
                $borrowerType = $loan->student ? 'student' : 'teacher';

                return [
                    'id' => $loan->id,
                    'borrower_name' => $borrowerName,
                    'borrower_id' => $borrowerId,
                    'borrower_type' => $borrowerType,
                    'student_name' => $loan->student->name ?? null,
                    'student_nis' => $loan->student->nis ?? null,
                    'major_name' => $loan->student->major->name ?? '-',
                    'teacher_name' => $loan->borrowerTeacher->name ?? null,
                    'teacher_nip' => $loan->borrowerTeacher->nip ?? null,
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
        $overdueLoans = ToolLoan::with(['student.major', 'borrowerTeacher', 'toolUnit.tool'])
            ->where('status', 'borrowed')
            ->where('borrowed_at', '<', now()->subHours(8))
            ->orderBy('borrowed_at', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($loan) {
                $hoursAgo = now()->diffInHours($loan->borrowed_at);
                $borrowerName = $loan->student ? $loan->student->name : ($loan->borrowerTeacher ? $loan->borrowerTeacher->name : '-');
                $borrowerId = $loan->student ? $loan->student->nis : ($loan->borrowerTeacher ? $loan->borrowerTeacher->nip : '-');
                $borrowerType = $loan->student ? 'student' : 'teacher';

                return [
                    'id' => $loan->id,
                    'borrower_name' => $borrowerName,
                    'borrower_id' => $borrowerId,
                    'borrower_type' => $borrowerType,
                    'student_name' => $loan->student->name ?? null,
                    'student_nis' => $loan->student->nis ?? null,
                    'teacher_name' => $loan->borrowerTeacher->name ?? null,
                    'teacher_nip' => $loan->borrowerTeacher->nip ?? null,
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
        $query = ToolLoan::with(['student.major', 'borrowerTeacher', 'teacher', 'subject', 'toolUnit.tool', 'deviceLocation']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($q) use ($search) {
                    $q->where('nis', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('borrowerTeacher', function ($q) use ($search) {
                    $q->where('nip', 'like', "%{$search}%")
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
     * Export history to CSV or Excel.
     */
    public function exportHistory(Request $request)
    {
        $format = $request->get('format', 'excel'); // 'csv' or 'excel'

        $query = ToolLoan::with(['student.major', 'borrowerTeacher', 'toolUnit.tool']);

        // Apply same filters as history page
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($q) use ($search) {
                    $q->where('nis', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('borrowerTeacher', function ($q) use ($search) {
                    $q->where('nip', 'like', "%{$search}%")
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

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('borrowed_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('borrowed_at', '<=', $request->date_to);
        }

        $loans = $query->orderBy('borrowed_at', 'desc')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $headers = [
            'Tanggal Pinjam',
            'Tipe Peminjam',
            'NIS/NIP',
            'Nama Peminjam',
            'Jurusan',
            'Kelas',
            'Kode Unit',
            'Nama Alat',
            'Lokasi Alat',
            'Status',
            'Tanggal Kembali',
            'Kondisi Kembali',
            'Catatan',
        ];
        $sheet->fromArray([$headers], null, 'A1');

        // Set header style
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        // Add data rows
        $row = 2;
        foreach ($loans as $loan) {
            $borrowerType = $loan->student ? 'Siswa' : 'Guru';
            $borrowerId = $loan->student ? ($loan->student->nis ?? '') : ($loan->borrowerTeacher ? ($loan->borrowerTeacher->nip ?? '') : '');
            $borrowerName = $loan->student ? ($loan->student->name ?? '') : ($loan->borrowerTeacher ? ($loan->borrowerTeacher->name ?? '') : '');
            $majorName = $loan->student && $loan->student->major ? $loan->student->major->name : '';
            $class = $loan->student ? ($loan->student->class ?? '') : '';

            $sheet->setCellValue('A' . $row, $loan->borrowed_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue('B' . $row, $borrowerType);
            $sheet->setCellValue('C' . $row, $borrowerId);
            $sheet->setCellValue('D' . $row, $borrowerName);
            $sheet->setCellValue('E' . $row, $majorName);
            $sheet->setCellValue('F' . $row, $class);
            $sheet->setCellValue('G' . $row, $loan->toolUnit->unit_code ?? '');
            $sheet->setCellValue('H' . $row, $loan->toolUnit->tool->name ?? '');
            $sheet->setCellValue('I' . $row, $loan->toolUnit->tool->location ?? '');
            $sheet->setCellValue('J' . $row, $loan->status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan');
            $sheet->setCellValue('K' . $row, $loan->returned_at ? $loan->returned_at->format('Y-m-d H:i:s') : '');

            $conditionLabels = [
                'good' => 'Baik',
                'damaged' => 'Rusak',
                'service' => 'Perlu Service',
            ];
            $sheet->setCellValue('L' . $row, $loan->return_condition ? ($conditionLabels[$loan->return_condition] ?? $loan->return_condition) : '');
            $sheet->setCellValue('M' . $row, $loan->notes ?? '');

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'riwayat_peminjaman_' . date('Y-m-d_His') . ($format === 'csv' ? '.csv' : '.xlsx');

        if ($format === 'csv') {
            $writer = new Csv($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclosure('"');
            $writer->setLineEnding("\r\n");

            return new StreamedResponse(function () use ($writer) {
                $writer->save('php://output');
            }, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
            ]);
        } else {
            $writer = new Xlsx($spreadsheet);

            return new StreamedResponse(function () use ($writer) {
                $writer->save('php://output');
            }, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
            ]);
        }
    }

    /**
     * Display a listing of tool loans (admin only).
     */
    public function index(Request $request): Response
    {
        $query = ToolLoan::with(['student.major', 'borrowerTeacher', 'toolUnit.tool']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($q) use ($search) {
                    $q->where('nis', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('borrowerTeacher', function ($q) use ($search) {
                    $q->where('nip', 'like', "%{$search}%")
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

    /**
     * Serve private tool loan photos (requires authentication).
     */
    public function servePhoto(string $type, string $filename)
    {
        // Validate photo type
        if (!in_array($type, ['borrow', 'return'])) {
            abort(404);
        }

        $path = "tool-loans/{$type}/{$filename}";

        // Check if file exists in private storage
        if (!Storage::disk('local')->exists($path)) {
            abort(404);
        }

        // Get the file and return as response
        $file = Storage::disk('local')->get($path);
        $mimeType = Storage::disk('local')->mimeType($path);

        return response($file, 200)->header('Content-Type', $mimeType);
    }
}
