<?php

namespace App\Http\Controllers;

use App\Models\Major;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Student::with('major');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nis', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filter by major
        if ($request->has('major_id') && $request->major_id) {
            $query->where('major_id', $request->major_id);
        }

        // Filter by class
        if ($request->has('class') && $request->class) {
            $query->where('class', $request->class);
        }

        $students = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        $majors = Major::orderBy('name')->get();
        $classes = Student::distinct()->orderBy('class')->pluck('class')->toArray();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'majors' => $majors,
            'classes' => $classes,
            'filters' => $request->only(['search', 'major_id', 'class']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nis' => 'required|string|unique:students,nis|max:255',
            'name' => 'required|string|max:255',
            'major_id' => 'required|exists:majors,id',
            'class' => 'required|string|max:255',
        ]);

        Student::create($validated);

        return redirect()->route('students.index')
            ->with('success', 'Siswa berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'nis' => 'required|string|max:255|unique:students,nis,' . $student->id,
            'name' => 'required|string|max:255',
            'major_id' => 'required|exists:majors,id',
            'class' => 'required|string|max:255',
        ]);

        $student->update($validated);

        return redirect()->route('students.index')
            ->with('success', 'Siswa berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        $student->delete();

        return redirect()->route('students.index')
            ->with('success', 'Siswa berhasil dihapus.');
    }

    /**
     * Import students from Excel file.
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

                $nis = trim($row[0] ?? '');
                $name = trim($row[1] ?? '');
                $class = trim($row[2] ?? '');

                // Validate required fields
                if (empty($nis) || empty($name) || empty($class)) {
                    $errors[] = "Baris " . ($i + 1) . " tidak valid: NIS, Nama, atau Class kosong";
                    continue;
                }

                // Extract major code from Class column
                // Format: [Tingkat] [Kode Jurusan] [Nomor Kelas]
                // Example: "X TE 1" -> extract "TE"
                $classParts = explode(' ', $class);
                if (count($classParts) < 3) {
                    $errors[] = "Baris " . ($i + 1) . " (NIS: {$nis}): Format Class tidak valid. Harus: [Tingkat] [Kode Jurusan] [Nomor Kelas]";
                    continue;
                }

                $majorKode = trim($classParts[1]); // Index 1 is the major code
                
                // Find major by kode
                $major = Major::where('kode', $majorKode)->first();

                if (!$major) {
                    $errors[] = "Baris " . ($i + 1) . " (NIS: {$nis}): Jurusan dengan kode '{$majorKode}' tidak ditemukan";
                    continue;
                }

                // Check if student already exists
                if (Student::where('nis', $nis)->exists()) {
                    $errors[] = "Baris " . ($i + 1) . " (NIS: {$nis}): Siswa dengan NIS ini sudah ada";
                    continue;
                }

                Student::create([
                    'nis' => $nis,
                    'name' => $name,
                    'major_id' => $major->id,
                    'class' => $class,
                ]);

                $imported++;
            }

            DB::commit();

            $message = "Berhasil mengimpor {$imported} siswa.";
            if (count($errors) > 0) {
                $message .= " Terjadi " . count($errors) . " error.";
            }

            return redirect()->route('students.index')
                ->with('success', $message)
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->route('students.index')
                ->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
        }
    }

    /**
     * Get all students for QR printing (without pagination).
     */
    public function forQr(Request $request)
    {
        $query = Student::with('major');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nis', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filter by major
        if ($request->has('major_id') && $request->major_id) {
            $query->where('major_id', $request->major_id);
        }

        // Filter by class
        if ($request->has('class') && $request->class) {
            $query->where('class', $request->class);
        }

        $students = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $students,
        ]);
    }

    /**
     * Download Excel template for student import.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'nis');
        $sheet->setCellValue('B1', 'name');
        $sheet->setCellValue('C1', 'Class');

        // Style header row
        $sheet->getStyle('A1:C1')->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);
        $sheet->getColumnDimension('C')->setAutoSize(true);

        $writer = new Xlsx($spreadsheet);
        
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template_import_siswa.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
