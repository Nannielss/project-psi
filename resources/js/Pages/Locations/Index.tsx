import { FormEvent, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Edit, MapPin, Package, Plus, Trash2 } from 'lucide-react';

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
                        <Plus className="h-4 w-4" />
                        New Warehouse Unit
                    </button>
                </div>
            }
        >
            <Head title="Lokasi Penyimpanan" />

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="vk-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-xl bg-emerald-50 p-3">
                                    <MapPin className="h-6 w-6 text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Total Lokasi</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{locations.length}</p>
                    </div>

                    <div className="vk-card p-6 md:col-span-2">
                            <p className="text-sm font-medium text-gray-500">Kegunaan</p>
                            <p className="mt-2 text-sm leading-6 text-gray-700">
                                Lokasi bisa dipakai untuk membedakan gudang, rak, meja display, atau area penyimpanan bahan/barang.
                            </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Daftar Lokasi</h3>
                                <p className="mt-1 text-sm text-gray-500">Kelola lokasi penyimpanan barang.</p>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Lokasi
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Nama Lokasi</th>
                                        <th className="px-6 py-4 font-semibold">Deskripsi</th>
                                        <th className="px-6 py-4 font-semibold">Jumlah Barang</th>
                                        <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {locations.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <Package className="mb-3 h-10 w-10 text-gray-300" />
                                                    <p>Belum ada lokasi penyimpanan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.map((location) => (
                                            <tr key={location.id} className="hover:bg-gray-50/80">
                                                <td className="px-6 py-4 font-medium text-gray-900">{location.name}</td>
                                                <td className="px-6 py-4">{location.description || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                        {location.items_count} barang
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => openModal(location)}
                                                            className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50 hover:text-amber-700"
                                                            title="Edit lokasi"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(location)}
                                                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                            title="Hapus lokasi"
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
                                    {selectedLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">Atur titik penyimpanan untuk barang gudang.</p>
                            </div>
                            <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">Nama Lokasi</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">Deskripsi</label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm({ ...form, description: event.target.value })}
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
