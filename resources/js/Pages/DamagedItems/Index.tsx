import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Edit, Package, Plus, Trash2, Wrench } from 'lucide-react';

type DamagedType = 'rusak' | 'expired' | 'hilang';

type Item = {
    id: number;
    kode_barang: string;
    nama_barang: string;
    stok: number;
    satuan: string;
};

type DamagedEntry = {
    id: number;
    item_id: number;
    quantity: number;
    kondisi: DamagedType;
    catatan_maintenance: string | null;
    date_reported: string;
    item: Item;
};

type DamagedForm = {
    item_id: number | '';
    quantity: number;
    kondisi: DamagedType;
    catatan_maintenance: string;
    date_reported: string;
};

type DamagedItemsPageProps = {
    items: Item[];
    entries: DamagedEntry[];
};

const defaultForm: DamagedForm = {
    item_id: '',
    quantity: 1,
    kondisi: 'rusak',
    catatan_maintenance: '',
    date_reported: new Date().toISOString().slice(0, 10),
};

const parseNumberInput = (event: ChangeEvent<HTMLInputElement>) =>
    Number(event.target.value || 0);

const badgeClass: Record<DamagedType, string> = {
    rusak: 'bg-amber-100 text-amber-700',
    expired: 'bg-rose-100 text-rose-600',
    hilang: 'bg-slate-200 text-slate-700',
};

export default function DamagedItemsIndex({ items, entries }: DamagedItemsPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<DamagedEntry | null>(null);
    const [form, setForm] = useState<DamagedForm>(defaultForm);

    const summary = useMemo(
        () => ({
            expired: entries.filter((entry) => entry.kondisi === 'expired').reduce((sum, entry) => sum + entry.quantity, 0),
            damaged: entries.filter((entry) => entry.kondisi === 'rusak').reduce((sum, entry) => sum + entry.quantity, 0),
            lost: entries.filter((entry) => entry.kondisi === 'hilang').reduce((sum, entry) => sum + entry.quantity, 0),
        }),
        [entries],
    );

    const openModal = (entry: DamagedEntry | null = null) => {
        setSelectedEntry(entry);
        setForm({
            item_id: entry?.item_id ?? '',
            quantity: entry?.quantity ?? 1,
            kondisi: entry?.kondisi ?? 'rusak',
            catatan_maintenance: entry?.catatan_maintenance ?? '',
            date_reported: entry?.date_reported?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedEntry(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedEntry) {
            router.put(route('damaged-items.update', selectedEntry.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('damaged-items.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (entry: DamagedEntry) => {
        if (!confirm(`Hapus laporan ${entry.kondisi} untuk "${entry.item.nama_barang}"?`)) {
            return;
        }

        router.delete(route('damaged-items.destroy', entry.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Inventory Loss Tracking</p>
                        <h1 className="vk-page-title">Barang Rusak / Expired</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Lacak item rusak, expired, atau hilang agar stok fisik dan sistem tetap sinkron.
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="vk-card-dark inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        <Plus className="h-4 w-4" />
                        New Report
                    </button>
                </div>
            }
        >
            <Head title="Barang Rusak / Expired" />

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Expired Goods</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-800">{summary.expired}</p>
                    </div>
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Damaged Items</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-800">{summary.damaged}</p>
                    </div>
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lost Items</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-800">{summary.lost}</p>
                    </div>
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Maintenance Note</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan kolom catatan untuk tindakan perbaikan atau audit.</p>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
                    <div className="vk-card overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <h3 className="text-lg font-semibold text-slate-800">Recent Entries</h3>
                            <p className="mt-1 text-sm text-slate-500">Riwayat laporan barang bermasalah terbaru.</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {entries.length === 0 ? (
                                <div className="px-6 py-16 text-center">
                                    <Package className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                                    <p className="text-lg font-semibold text-slate-700">Belum ada laporan</p>
                                    <p className="mt-2 text-sm text-slate-500">Buat laporan saat ada barang rusak, expired, atau hilang.</p>
                                </div>
                            ) : (
                                entries.map((entry) => (
                                    <div key={entry.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${badgeClass[entry.kondisi]}`}>
                                                    {entry.kondisi}
                                                </span>
                                                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                                    {new Date(entry.date_reported).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <p className="mt-2 font-semibold text-slate-800">{entry.item.nama_barang}</p>
                                            <p className="text-sm text-slate-500">{entry.catatan_maintenance || 'Belum ada catatan maintenance.'}</p>
                                        </div>
                                        <div className="text-left lg:text-right">
                                            <p className="font-semibold text-slate-800">
                                                {entry.quantity} {entry.item.satuan}
                                            </p>
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{entry.item.kode_barang}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openModal(entry)}
                                                className="rounded-full border border-slate-200 bg-white p-2.5 text-amber-500 transition hover:border-amber-200 hover:bg-amber-50"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(entry)}
                                                className="rounded-full border border-slate-200 bg-white p-2.5 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="vk-card p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-indigo-50 p-3 text-primary">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Maintenance Notes</h3>
                                    <p className="text-sm text-slate-500">Catat tindakan lanjutan untuk item bermasalah.</p>
                                </div>
                            </div>
                            <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                {entries.find((entry) => entry.catatan_maintenance)?.catatan_maintenance || 'Belum ada maintenance note aktif.'}
                            </div>
                        </div>

                        <div className="vk-card-dark p-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5" />
                                <h3 className="font-semibold">Loss Analysis</h3>
                            </div>
                            <div className="mt-6 space-y-3 text-sm text-white/75">
                                <div className="flex items-center justify-between">
                                    <span>Expired</span>
                                    <span>{summary.expired}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Damaged</span>
                                    <span>{summary.damaged}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Lost</span>
                                    <span>{summary.lost}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-2xl overflow-hidden">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                                    {selectedEntry ? 'Edit Laporan' : 'Tambah Laporan'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">Jumlah item yang dilaporkan akan mengurangi stok tersedia.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Barang</label>
                                    <select
                                        value={form.item_id}
                                        onChange={(event) => setForm({ ...form, item_id: event.target.value ? Number(event.target.value) : '' })}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                        required
                                    >
                                        <option value="">Pilih barang</option>
                                        {items.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.kode_barang} - {item.nama_barang} (stok {item.stok} {item.satuan})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Kondisi</label>
                                    <select
                                        value={form.kondisi}
                                        onChange={(event) => setForm({ ...form, kondisi: event.target.value as DamagedType })}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="rusak">Rusak</option>
                                        <option value="expired">Expired</option>
                                        <option value="hilang">Hilang</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Jumlah</label>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(event) => setForm({ ...form, quantity: parseNumberInput(event) })}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal Laporan</label>
                                    <input
                                        type="date"
                                        value={form.date_reported}
                                        onChange={(event) => setForm({ ...form, date_reported: event.target.value })}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Catatan Maintenance</label>
                                    <textarea
                                        value={form.catatan_maintenance}
                                        onChange={(event) => setForm({ ...form, catatan_maintenance: event.target.value })}
                                        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600">
                                    Batal
                                </button>
                                <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                    Simpan Laporan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
