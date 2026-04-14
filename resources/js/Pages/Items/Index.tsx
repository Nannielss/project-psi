import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit, Package, Plus, Printer, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import Barcode from 'react-barcode';

type Location = {
    id: number;
    name: string;
};

type Item = {
    id: number;
    kode_barang: string;
    nama_barang: string;
    satuan: string;
    stok: number;
    harga_grosir: number | string;
    harga_jual: number | string;
    location_id: number | null;
};

type ItemForm = {
    nama_barang: string;
    satuan: string;
    stok: number;
    harga_grosir: number;
    harga_jual: number;
    location_id: number | '';
};

type ItemsIndexProps = {
    items: Item[];
    locations: Location[];
};

type ItemTab = 'all' | 'available' | 'low';

const defaultForm: ItemForm = {
    nama_barang: '',
    satuan: 'pcs',
    stok: 0,
    harga_grosir: 0,
    harga_jual: 0,
    location_id: '',
};

const parseNumberInput = (event: ChangeEvent<HTMLInputElement>) =>
    Number(event.target.value || 0);

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function ItemsIndex({ items, locations }: ItemsIndexProps) {
    const page = usePage();
    const params = new URLSearchParams(page.url.split('?')[1] || '');
    const [showModal, setShowModal] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [activeTab, setActiveTab] = useState<ItemTab>('all');
    const [search, setSearch] = useState(params.get('search') || '');
    const [locationFilter, setLocationFilter] = useState(params.get('location') || 'all');
    const [unitFilter, setUnitFilter] = useState(params.get('unit') || 'all');
    const [form, setForm] = useState<ItemForm>(defaultForm);

    const unitOptions = useMemo(
        () => Array.from(new Set(items.map((item) => item.satuan.toUpperCase()))).sort(),
        [items],
    );

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
                item.kode_barang.toLowerCase().includes(search.toLowerCase());
            const matchesLocation =
                locationFilter === 'all' || String(item.location_id ?? '') === locationFilter;
            const matchesUnit =
                unitFilter === 'all' || item.satuan.toUpperCase() === unitFilter;

            const matchesTab =
                activeTab === 'all' ||
                (activeTab === 'available' && item.stok > 10) ||
                (activeTab === 'low' && item.stok <= 10);

            return matchesSearch && matchesLocation && matchesUnit && matchesTab;
        });
    }, [activeTab, items, locationFilter, search, unitFilter]);

    const totalInventoryValue = useMemo(
        () => items.reduce((sum, item) => sum + item.stok * Number(item.harga_jual), 0),
        [items],
    );

    const lowStockCount = items.filter((item) => item.stok <= 10).length;

    const openModal = (item: Item | null = null) => {
        if (item) {
            setSelectedItem(item);
            setForm({
                nama_barang: item.nama_barang,
                satuan: item.satuan,
                stok: Number(item.stok),
                harga_grosir: Number(item.harga_grosir),
                harga_jual: Number(item.harga_jual),
                location_id: item.location_id ?? '',
            });
        } else {
            setSelectedItem(null);
            setForm(defaultForm);
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedItem) {
            router.put(route('items.update', selectedItem.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('items.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (item: Item) => {
        if (!confirm(`Yakin ingin menghapus barang "${item.nama_barang}"?`)) {
            return;
        }

        router.delete(route('items.destroy', item.id));
    };

    const handlePrintBarcode = (item: Item) => {
        setSelectedItem(item);
        setShowBarcodeModal(true);
    };

    const activeFilterCount = [locationFilter !== 'all', unitFilter !== 'all'].filter(Boolean).length;

    const clearFilters = () => {
        setLocationFilter('all');
        setUnitFilter('all');
        setShowFilters(false);
    };

    const tabClass = (tab: ItemTab) =>
        [
            'vk-tab-pill',
            activeTab === tab ? 'vk-tab-pill-active' : 'vk-tab-pill-idle',
        ].join(' ');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Katalog Persediaan</p>
                        <h1 className="vk-page-title">Master Barang</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Pusat data SKU, stok tersedia, dan harga jual untuk seluruh inventaris yang dikelola.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setShowFilters((current) => !current)}
                            className="vk-soft-panel px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                        >
                            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                        </button>
                        <button
                            type="button"
                            onClick={() => openModal()}
                            className="vk-card-dark flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Barang
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Master Barang" />

            <div className="space-y-6">
                <div className="grid gap-5 xl:grid-cols-[0.8fr_0.8fr_1.4fr]">
                    <div className="vk-card flex items-center gap-4 px-6 py-5">
                        <div className="rounded-2xl bg-indigo-50 p-4 text-primary">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total SKU</p>
                            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-slate-800">{items.length}</p>
                        </div>
                    </div>

                    <div className="vk-card flex items-center gap-4 px-6 py-5">
                        <div className="rounded-2xl bg-rose-50 p-4 text-rose-500">
                            <TriangleAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Low Stock</p>
                            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-rose-500">{lowStockCount}</p>
                        </div>
                    </div>

                    <div className="vk-card px-6 py-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Inventory Value</p>
                        <p className="mt-2 text-[2.35rem] font-semibold tracking-[-0.06em] text-slate-800">
                            {formatCurrency(totalInventoryValue)}
                        </p>
                    </div>
                </div>

                <section className="vk-card overflow-hidden">
                    <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100/90 p-1.5">
                            <button type="button" onClick={() => setActiveTab('all')} className={tabClass('all')}>
                                Semua Barang
                            </button>
                            <button type="button" onClick={() => setActiveTab('available')} className={tabClass('available')}>
                                Tersedia
                            </button>
                            <button type="button" onClick={() => setActiveTab('low')} className={tabClass('low')}>
                                Stok Tipis
                            </button>
                        </div>

                        <div className="relative w-full max-w-md">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari item atau kode barang..."
                                className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {showFilters && (
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                            <div className="grid gap-4 lg:grid-cols-[220px_220px_auto]">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Lokasi</label>
                                    <select
                                        value={locationFilter}
                                        onChange={(event) => setLocationFilter(event.target.value)}
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="all">Semua Lokasi</option>
                                        {locations.map((location) => (
                                            <option key={location.id} value={String(location.id)}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Unit</label>
                                    <select
                                        value={unitFilter}
                                        onChange={(event) => setUnitFilter(event.target.value)}
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="all">Semua Unit</option>
                                        {unitOptions.map((unit) => (
                                            <option key={unit} value={unit}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end justify-start gap-3">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <X className="h-4 w-4" />
                                        Reset Filter
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left">
                            <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Kode / Nama Item</th>
                                    <th className="px-6 py-4 font-semibold">Lokasi</th>
                                    <th className="px-6 py-4 font-semibold">Unit</th>
                                    <th className="px-6 py-4 font-semibold">Stok</th>
                                    <th className="px-6 py-4 font-semibold">Harga Grosir</th>
                                    <th className="px-6 py-4 font-semibold">Harga Jual</th>
                                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <Package className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                                            <p className="text-lg font-semibold text-slate-700">Tidak ada barang yang cocok</p>
                                            <p className="mt-2 text-sm text-slate-500">Coba ubah kata kunci pencarian atau filter tab.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => {
                                        const location = locations.find((entry) => entry.id === item.location_id);
                                        const stockPercent = Math.min(100, Math.max(8, (item.stok / 100) * 100));
                                        const stockTone =
                                            item.stok <= 10
                                                ? 'bg-rose-400'
                                                : item.stok <= 25
                                                    ? 'bg-amber-400'
                                                    : 'bg-emerald-500';
                                        const stockLabelTone =
                                            item.stok <= 10
                                                ? 'text-rose-500'
                                                : item.stok <= 25
                                                    ? 'text-amber-600'
                                                    : 'text-emerald-600';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/65">
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{item.kode_barang}</p>
                                                    <p className="mt-2 font-semibold text-slate-800">{item.nama_barang}</p>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500">{location?.name || '-'}</td>
                                                <td className="px-6 py-5">
                                                    <span className="vk-unit-badge">
                                                        {item.satuan}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="min-w-[8rem]">
                                                        <p className={`font-semibold ${stockLabelTone}`}>{item.stok}</p>
                                                        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                                            <div
                                                                className={`h-1.5 rounded-full ${stockTone}`}
                                                                style={{ width: `${stockPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-slate-500">{formatCurrency(item.harga_grosir)}</td>
                                                <td className="px-6 py-5 font-semibold text-slate-800">{formatCurrency(item.harga_jual)}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            title="Print barcode"
                                                            onClick={() => handlePrintBarcode(item)}
                                                            className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-slate-300 hover:text-primary"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Edit barang"
                                                            onClick={() => openModal(item)}
                                                            className="rounded-full border border-slate-200 bg-white p-2.5 text-amber-500 transition hover:border-amber-200 hover:bg-amber-50"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Hapus barang"
                                                            onClick={() => handleDelete(item)}
                                                            className="rounded-full border border-slate-200 bg-white p-2.5 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-2xl overflow-hidden">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                                    {selectedItem ? 'Edit Barang' : 'Tambah Barang Baru'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">Simpan informasi SKU, harga, stok, dan lokasi penyimpanan.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                            >
                                x
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Nama Barang</label>
                                        <input
                                            type="text"
                                            value={form.nama_barang}
                                            onChange={(event) => setForm({ ...form, nama_barang: event.target.value })}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Satuan</label>
                                        <select
                                            value={form.satuan}
                                            onChange={(event) => setForm({ ...form, satuan: event.target.value })}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                        >
                                            <option value="pcs">PCS</option>
                                            <option value="kg">KG</option>
                                            <option value="karung">Karung</option>
                                            <option value="dus">Dus</option>
                                            <option value="meter">Meter</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Stok Awal</label>
                                        <input
                                            type="number"
                                            value={form.stok}
                                            onChange={(event) => setForm({ ...form, stok: parseNumberInput(event) })}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Harga Grosir</label>
                                        <input
                                            type="number"
                                            value={form.harga_grosir}
                                            onChange={(event) => setForm({ ...form, harga_grosir: parseNumberInput(event) })}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Harga Jual</label>
                                        <input
                                            type="number"
                                            value={form.harga_jual}
                                            onChange={(event) => setForm({ ...form, harga_jual: parseNumberInput(event) })}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Lokasi Penyimpanan</label>
                                        <select
                                            value={form.location_id}
                                            onChange={(event) => setForm({ ...form, location_id: event.target.value ? Number(event.target.value) : '' })}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                        >
                                            <option value="">Pilih lokasi</option>
                                            {locations.map((location) => (
                                                <option key={location.id} value={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Batal
                                    </button>
                                    <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                        Simpan Barang
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showBarcodeModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-md px-8 py-8 text-center">
                        <p className="vk-chip mb-5">Barcode Preview</p>
                        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800">{selectedItem.nama_barang}</h3>
                        <p className="mt-2 text-sm text-slate-500">{selectedItem.kode_barang}</p>
                        <div className="mt-8 flex justify-center rounded-[24px] border border-slate-100 bg-white p-5">
                            <Barcode value={selectedItem.kode_barang} displayValue />
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <button type="button" onClick={() => window.print()} className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                Cetak Barcode
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBarcodeModal(false)}
                                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
