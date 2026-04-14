<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockTransactionController extends Controller
{
    public function index()
    {
        return Inertia::render('StockTransactions/Index', [
            'items' => Item::orderBy('nama_barang')->get([
                'id',
                'kode_barang',
                'nama_barang',
                'stok',
                'satuan',
            ]),
            'transactions' => StockTransaction::with([
                'item:id,kode_barang,nama_barang,satuan',
                'user:id,username',
            ])->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($validated, $request) {
            $item = Item::lockForUpdate()->findOrFail($validated['item_id']);

            $this->applyStockMutation($item, $validated['type'], $validated['quantity']);

            StockTransaction::create([
                ...$validated,
                'user_id' => $request->user()->id,
            ]);
        });

        return redirect()->back()->with('success', 'Transaksi stok berhasil ditambahkan.');
    }

    public function update(Request $request, StockTransaction $stockTransaction)
    {
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($validated, $request, $stockTransaction) {
            $oldItem = Item::lockForUpdate()->findOrFail($stockTransaction->item_id);
            $this->revertStockMutation($oldItem, $stockTransaction->type, $stockTransaction->quantity);

            if ((int) $validated['item_id'] !== $oldItem->id) {
                $newItem = Item::lockForUpdate()->findOrFail($validated['item_id']);
            } else {
                $newItem = $oldItem;
            }

            $this->applyStockMutation($newItem, $validated['type'], $validated['quantity']);

            $stockTransaction->update([
                ...$validated,
                'user_id' => $request->user()->id,
            ]);
        });

        return redirect()->back()->with('success', 'Transaksi stok berhasil diperbarui.');
    }

    public function destroy(StockTransaction $stockTransaction)
    {
        DB::transaction(function () use ($stockTransaction) {
            $item = Item::lockForUpdate()->findOrFail($stockTransaction->item_id);
            $this->revertStockMutation($item, $stockTransaction->type, $stockTransaction->quantity);
            $stockTransaction->delete();
        });

        return redirect()->back()->with('success', 'Transaksi stok berhasil dihapus.');
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:items,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|not_in:0',
            'remarks' => 'nullable|string',
        ]);

        if (in_array($validated['type'], ['in', 'out'], true) && $validated['quantity'] < 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Jumlah untuk stok masuk/keluar harus bernilai positif.',
            ]);
        }

        return $validated;
    }

    private function applyStockMutation(Item $item, string $type, int $quantity): void
    {
        $newStock = match ($type) {
            'in' => $item->stok + $quantity,
            'out' => $item->stok - $quantity,
            'adjustment' => $item->stok + $quantity,
        };

        if ($newStock < 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Stok barang tidak mencukupi untuk transaksi ini.',
            ]);
        }

        $item->update(['stok' => $newStock]);
    }

    private function revertStockMutation(Item $item, string $type, int $quantity): void
    {
        $revertedStock = match ($type) {
            'in' => $item->stok - $quantity,
            'out' => $item->stok + $quantity,
            'adjustment' => $item->stok - $quantity,
        };

        if ($revertedStock < 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Data stok saat ini tidak konsisten untuk membatalkan transaksi lama.',
            ]);
        }

        $item->update(['stok' => $revertedStock]);
    }
}
