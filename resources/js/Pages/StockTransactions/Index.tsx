import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

type StockTransactionType = 'in' | 'out' | 'adjustment';

type Item = {
    id: number;
    kode_barang: string;
    nama_barang: string;
    stok: number;
    satuan: string;
};

type TransactionUser = {
    id: number;
    username: string;
};

type TransactionItem = {
    id: number;
    kode_barang: string;
    nama_barang: string;
    satuan: string;
};

type StockTransaction = {
    id: number;
    item_id: number;
    user_id: number;
    type: StockTransactionType;
    quantity: number;
    remarks: string | null;
    created_at: string;
    item: TransactionItem;
    user: TransactionUser;
};

type TransactionForm = {
    item_id: number | '';
    type: StockTransactionType;
    quantity: number;
    remarks: string;
};

type StockTransactionsPageProps = {
    items: Item[];
    transactions: StockTransaction[];
};

const defaultForm: TransactionForm = {
    item_id: '',
    type: 'in',
    quantity: 1,
    remarks: '',
};

const parseNumberInput = (event: ChangeEvent<HTMLInputElement>) =>
    Number(event.target.value || 0);

const typeLabels: Record<StockTransactionType, string> = {
    in: 'Stok Masuk',
    out: 'Stok Keluar',
    adjustment: 'Penyesuaian',
};

const typeStyles: Record<StockTransactionType, string> = {
    in: 'bg-emerald-50 text-emerald-700',
    out: 'bg-rose-50 text-rose-600',
    adjustment: 'bg-amber-50 text-amber-700',
};

function formatQuantity(transaction: StockTransaction) {
    if (transaction.type === 'adjustment') {
        return transaction.quantity > 0 ? `+${transaction.quantity}` : `${transaction.quantity}`;
    }

    return transaction.type === 'in' ? `+${transaction.quantity}` : `-${transaction.quantity}`;
}

export default function StockTransactionsIndex({ items, transactions }: StockTransactionsPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);
    const [form, setForm] = useState<TransactionForm>(defaultForm);

    const selectedItem = useMemo(
        () => items.find((item) => item.id === form.item_id) ?? null,
        [items, form.item_id],
    );

    const lowStockItems = items.filter((item) => item.stok <= 10).length;

    const openModal = (transaction: StockTransaction | null = null) => {
        setSelectedTransaction(transaction);
        setForm({
            item_id: transaction?.item_id ?? '',
            type: transaction?.type ?? 'in',
            quantity: transaction?.quantity ?? 1,
            remarks: transaction?.remarks ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedTransaction(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedTransaction) {
            router.put(route('stock-transactions.update', selectedTransaction.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('stock-transactions.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (transaction: StockTransaction) => {
        if (!confirm(`Hapus transaksi ${typeLabels[transaction.type]} untuk ${transaction.item.nama_barang}?`)) {
            return;
        }

        router.delete(route('stock-transactions.destroy', transaction.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Inventory Workflow</p>
                        <h1 className="vk-page-title">Manajemen Stok</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Catat restock, stok keluar, dan penyesuaian manual dengan jejak aktivitas yang tetap rapi.
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="vk-card-dark inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        Perform Restock
                    </button>
                </div>
            }
        >
            <Head title="Manajemen Stok" />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="vk-card px-6 py-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Transaksi</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">{transactions.length}</p>
                    </div>

                    <div className="vk-card px-6 py-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Stok Menipis</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-rose-500">{lowStockItems}</p>
                    </div>

                    <div className="vk-card px-6 py-5 sm:col-span-2 xl:col-span-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Catatan Penyesuaian</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Masukkan angka positif untuk menambah dan angka negatif untuk mengurangi stok.
                        </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Riwayat Transaksi Stok</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Catat stok masuk, keluar, dan penyesuaian barang.</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                            Tambah Transaksi
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left">
                            <thead className="bg-slate-50/70 dark:bg-slate-800/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                                    <th className="px-6 py-4 font-semibold">Barang</th>
                                    <th className="px-6 py-4 font-semibold">Tipe</th>
                                    <th className="px-6 py-4 font-semibold">Jumlah</th>
                                    <th className="px-6 py-4 font-semibold">Petugas</th>
                                    <th className="px-6 py-4 font-semibold">Catatan</th>
                                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Belum ada transaksi stok</p>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Mulai catat restock atau stok keluar dari tombol di atas.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/65 dark:bg-slate-800/65">
                                            <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(transaction.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{transaction.item.nama_barang}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{transaction.item.kode_barang}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeStyles[transaction.type]}`}>
                                                    {typeLabels[transaction.type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-semibold text-slate-800 dark:text-slate-100">
                                                {formatQuantity(transaction)} {transaction.item.satuan}
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 dark:text-slate-400">{transaction.user.username}</td>
                                            <td className="px-6 py-5 text-slate-500 dark:text-slate-400">{transaction.remarks || '-'}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openModal(transaction)} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50" title="Edit transaksi">Edit</button>
                                                    <button onClick={() => handleDelete(transaction)} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50" title="Hapus transaksi">Hapus</button>
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
                    <div className="vk-card w-full max-w-2xl overflow-hidden">
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800 dark:text-slate-100">
                                    {selectedTransaction ? 'Edit Transaksi Stok' : 'Tambah Transaksi Stok'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Perubahan stok akan langsung diterapkan ke master barang.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-500 transition hover:bg-slate-50">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Barang</label>
                                    <select
                                        value={form.item_id}
                                        onChange={(event) => setForm({ ...form, item_id: event.target.value ? Number(event.target.value) : '' })}
                                        className="vk-select"
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
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Tipe Transaksi</label>
                                    <select
                                        value={form.type}
                                        onChange={(event) => setForm({ ...form, type: event.target.value as StockTransactionType })}
                                        className="vk-select"
                                    >
                                        <option value="in">Stok Masuk</option>
                                        <option value="out">Stok Keluar</option>
                                        <option value="adjustment">Penyesuaian</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {form.type === 'adjustment' ? 'Jumlah Penyesuaian' : 'Jumlah'}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(event) => setForm({ ...form, quantity: parseNumberInput(event) })}
                                        className="vk-field"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Catatan</label>
                                    <textarea
                                        value={form.remarks}
                                        onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                                        className="vk-textarea"
                                        placeholder="Contoh: restock supplier, koreksi stok fisik, barang keluar untuk display, dll."
                                    />
                                </div>
                            </div>

                            {selectedItem && (
                                <div className="rounded-[20px] border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-800">
                                    Stok saat ini untuk <span className="font-semibold">{selectedItem.nama_barang}</span> adalah{' '}
                                    <span className="font-semibold">{selectedItem.stok} {selectedItem.satuan}</span>.
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                                    Batal
                                </button>
                                <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                    Simpan Transaksi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
