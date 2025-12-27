<?php

use App\Http\Controllers\MajorController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\MaterialPickupController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\ToolLoanController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [ToolLoanController::class, 'dashboard'])->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/history', [ToolLoanController::class, 'history'])->middleware(['auth', 'verified'])->name('history');

// Tool Loans - Public routes (no auth required)
Route::get('tool-loans', [ToolLoanController::class, 'indexPage'])->name('tool-loans.index-page');
Route::get('tool-loans/borrow', [ToolLoanController::class, 'borrowPage'])->name('tool-loans.borrow');
Route::get('tool-loans/return', [ToolLoanController::class, 'returnPage'])->name('tool-loans.return');
Route::post('tool-loans/verify-student', [ToolLoanController::class, 'verifyStudent'])->name('tool-loans.verify-student');
Route::post('tool-loans/verify-tool', [ToolLoanController::class, 'verifyTool'])->name('tool-loans.verify-tool');
Route::post('tool-loans/get-active-loan-by-tool', [ToolLoanController::class, 'getActiveLoanByTool'])->name('tool-loans.get-active-loan-by-tool');
Route::post('tool-loans/borrow', [ToolLoanController::class, 'storeBorrow'])->name('tool-loans.store-borrow');
Route::post('tool-loans/return', [ToolLoanController::class, 'storeReturn'])->name('tool-loans.store-return');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Students routes - specific routes before resource
    Route::get('students/for-qr', [StudentController::class, 'forQr'])->name('students.for-qr');
    Route::post('students/import', [StudentController::class, 'import'])->name('students.import');
    Route::resource('students', StudentController::class);

    Route::resource('majors', MajorController::class);

    // Teachers routes - specific routes before resource
    Route::get('teachers/for-qr', [TeacherController::class, 'forQr'])->name('teachers.for-qr');
    Route::resource('teachers', TeacherController::class);
    Route::resource('subjects', SubjectController::class);

    // Materials CRUD - kepala jurusan only
    Route::middleware('role:kajur')->group(function () {
        Route::resource('materials', MaterialController::class);
    });

    // Tools CRUD - specific routes before resource
    Route::get('tools/for-qr', [ToolController::class, 'forQr'])->name('tools.for-qr');
    Route::post('tools/import', [ToolController::class, 'import'])->name('tools.import');
    Route::get('tools/import/template', [ToolController::class, 'downloadTemplate'])->name('tools.import.template');
    Route::resource('tools', ToolController::class);
    Route::get('tools/{tool}/units', [ToolController::class, 'getUnits'])->name('tools.units');
    Route::post('tools/{tool}/units', [ToolController::class, 'addUnit'])->name('tools.units.add');
    Route::put('tools/{tool}/units/{unit}', [ToolController::class, 'updateUnit'])->name('tools.units.update');
    Route::delete('tools/{tool}/units/{unit}', [ToolController::class, 'deleteUnit'])->name('tools.units.delete');

    // Material pickup - kepala jurusan + guru
    Route::middleware('role:kajur,guru')->group(function () {
        Route::get('material-pickups', [MaterialPickupController::class, 'index'])->name('material-pickups.index');
        Route::get('material-pickups/create', [MaterialPickupController::class, 'create'])->name('material-pickups.create');
        Route::post('material-pickups', [MaterialPickupController::class, 'store'])->name('material-pickups.store');
        Route::post('material-pickups/verify-qr', [MaterialPickupController::class, 'verifyQR'])->name('material-pickups.verify-qr');
    });

    // Maintenance routes
    Route::get('maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
    Route::post('maintenance/{unit}/repair', [MaintenanceController::class, 'markAsRepaired'])->name('maintenance.repair');
    Route::post('maintenance/{unit}/scrap', [MaintenanceController::class, 'markAsScrapped'])->name('maintenance.scrap');

});

require __DIR__.'/auth.php';
