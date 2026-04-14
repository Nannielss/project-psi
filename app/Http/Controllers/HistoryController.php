<?php

namespace App\Http\Controllers;

use App\Models\DamagedItem;
use App\Models\Item;
use App\Models\Location;
use App\Models\Sale;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(): Response
    {
        $today = now()->startOfDay();

        return Inertia::render('History/Index', [
            'summary' => [
                'restock_count' => StockTransaction::where('type', 'in')->count(),
                'adjustment_count' => StockTransaction::where('type', 'adjustment')->count(),
                'sales_count' => Sale::count(),
                'volume_30_days' => (float) Sale::where('created_at', '>=', now()->subDays(30))->sum('total_amount'),
            ],
            'restocks' => StockTransaction::with('item:id,kode_barang,nama_barang,satuan', 'user:id,username')
                ->where('type', 'in')
                ->latest()
                ->limit(30)
                ->get(),
            'adjustments' => StockTransaction::with('item:id,kode_barang,nama_barang,satuan', 'user:id,username')
                ->where('type', 'adjustment')
                ->latest()
                ->limit(30)
                ->get(),
            'sales' => Sale::with('user:id,username', 'customer:id,shop_name')
                ->latest()
                ->limit(30)
                ->get(),
            'today' => $today->format('Y-m-d'),
        ]);
    }

    public function exportPdf(Request $request)
    {
        $summary = [
            'total_items' => Item::count(),
            'damaged_items' => DamagedItem::count(),
            'locations' => Location::count(),
            'restock_count' => StockTransaction::where('type', 'in')->count(),
            'adjustment_count' => StockTransaction::where('type', 'adjustment')->count(),
            'sales_count' => Sale::count(),
            'volume_30_days' => (float) Sale::where('created_at', '>=', now()->subDays(30))->sum('total_amount'),
        ];

        $restocks = StockTransaction::with('item:id,kode_barang,nama_barang,satuan', 'user:id,username')
            ->where('type', 'in')
            ->latest()
            ->limit(25)
            ->get();

        $adjustments = StockTransaction::with('item:id,kode_barang,nama_barang,satuan', 'user:id,username')
            ->where('type', 'adjustment')
            ->latest()
            ->limit(25)
            ->get();

        $sales = Sale::with('user:id,username', 'customer:id,shop_name')
            ->latest()
            ->limit(25)
            ->get();

        return response()->view('exports.history-pdf', [
            'generatedAt' => now(),
            'summary' => $summary,
            'restocks' => $restocks,
            'adjustments' => $adjustments,
            'sales' => $sales,
            'autoPrint' => $request->boolean('print', true),
        ]);
    }
}
