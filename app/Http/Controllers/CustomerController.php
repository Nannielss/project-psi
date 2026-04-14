<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index()
    {
        return Inertia::render('Customers/Index', [
            'customers' => Customer::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tier' => 'required|in:retail,wholesale,member',
            'category' => 'nullable|string|max:100',
        ]);

        Customer::create($validated);

        return redirect()->back()->with('success', 'Pelanggan berhasil ditambahkan.');
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'shop_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tier' => 'required|in:retail,wholesale,member',
            'category' => 'nullable|string|max:100',
        ]);

        $customer->update($validated);

        return redirect()->back()->with('success', 'Pelanggan berhasil diperbarui.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->back()->with('success', 'Pelanggan berhasil dihapus.');
    }
}
