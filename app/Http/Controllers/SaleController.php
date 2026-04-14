<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockTransaction;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Sales/Index', [
            'customers' => Customer::query()
                ->select('id', 'shop_name', 'phone', 'address', 'tier', 'category')
                ->orderBy('shop_name')
                ->get(),
            'items' => Item::query()
                ->select('id', 'kode_barang', 'nama_barang', 'satuan', 'stok', 'harga_jual', 'location_id')
                ->where('stok', '>', 0)
                ->orderBy('nama_barang')
                ->get(),
            'recentSales' => Sale::with([
                'customer:id,shop_name,tier,category',
                'user:id,username',
                'items.item:id,kode_barang,nama_barang,satuan',
            ])->latest()->limit(12)->get(),
            'summary' => [
                'sales_today' => (float) Sale::whereDate('created_at', today())->sum('total_amount'),
                'transactions_today' => Sale::whereDate('created_at', today())->count(),
                'items_available' => Item::where('stok', '>', 0)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_mode' => 'required|in:member,non_member',
            'notes' => 'nullable|string|max:1000',
            'payment_method' => 'required|in:cash,transfer,qris,debit',
            'cash_received' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:nominal,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $sale = DB::transaction(function () use ($validated, $request) {
            if ($validated['customer_mode'] === 'member' && empty($validated['customer_id'])) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Pilih pelanggan member terlebih dahulu.',
                ]);
            }

            if ($validated['customer_mode'] === 'non_member') {
                $validated['customer_id'] = null;
            }

            $lineItems = collect($validated['items'])
                ->map(fn (array $line) => [
                    'item_id' => (int) $line['item_id'],
                    'quantity' => (int) $line['quantity'],
                ])
                ->groupBy('item_id')
                ->map(fn ($grouped) => [
                    'item_id' => $grouped[0]['item_id'],
                    'quantity' => $grouped->sum('quantity'),
                ])
                ->values();

            $items = Item::query()
                ->whereIn('id', $lineItems->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $saleLines = $lineItems->map(function (array $line) use ($items) {
                /** @var Item|null $item */
                $item = $items->get($line['item_id']);

                if (!$item) {
                    throw ValidationException::withMessages([
                        'items' => 'Ada barang yang tidak ditemukan saat proses checkout.',
                    ]);
                }

                if ($item->stok < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$item->nama_barang} tidak mencukupi.",
                    ]);
                }

                $price = (float) $item->harga_jual;

                return [
                    'item' => $item,
                    'quantity' => $line['quantity'],
                    'price' => $price,
                    'subtotal' => $price * $line['quantity'],
                ];
            });

            $subtotalAmount = (float) $saleLines->sum('subtotal');
            $discountType = $validated['discount_type'] ?? 'nominal';
            $discountValue = max((float) ($validated['discount_value'] ?? 0), 0);
            $discountAmount = $discountType === 'percent'
                ? round($subtotalAmount * min($discountValue, 100) / 100, 2)
                : min($discountValue, $subtotalAmount);
            $totalAmount = max($subtotalAmount - $discountAmount, 0);
            $paymentMethod = $validated['payment_method'];
            $cashReceived = $paymentMethod === 'cash'
                ? (float) ($validated['cash_received'] ?? 0)
                : $totalAmount;
            $changeAmount = $paymentMethod === 'cash'
                ? $cashReceived - $totalAmount
                : 0;

            if ($paymentMethod === 'cash' && $cashReceived < $totalAmount) {
                throw ValidationException::withMessages([
                    'cash_received' => 'Uang tunai yang diterima kurang dari total belanja.',
                ]);
            }

            $sale = Sale::create([
                'customer_id' => $validated['customer_id'] ?? null,
                'customer_mode' => $validated['customer_mode'],
                'user_id' => $request->user()->id,
                'total_amount' => $totalAmount,
                'subtotal_amount' => $subtotalAmount,
                'discount_amount' => $discountAmount,
                'discount_type' => $discountType,
                'discount_value' => $discountType === 'percent'
                    ? min($discountValue, 100)
                    : min($discountValue, $subtotalAmount),
                'payment_method' => $paymentMethod,
                'cash_received' => $cashReceived,
                'change_amount' => $changeAmount,
            ]);

            foreach ($saleLines as $line) {
                /** @var Item $item */
                $item = $line['item'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'item_id' => $item->id,
                    'quantity' => $line['quantity'],
                    'price' => $line['price'],
                    'subtotal' => $line['subtotal'],
                ]);

                $item->decrement('stok', $line['quantity']);

                StockTransaction::create([
                    'item_id' => $item->id,
                    'user_id' => $request->user()->id,
                    'type' => 'out',
                    'quantity' => $line['quantity'],
                'remarks' => 'Penjualan kasir #' . $sale->id . ($validated['notes'] ? ' - ' . $validated['notes'] : ''),
                ]);
            }

            return $sale->load([
                'customer:id,shop_name,tier,category',
                'user:id,username',
                'items.item:id,kode_barang,nama_barang,satuan',
            ]);
        });

        return redirect()->route('sales.index')
            ->with('success', 'Transaksi kasir berhasil disimpan. Total ' . number_format((float) $sale->total_amount, 0, ',', '.'))
            ->with('receipt_url', route('sales.receipt', ['sale' => $sale->id, 'auto_print' => 1]));
    }

    public function receipt(Request $request, Sale $sale): View
    {
        $sale->load([
            'customer:id,shop_name,phone,address',
            'user:id,username,name',
            'items.item:id,kode_barang,nama_barang,satuan',
        ]);

        return view('receipts.sale-58mm', [
            'sale' => $sale,
            'branding' => AppSetting::sharedData(),
            'printedAt' => now(),
            'autoPrint' => (bool) $request->boolean('auto_print', true),
        ]);
    }

    public function clearRecent(Request $request)
    {
        $validated = $request->validate([
            'sale_ids' => 'required|array|min:1',
            'sale_ids.*' => 'required|integer|exists:sales,id',
        ]);

        $deletedCount = DB::transaction(function () use ($validated) {
            $sales = Sale::query()
                ->with('items')
                ->whereIn('id', $validated['sale_ids'])
                ->lockForUpdate()
                ->get();

            if ($sales->isEmpty()) {
                return 0;
            }

            Sale::query()->whereIn('id', $sales->pluck('id'))->delete();

            return $sales->count();
        });

        return redirect()->route('sales.index')
            ->with('success', "{$deletedCount} riwayat transaksi berhasil dibersihkan. Stok barang tidak diubah.");
    }
}
