import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { ArrowDownUp, Edit, Package, Plus, Trash2 } from 'lucide-react';

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
    in: 'bg-green-100 text-green-800',
    out: 'bg-red-100 text-red-800',
    adjustment: 'bg-amber-100 text-amber-800',
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
                        <Plus className="h-4 w-4" />
                        Perform Restock
                    </button>
                </div>
            }
        >
            <Head title="Manajemen Stok" />

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="vk-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-xl bg-blue-50 p-3">
                                    <ArrowDownUp className="h-6 w-6 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Total Transaksi</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
                    </div>

                    <div className="vk-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-xl bg-amber-50 p-3">
                                    <Package className="h-6 w-6 text-amber-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Stok Menipis</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
                    </div>

                    <div className="vk-card p-6">
                            <p className="text-sm font-medium text-gray-500">Catatan Penyesuaian</p>
                            <p className="mt-2 text-sm leading-6 text-gray-700">
                                Untuk penyesuaian stok, masukkan angka positif untuk menambah dan angka negatif untuk mengurangi stok.
                            </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Riwayat Transaksi Stok</h3>
                                <p className="mt-1 text-sm text-gray-500">Catat stok masuk, keluar, dan penyesuaian barang.</p>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Transaksi
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
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
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <Package className="mb-3 h-10 w-10 text-gray-300" />
                                                    <p>Belum ada transaksi stok.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50/80">
                                                <td className="px-6 py-4 text-gray-700">
                                                    {new Date(transaction.created_at).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{transaction.item.nama_barang}</div>
                                                    <div className="text-xs text-gray-500">{transaction.item.kode_barang}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeStyles[transaction.type]}`}>
                                                        {typeLabels[transaction.type]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-900">
                                                    {formatQuantity(transaction)} {transaction.item.satuan}
                                                </td>
                                                <td className="px-6 py-4">{transaction.user.username}</td>
                                                <td className="px-6 py-4">{transaction.remarks || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => openModal(transaction)}
                                                            className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50 hover:text-amber-700"
                                                            title="Edit transaksi"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(transaction)}
                                                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                            title="Hapus transaksi"
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
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-gray-100 p-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {selectedTransaction ? 'Edit Transaksi Stok' : 'Tambah Transaksi Stok'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">Perubahan stok akan langsung diterapkan ke master barang.</p>
                            </div>
                            <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                                x
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-900">Barang</label>
                                    <select
                                        value={form.item_id}
                                        onChange={(event) => setForm({ ...form, item_id: event.target.value ? Number(event.target.value) : '' })}
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
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
                                    <label className="mb-2 block text-sm font-medium text-gray-900">Tipe Transaksi</label>
                                    <select
                                        value={form.type}
                                        onChange={(event) => setForm({ ...form, type: event.target.value as StockTransactionType })}
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="in">Stok Masuk</option>
                                        <option value="out">Stok Keluar</option>
                                        <option value="adjustment">Penyesuaian</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900">
                                        {form.type === 'adjustment' ? 'Jumlah Penyesuaian' : 'Jumlah'}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(event) => setForm({ ...form, quantity: parseNumberInput(event) })}
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-900">Catatan</label>
                                    <textarea
                                        value={form.remarks}
                                        onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                                        className="block min-h-28 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Contoh: restock supplier, koreksi stok fisik, barang keluar untuk display, dll."
                                    />
                                </div>
                            </div>

                            {selectedItem && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                    Stok saat ini untuk <span className="font-semibold">{selectedItem.nama_barang}</span> adalah{' '}
                                    <span className="font-semibold">
                                        {selectedItem.stok} {selectedItem.satuan}
                                    </span>.
                                </div>
                            )}

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
