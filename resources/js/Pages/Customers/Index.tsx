import { FormEvent, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

type Customer = {
    id: number;
    shop_name: string;
    phone: string | null;
    address: string | null;
    tier: 'retail' | 'wholesale' | 'member';
    category: string | null;
};

type CustomerForm = {
    shop_name: string;
    phone: string;
    address: string;
    tier: 'retail' | 'wholesale' | 'member';
    category: string;
};

type CustomersPageProps = {
    customers: Customer[];
};

const defaultForm: CustomerForm = {
    shop_name: '',
    phone: '',
    address: '',
    tier: 'retail',
    category: 'general',
};

export default function CustomersIndex({ customers }: CustomersPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [form, setForm] = useState<CustomerForm>(defaultForm);

    const retailCount = useMemo(() => customers.filter((customer) => customer.tier === 'retail').length, [customers]);
    const wholesaleCount = useMemo(() => customers.filter((customer) => customer.tier === 'wholesale').length, [customers]);

    const openModal = (customer: Customer | null = null) => {
        setSelectedCustomer(customer);
        setForm({
            shop_name: customer?.shop_name ?? '',
            phone: customer?.phone ?? '',
            address: customer?.address ?? '',
            tier: customer?.tier ?? 'retail',
            category: customer?.category ?? 'general',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedCustomer(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedCustomer) {
            router.put(route('customers.update', selectedCustomer.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('customers.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (customer: Customer) => {
        if (!confirm(`Hapus pelanggan "${customer.shop_name}"?`)) {
            return;
        }

        router.delete(route('customers.destroy', customer.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Customer Relation</p>
                        <h1 className="vk-page-title">Pelanggan / Reseller</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Kelola toko, reseller, dan partner penjualan agar transaksi dan tier harga lebih mudah dipantau.
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="vk-card-dark inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        Add Partner
                    </button>
                </div>
            }
        >
            <Head title="Pelanggan / Reseller" />

            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="vk-card-dark p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/65">Total Mitra</p>
                        <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{customers.length}</p>
                        <p className="mt-2 text-sm text-white/70">Basis pelanggan aktif sistem</p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Distribusi Tier</p>
                        <div className="mt-4 flex items-center gap-4">
                                <div className="h-16 w-3 rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                    className="rounded-full bg-primary"
                                    style={{ height: `${customers.length === 0 ? 0 : Math.max(12, (retailCount / customers.length) * 100)}%` }}
                                />
                                </div>
                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <p><span className="font-semibold text-slate-800 dark:text-slate-100">{retailCount}</span> Retail</p>
                                <p><span className="font-semibold text-slate-800 dark:text-slate-100">{wholesaleCount}</span> Wholesale</p>
                            </div>
                        </div>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Partner Baru</p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {['A', 'B', 'C'].map((label) => (
                                    <div key={label} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-300">
                                        {label}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Siap diprospek minggu ini</p>
                        </div>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Daftar Mitra & Reseller</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Data toko, kontak, dan alamat pelanggan.</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Tambah Partner
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">ID</th>
                                    <th className="px-6 py-4 font-semibold">Nama Toko</th>
                                    <th className="px-6 py-4 font-semibold">No HP</th>
                                    <th className="px-6 py-4 font-semibold">Alamat</th>
                                    <th className="px-6 py-4 text-center font-semibold">Tier</th>
                                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum ada data pelanggan</p>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tambahkan toko atau reseller agar modul penjualan siap dipakai.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-slate-50/65 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-5">
                                                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    RS-{String(customer.id).padStart(4, '0')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{customer.shop_name}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{customer.category || 'general'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 dark:text-slate-400">{customer.phone || '-'}</td>
                                            <td className="px-6 py-5 text-slate-500 dark:text-slate-400">{customer.address || '-'}</td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex min-w-[104px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize leading-none ${
                                                    customer.tier === 'wholesale'
                                                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200'
                                                        : customer.tier === 'member'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200'
                                                }`}>
                                                    {customer.tier}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openModal(customer)}
                                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:border-amber-200 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-amber-950/30"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(customer)}
                                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-rose-950/30"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-xl overflow-hidden">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                                    {selectedCustomer ? 'Edit Partner' : 'Tambah Partner'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">Simpan data toko, nomor kontak, dan alamat pelanggan.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500">
                                x
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Nama Toko</label>
                                <input
                                    type="text"
                                    value={form.shop_name}
                                    onChange={(event) => setForm({ ...form, shop_name: event.target.value })}
                                    className="vk-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">No HP</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                    className="vk-field"
                                />
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tier</label>
                                    <select
                                        value={form.tier}
                                        onChange={(event) => setForm({ ...form, tier: event.target.value as CustomerForm['tier'] })}
                                        className="vk-select"
                                    >
                                        <option value="retail">Retail</option>
                                        <option value="wholesale">Wholesale</option>
                                        <option value="member">Member</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Kategori</label>
                                    <input
                                        type="text"
                                        value={form.category}
                                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                                        className="vk-field"
                                        placeholder="Contoh: toko kelontong, cafe, elektronik"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Alamat</label>
                                <textarea
                                    value={form.address}
                                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                                    className="vk-textarea"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600">
                                    Batal
                                </button>
                                <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                    Simpan Partner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
