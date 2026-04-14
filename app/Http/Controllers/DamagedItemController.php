<?php

namespace App\Http\Controllers;

use App\Models\DamagedItem;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DamagedItemController extends Controller
{
    public function index()
    {
        return Inertia::render('DamagedItems/Index', [
            'items' => Item::orderBy('nama_barang')->get([
                'id',
                'kode_barang',
                'nama_barang',
                'stok',
                'satuan',
            ]),
            'entries' => DamagedItem::with('item:id,kode_barang,nama_barang,satuan')
                ->latest('date_reported')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($validated) {
            $item = Item::lockForUpdate()->findOrFail($validated['item_id']);
            $this->reduceStock($item, $validated['quantity']);

            DamagedItem::create($validated);
        });

        return redirect()->back()->with('success', 'Data barang bermasalah berhasil ditambahkan.');
    }

    public function update(Request $request, DamagedItem $damagedItem)
    {
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($validated, $damagedItem) {
            $oldItem = Item::lockForUpdate()->findOrFail($damagedItem->item_id);
            $oldItem->update(['stok' => $oldItem->stok + $damagedItem->quantity]);

            if ((int) $validated['item_id'] !== $oldItem->id) {
                $newItem = Item::lockForUpdate()->findOrFail($validated['item_id']);
            } else {
                $newItem = $oldItem;
            }

            $this->reduceStock($newItem, $validated['quantity']);
            $damagedItem->update($validated);
        });

        return redirect()->back()->with('success', 'Data barang bermasalah berhasil diperbarui.');
    }

    public function destroy(DamagedItem $damagedItem)
    {
        DB::transaction(function () use ($damagedItem) {
            $item = Item::lockForUpdate()->findOrFail($damagedItem->item_id);
            $item->update(['stok' => $item->stok + $damagedItem->quantity]);
            $damagedItem->delete();
        });

        return redirect()->back()->with('success', 'Data barang bermasalah berhasil dihapus.');
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'kondisi' => 'required|in:rusak,expired,hilang',
            'catatan_maintenance' => 'nullable|string',
            'date_reported' => 'required|date',
        ]);
    }

    private function reduceStock(Item $item, int $quantity): void
    {
        if ($item->stok < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => 'Stok barang tidak mencukupi untuk laporan ini.',
            ]);
        }

        $item->update(['stok' => $item->stok - $quantity]);
    }
}
