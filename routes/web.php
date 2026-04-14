<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\StockTransactionController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DamagedItemController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\UserController;
use App\Models\DamagedItem;
use App\Models\Item;
use App\Models\Location;
use App\Models\Sale;
use App\Models\StockTransaction;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $today = now()->startOfDay();

        $inventoryValue = Item::query()
            ->get(['stok', 'harga_jual'])
            ->sum(fn (Item $item) => $item->stok * (float) $item->harga_jual);

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_items' => Item::count(),
                'low_stock_items' => Item::where('stok', '<=', 10)->count(),
                'inventory_value' => $inventoryValue,
                'total_locations' => Location::count(),
                'stock_movements_today' => StockTransaction::whereDate('created_at', '>=', $today)->count(),
                'sales_today' => (float) Sale::whereDate('created_at', '>=', $today)->sum('total_amount'),
                'damaged_items' => DamagedItem::count(),
            ],
            'recentRestocks' => StockTransaction::with('item:id,nama_barang,satuan')
                ->where('type', 'in')
                ->latest()
                ->limit(4)
                ->get()
                ->map(fn (StockTransaction $transaction) => [
                    'id' => $transaction->id,
                    'item_name' => $transaction->item?->nama_barang,
                    'quantity' => $transaction->quantity,
                    'unit' => $transaction->item?->satuan,
                    'time' => $transaction->created_at?->format('H:i'),
                    'remarks' => $transaction->remarks,
                ]),
        ]);
    })->name('dashboard')->middleware('role:admin,petugas,kasir');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy')->middleware('role:admin');
    Route::get('/profile-photos/{filename}', [ProfileController::class, 'servePhoto'])->name('profile-photos');
    Route::get('/branding-logo/{filename}', [ProfileController::class, 'serveBrandingLogo'])->name('branding.logo');
    Route::patch('/profile/branding', [ProfileController::class, 'updateBranding'])->name('profile.branding.update')->middleware('role:admin');

    Route::middleware('role:admin,petugas')->group(function () {
        Route::resource('items', ItemController::class)->except(['create', 'show', 'edit']);
        Route::resource('suppliers', SupplierController::class)->except(['create', 'show', 'edit']);
        Route::resource('locations', LocationController::class)->except(['create', 'show', 'edit']);
        Route::resource('stock-transactions', StockTransactionController::class)->except(['create', 'show', 'edit']);
        Route::resource('damaged-items', DamagedItemController::class)->except(['create', 'show', 'edit']);
        Route::get('/barcode', [BarcodeController::class, 'index'])->name('barcode.index');
    });

    Route::middleware('role:admin,kasir')->group(function () {
        Route::resource('customers', CustomerController::class)->except(['create', 'show', 'edit']);
        Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
        Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
        Route::get('/sales/{sale}/receipt', [SaleController::class, 'receipt'])->name('sales.receipt');
    });

    Route::delete('/sales/recent', [SaleController::class, 'clearRecent'])
        ->name('sales.clear-recent')
        ->middleware('role:admin');

    Route::middleware('role:admin,petugas,kasir')->group(function () {
        Route::get('/history', [HistoryController::class, 'index'])->name('history.index');
        Route::get('/history/export-pdf', [HistoryController::class, 'exportPdf'])->name('history.export-pdf');
    });
});

// Admin specific routes
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::resource('users', UserController::class);
});

require __DIR__.'/auth.php';
