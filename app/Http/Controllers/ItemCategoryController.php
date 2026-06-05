<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ItemCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItemCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Categories/Index', [
            'categories' => ItemCategory::query()
                ->withCount('items')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:item_categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        ItemCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Kategori barang berhasil ditambahkan.');
    }

    public function update(Request $request, ItemCategory $category)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('item_categories', 'name')->ignore($category->id),
            ],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Kategori barang berhasil diperbarui.');
    }

    public function destroy(ItemCategory $category)
    {
        if ($category->slug === 'umum') {
            return redirect()->back()->with('error', 'Kategori default Umum tidak boleh dihapus.');
        }

        DB::transaction(function () use ($category) {
            $defaultCategory = ItemCategory::firstOrCreate(
                ['slug' => 'umum'],
                [
                    'name' => 'Umum',
                    'description' => 'Kategori default untuk barang yang belum dikelompokkan.',
                ],
            );

            Item::query()
                ->where('item_category_id', $category->id)
                ->update(['item_category_id' => $defaultCategory->id]);

            $category->delete();
        });

        return redirect()->back()->with('success', 'Kategori dihapus. Barang terkait dipindahkan ke kategori Umum.');
    }
}
