import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CalendarDays, Package, Plus, Receipt, SlidersHorizontal, Store } from 'lucide-react';

type User = {
    id: number;
    username: string;
};

type Item = {
    id: number;
    kode_barang: string;
    nama_barang: string;
    satuan: string;
};

type RestockEntry = {
    id: number;
    type: 'in' | 'adjustment';
    quantity: number;
    remarks: string | null;
    created_at: string;
    item: Item | null;
    user: User | null;
};

type SaleEntry = {
    id: number;
    total_amount: number | string;
    created_at: string;
    customer: {
        id: number;
        shop_name: string;
    } | null;
    user: User | null;
};

type HistoryProps = {
    summary: {
        restock_count: number;
        adjustment_count: number;
        sales_count: number;
        volume_30_days: number;
    };
    restocks: RestockEntry[];
    adjustments: RestockEntry[];
    sales: SaleEntry[];
    today: string;
};

type TabKey = 'sales' | 'restock' | 'adjustment';

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function HistoryIndex({ summary, restocks, adjustments, sales }: HistoryProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('sales');

    const currentRows = useMemo(() => {
        if (activeTab === 'sales') {
            return sales.map((entry) => ({
                id: `SAL-${entry.id}`,
                datetime: entry.created_at,
                title: entry.customer?.shop_name || 'Walk-in Customer',
                subtitle: entry.user?.username || '-',
                amount: formatCurrency(entry.total_amount),
                status: 'completed',
            }));
        }

        const source = activeTab === 'restock' ? restocks : adjustments;

        return source.map((entry) => ({
            id: `TRX-${entry.id}`,
            datetime: entry.created_at,
            title: entry.item?.nama_barang || 'Barang',
            subtitle: entry.user?.username || '-',
            amount: `${entry.quantity} ${entry.item?.satuan || ''}`.trim(),
            status: activeTab === 'restock' ? 'restock' : 'adjustment',
        }));
    }, [activeTab, adjustments, restocks, sales]);

    const tabClass = (tab: TabKey) =>
        [
            'rounded-full px-7 py-3 text-sm font-semibold transition',
            activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800',
        ].join(' ');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Audit Trail</p>
                        <h1 className="vk-page-title">Riwayat (History)</h1>
                        <p className="vk-page-copy mt-2 max-w-3xl">
                            Lacak transaksi penjualan, restock, dan penyesuaian stok dari satu tempat untuk kebutuhan audit persediaan.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => window.open(route('history.export-pdf'), '_blank', 'noopener,noreferrer')}
                            className="vk-soft-panel px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                        >
                            Export PDF
                        </button>
                        <a href={route('stock-transactions.index')} className="vk-card-dark flex items-center gap-3 px-5 py-3 text-sm font-semibold">
                            <Plus className="h-4 w-4" />
                            New Transaction
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Riwayat" />

            <div className="space-y-6">
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-slate-100/90 p-1.5">
                    <button type="button" onClick={() => setActiveTab('sales')} className={tabClass('sales')}>
                        Sales History
                    </button>
                    <button type="button" onClick={() => setActiveTab('restock')} className={tabClass('restock')}>
                        Restock History
                    </button>
                    <button type="button" onClick={() => setActiveTab('adjustment')} className={tabClass('adjustment')}>
                        Stock Adjustments
                    </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.6fr]">
                    <div className="vk-card flex items-center gap-4 p-5">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Date Range</p>
                            <p className="mt-2 font-semibold text-slate-800">30 Hari Terakhir</p>
                        </div>
                    </div>
                    <div className="vk-card flex items-center gap-4 p-5">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                            <Store className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Store Scope</p>
                            <p className="mt-2 font-semibold text-slate-800">Main Warehouse</p>
                        </div>
                    </div>
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Volume (30D)</p>
                        <p className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-primary">
                            {formatCurrency(summary.volume_30_days)}
                        </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Audit Trace & Logs</h3>
                            <p className="mt-1 text-sm text-slate-500">Tampilan riwayat transaksi berdasarkan kategori aktivitas.</p>
                        </div>
                        <button type="button" className="rounded-full border border-slate-200 bg-white p-3 text-slate-500">
                            <SlidersHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left">
                            <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold">Items / Source</th>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Amount / Qty</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <Receipt className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                                            <p className="text-lg font-semibold text-slate-700">Belum ada data riwayat</p>
                                            <p className="mt-2 text-sm text-slate-500">Aktivitas transaksi akan muncul di tabel ini secara otomatis.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/65">
                                            <td className="px-6 py-5 font-semibold text-primary">{row.id}</td>
                                            <td className="px-6 py-5 text-slate-600">{new Date(row.datetime).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-5">
                                                <p className="font-semibold text-slate-800">{row.title}</p>
                                            </td>
                                            <td className="px-6 py-5 text-slate-600">{row.subtitle}</td>
                                            <td className="px-6 py-5 font-semibold text-slate-800">{row.amount}</td>
                                            <td className="px-6 py-5">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    row.status === 'completed'
                                                        ? 'bg-slate-100 text-slate-700'
                                                        : row.status === 'restock'
                                                          ? 'bg-emerald-100 text-emerald-700'
                                                          : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                    <div className="vk-card p-6">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-slate-800">Audit Performance Note</h3>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            Rekonsiliasi transaksi bulan ini akan makin akurat ketika modul penjualan dan barcode sudah sepenuhnya aktif. Saat ini riwayat restock dan penyesuaian stok sudah tercatat dengan baik dari transaksi gudang.
                        </p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Security Status</p>
                        <p className="mt-4 font-semibold text-slate-800">Real-time logging active</p>
                        <p className="mt-2 text-sm text-slate-500">Semua perubahan stok melalui modul gudang akan masuk ke halaman audit ini.</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
