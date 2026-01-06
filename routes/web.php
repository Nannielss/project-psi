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
use App\Http\Controllers\UserController;
use App\Http\Controllers\PrintQRController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', [ToolLoanController::class, 'dashboard'])->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/history', [ToolLoanController::class, 'history'])->middleware(['auth', 'verified'])->name('history');
Route::get('/history/export', [ToolLoanController::class, 'exportHistory'])->middleware(['auth', 'verified'])->name('history.export');

// Tool Loans - Public routes (no auth required)
Route::get('tool-loans', [ToolLoanController::class, 'indexPage'])->name('tool-loans.index-page');
Route::get('tool-loans/borrow', [ToolLoanController::class, 'borrowPage'])->name('tool-loans.borrow');
Route::get('tool-loans/return', [ToolLoanController::class, 'returnPage'])->name('tool-loans.return');
Route::get('tool-loans/teachers', [ToolLoanController::class, 'getTeachers'])->name('tool-loans.teachers');
Route::get('tool-loans/search-tools', [ToolLoanController::class, 'searchTools'])->name('tool-loans.search-tools');
Route::get('tool-loans/tools-catalog', [ToolLoanController::class, 'getToolsCatalog'])->name('tool-loans.tools-catalog');
Route::get('tool-loans/tools/{toolId}/available-units', [ToolLoanController::class, 'getAvailableUnits'])->name('tool-loans.available-units');
Route::get('tool-loans/active-loans/{studentId}', [ToolLoanController::class, 'getActiveLoansByStudent'])->name('tool-loans.active-loans');
Route::post('tool-loans/verify-borrower', [ToolLoanController::class, 'verifyBorrower'])->name('tool-loans.verify-borrower');
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
    Route::get('students/import/template', [StudentController::class, 'downloadTemplate'])->name('students.import.template');
    Route::resource('students', StudentController::class);

    Route::resource('majors', MajorController::class);

    // Teachers routes - specific routes before resource
    Route::get('teachers/for-qr', [TeacherController::class, 'forQr'])->name('teachers.for-qr');
    Route::resource('teachers', TeacherController::class);
    Route::resource('subjects', SubjectController::class);

    // Materials - all authenticated users can view, but only non-guru can CRUD
    Route::get('materials', [MaterialController::class, 'index'])->name('materials.index');
    Route::middleware('role:admin,kajur,wakajur')->group(function () {
        Route::post('materials', [MaterialController::class, 'store'])->name('materials.store');
        Route::put('materials/{material}', [MaterialController::class, 'update'])->name('materials.update');
        Route::delete('materials/{material}', [MaterialController::class, 'destroy'])->name('materials.destroy');
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

    // Material pickup - admin, kepala jurusan, wakajur + guru
    Route::middleware('role:admin,kajur,wakajur,guru')->group(function () {
        Route::get('material-pickups', [MaterialPickupController::class, 'index'])->name('material-pickups.index');
        Route::get('material-pickups/create', [MaterialPickupController::class, 'create'])->name('material-pickups.create');
        Route::post('material-pickups', [MaterialPickupController::class, 'store'])->name('material-pickups.store');
        
        // Materials CRUD within material-pickups page - non-guru only
        Route::middleware('role:admin,kajur,wakajur')->group(function () {
            Route::post('material-pickups/materials', [MaterialPickupController::class, 'storeMaterial'])->name('material-pickups.materials.store');
            Route::put('material-pickups/materials/{material}', [MaterialPickupController::class, 'updateMaterial'])->name('material-pickups.materials.update');
            Route::delete('material-pickups/materials/{material}', [MaterialPickupController::class, 'destroyMaterial'])->name('material-pickups.materials.destroy');
        });
    });

    // Maintenance routes
    Route::get('maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
    Route::post('maintenance/{unit}/repair', [MaintenanceController::class, 'markAsRepaired'])->name('maintenance.repair');
    Route::post('maintenance/{unit}/scrap', [MaintenanceController::class, 'markAsScrapped'])->name('maintenance.scrap');

    // Users CRUD - admin, kajur, wakajur only
    Route::middleware('role:admin,kajur,wakajur')->group(function () {
        Route::resource('users', UserController::class);
    });

    // Print QR
    Route::get('print-qr', [PrintQRController::class, 'index'])->name('print-qr.index');

});

require __DIR__.'/auth.php';
