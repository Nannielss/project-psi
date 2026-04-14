import { FormEvent, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Edit, Package, Plus, Trash2, Truck } from 'lucide-react';

type Supplier = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
};

type SupplierForm = {
    name: string;
    phone: string;
    address: string;
};

type SuppliersPageProps = {
    suppliers: Supplier[];
};

const defaultForm: SupplierForm = {
    name: '',
    phone: '',
    address: '',
};

export default function SuppliersIndex({ suppliers }: SuppliersPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [form, setForm] = useState<SupplierForm>(defaultForm);

    const openModal = (supplier: Supplier | null = null) => {
        setSelectedSupplier(supplier);
        setForm({
            name: supplier?.name ?? '',
            phone: supplier?.phone ?? '',
            address: supplier?.address ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedSupplier(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedSupplier) {
            router.put(route('suppliers.update', selectedSupplier.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('suppliers.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (supplier: Supplier) => {
        if (!confirm(`Hapus supplier "${supplier.name}"?`)) {
            return;
        }

        router.delete(route('suppliers.destroy', supplier.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Supplier Management</p>
                        <h1 className="vk-page-title">Supplier Network</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Kelola partner pengadaan, kontak utama, dan jaringan pemasok untuk restock gudang.
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="vk-card-dark inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        <Plus className="h-4 w-4" />
                        Add Supplier
                    </button>
                </div>
            }
        >
            <Head title="Supplier" />

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="vk-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-xl bg-indigo-50 p-3">
                                    <Truck className="h-6 w-6 text-indigo-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Total Supplier</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{suppliers.length}</p>
                    </div>

                    <div className="vk-card p-6 md:col-span-2">
                            <p className="text-sm font-medium text-gray-500">Kegunaan</p>
                            <p className="mt-2 text-sm leading-6 text-gray-700">
                                Modul ini dipakai untuk menyimpan data pemasok barang agar proses restock lebih rapi dan mudah ditelusuri.
                            </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Daftar Supplier</h3>
                                <p className="mt-1 text-sm text-gray-500">Kelola data pemasok barang gudang.</p>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Supplier
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Nama Supplier</th>
                                        <th className="px-6 py-4 font-semibold">No. HP</th>
                                        <th className="px-6 py-4 font-semibold">Alamat</th>
                                        <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {suppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <Package className="mb-3 h-10 w-10 text-gray-300" />
                                                    <p>Belum ada supplier.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        suppliers.map((supplier) => (
                                            <tr key={supplier.id} className="hover:bg-gray-50/80">
                                                <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                                                <td className="px-6 py-4">{supplier.phone || '-'}</td>
                                                <td className="px-6 py-4">{supplier.address || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => openModal(supplier)}
                                                            className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50 hover:text-amber-700"
                                                            title="Edit supplier"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(supplier)}
                                                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                            title="Hapus supplier"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-gray-100 p-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {selectedSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">Simpan data pemasok barang untuk kebutuhan gudang.</p>
                            </div>
                            <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">Nama Supplier</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">No. HP</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">Alamat</label>
                                <textarea
                                    value={form.address}
                                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                                    className="block min-h-28 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
                                    Batal
                                </button>
                                <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
