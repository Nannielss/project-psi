import { FormEvent, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

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
                        Add Supplier
                    </button>
                </div>
            }
        >
            <Head title="Supplier" />

            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="vk-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">{suppliers.length}</p>
                            <span className="pt-1 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Supplier</span>
                        </div>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Partner pengadaan aktif untuk restock dan operasional gudang.</p>
                    </div>

                    <div className="vk-card p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Operational Insight</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Simpan kontak pemasok, nomor telepon, dan alamat agar proses pengadaan lebih cepat, konsisten, dan mudah ditelusuri.
                        </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Daftar Supplier</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola data pemasok barang gudang dalam satu panel yang rapi.</p>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Tambah Supplier
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left">
                            <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Nama Supplier</th>
                                    <th className="px-6 py-4 font-semibold">No. HP</th>
                                    <th className="px-6 py-4 font-semibold">Alamat</th>
                                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum ada supplier</p>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tambahkan pemasok agar proses restock lebih terstruktur.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-slate-50/65 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-5 font-semibold text-slate-800 dark:text-slate-100">{supplier.name}</td>
                                            <td className="px-6 py-5 text-slate-600 dark:text-slate-400">{supplier.phone || '-'}</td>
                                            <td className="px-6 py-5 text-slate-500 dark:text-slate-400">{supplier.address || '-'}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openModal(supplier)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-amber-950/30" title="Edit supplier">Edit</button>
                                                    <button onClick={() => handleDelete(supplier)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-rose-950/30" title="Hapus supplier">Hapus</button>
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
                    <div className="vk-card w-full max-w-lg overflow-hidden">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800 dark:text-slate-100">
                                    {selectedSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Simpan data pemasok barang untuk kebutuhan gudang.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Supplier</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    className="vk-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">No. HP</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                    className="vk-field"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Alamat</label>
                                <textarea
                                    value={form.address}
                                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                                    className="vk-textarea"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                                <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    Batal
                                </button>
                                <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                    Simpan Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
