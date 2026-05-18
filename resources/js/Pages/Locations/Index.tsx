import { FormEvent, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

type Location = {
    id: number;
    name: string;
    description: string | null;
    items_count: number;
};

type LocationForm = {
    name: string;
    description: string;
};

type LocationsPageProps = {
    locations: Location[];
};

const defaultForm: LocationForm = {
    name: '',
    description: '',
};

export default function LocationsIndex({ locations }: LocationsPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [form, setForm] = useState<LocationForm>(defaultForm);

    const openModal = (location: Location | null = null) => {
        setSelectedLocation(location);
        setForm({
            name: location?.name ?? '',
            description: location?.description ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedLocation(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedLocation) {
            router.put(route('locations.update', selectedLocation.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('locations.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (location: Location) => {
        if (!confirm(`Hapus lokasi "${location.name}"?`)) {
            return;
        }

        router.delete(route('locations.destroy', location.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Lokasi Penyimpanan</p>
                        <h1 className="vk-page-title">Space Intelligence</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Atur distribusi gudang, rak, dan titik penyimpanan agar pergerakan stok lebih akurat.
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="vk-card-dark inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        New Warehouse Unit
                    </button>
                </div>
            }
        >
            <Head title="Lokasi Penyimpanan" />

            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="vk-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">{locations.length}</p>
                            <span className="pt-1 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Lokasi</span>
                        </div>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Titik penyimpanan aktif untuk gudang, rak, dan area display.</p>
                    </div>

                    <div className="vk-card p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Storage Mapping</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Pisahkan gudang, rak, meja display, atau area bahan agar perpindahan stok lebih akurat dan mudah dilacak.
                        </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Daftar Lokasi</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola lokasi penyimpanan barang dalam struktur yang rapi.</p>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                            Tambah Lokasi
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead className="bg-slate-50/70 dark:bg-slate-800/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Nama Lokasi</th>
                                    <th className="px-6 py-4 font-semibold">Deskripsi</th>
                                    <th className="px-6 py-4 font-semibold">Jumlah Barang</th>
                                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Belum ada lokasi penyimpanan</p>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tambahkan lokasi untuk memetakan stok secara lebih presisi.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map((location) => (
                                        <tr key={location.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/65 dark:bg-slate-800/65">
                                            <td className="px-6 py-5 font-semibold text-slate-800 dark:text-slate-100">{location.name}</td>
                                            <td className="px-6 py-5 text-slate-500 dark:text-slate-400">{location.description || '-'}</td>
                                            <td className="px-6 py-5">
                                                <span className="vk-status-success rounded-full px-3 py-1 text-xs font-semibold">
                                                    {location.items_count} barang
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openModal(location)} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50" title="Edit lokasi">Edit</button>
                                                    <button onClick={() => handleDelete(location)} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50" title="Hapus lokasi">Hapus</button>
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
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800 dark:text-slate-100">
                                    {selectedLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atur titik penyimpanan untuk barang gudang.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-500 transition hover:bg-slate-50">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Nama Lokasi</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    className="vk-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Deskripsi</label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                                    className="vk-textarea"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                                    Batal
                                </button>
                                <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                    Simpan Lokasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
