import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

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

type SaleItem = {
    id: number;
    quantity: number;
    subtotal: number | string;
    item: Item | null;
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
    subtotal_amount: number | string;
    discount_amount: number | string;
    discount_type: 'nominal' | 'percent';
    discount_value: number | string;
    payment_method: string;
    cash_received: number | string | null;
    change_amount: number | string | null;
    customer_mode: 'member' | 'non_member';
    notes: string | null;
    created_at: string;
    customer: {
        id: number;
        shop_name: string;
        tier: string;
    } | null;
    user: User | null;
    items: SaleItem[];
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
    const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedSaleId((prev) => (prev === id ? null : id));
    };

    const restockRows = useMemo(() =>
        restocks.map((entry) => ({
            id: `TRX-${entry.id}`,
            rawId: entry.id,
            datetime: entry.created_at,
            title: entry.item?.nama_barang || 'Barang',
            kode: entry.item?.kode_barang || '-',
            subtitle: entry.user?.username || '-',
            amount: `${entry.quantity} ${entry.item?.satuan || ''}`.trim(),
            remarks: entry.remarks || '-',
            status: 'restock',
        })),
    [restocks]);

    const adjustmentRows = useMemo(() =>
        adjustments.map((entry) => ({
            id: `TRX-${entry.id}`,
            rawId: entry.id,
            datetime: entry.created_at,
            title: entry.item?.nama_barang || 'Barang',
            kode: entry.item?.kode_barang || '-',
            subtitle: entry.user?.username || '-',
            amount: `${entry.quantity} ${entry.item?.satuan || ''}`.trim(),
            remarks: entry.remarks || '-',
            status: 'adjustment',
        })),
    [adjustments]);

    const tabClass = (tab: TabKey) =>
        [
            'vk-tab-pill min-w-[150px] justify-center px-6 py-3 text-center',
            activeTab === tab ? 'vk-tab-pill-active' : 'vk-tab-pill-idle',
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
                            className="vk-soft-panel px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-white"
                        >
                            Export PDF
                        </button>
                        <a href={route('stock-transactions.index')} className="vk-card-dark flex items-center gap-3 px-5 py-3 text-sm font-semibold">
                            New Transaction
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Riwayat" />

            <div className="space-y-6">
                <div className="flex w-full flex-col gap-2 rounded-[28px] bg-slate-100/95 p-1.5 shadow-inner dark:bg-slate-800/80 sm:w-fit sm:flex-row sm:items-center">
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
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Date Range</p>
                        <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">30 Hari Terakhir</p>
                    </div>
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Store Scope</p>
                        <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">Main Warehouse</p>
                    </div>
                    <div className="vk-card p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Volume (30D)</p>
                        <p className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">
                            {formatCurrency(summary.volume_30_days)}
                        </p>
                    </div>
                </div>

                <div className="vk-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Audit Trace & Logs</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tampilan riwayat transaksi berdasarkan kategori aktivitas.</p>
                        </div>
                    </div>

                    {/* Sales History Tab */}
                    {activeTab === 'sales' && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">ID</th>
                                        <th className="px-6 py-4 font-semibold">Tanggal & Waktu</th>
                                        <th className="px-6 py-4 font-semibold">Pembeli</th>
                                        <th className="px-6 py-4 font-semibold">Kasir</th>
                                        <th className="px-6 py-4 font-semibold">Pembayaran</th>
                                        <th className="px-6 py-4 font-semibold">Total</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center">
                                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum ada data penjualan</p>
                                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Transaksi kasir akan muncul di sini secara otomatis.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sales.map((sale) => (
                                            <>
                                                <tr
                                                    key={sale.id}
                                                    className="cursor-pointer hover:bg-slate-50/65 dark:hover:bg-slate-800/50"
                                                    onClick={() => toggleExpand(sale.id)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold tracking-[0.14em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            SAL-{sale.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {new Date(sale.created_at).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                            {sale.customer?.shop_name || 'Walk-in Customer'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {sale.customer_mode === 'member'
                                                                ? `Member · ${sale.customer?.tier || ''}`
                                                                : 'Non-member'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {sale.user?.username || '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                            {sale.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                                                        {formatCurrency(sale.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            Selesai
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500">
                                                        <span className="text-lg">{expandedSaleId === sale.id ? '▲' : '▼'}</span>
                                                    </td>
                                                </tr>

                                                {/* Expanded Detail Row */}
                                                {expandedSaleId === sale.id && (
                                                    <tr key={`detail-${sale.id}`} className="bg-slate-50/80 dark:bg-slate-800/40">
                                                        <td colSpan={8} className="px-6 py-5">
                                                            <div className="grid gap-6 md:grid-cols-2">
                                                                {/* Detail Barang */}
                                                                <div>
                                                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                                                        Detail Barang
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {sale.items.length === 0 ? (
                                                                            <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada data barang.</p>
                                                                        ) : (
                                                                            sale.items.map((line) => (
                                                                                <div key={line.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5">
                                                                                    <div>
                                                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                                                            {line.item?.nama_barang || 'Item'}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                                            {line.item?.kode_barang} · {line.quantity} {line.item?.satuan}
                                                                                        </p>
                                                                                    </div>
                                                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                                                        {formatCurrency(line.subtotal)}
                                                                                    </p>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Ringkasan Pembayaran */}
                                                                <div>
                                                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                                                        Ringkasan Pembayaran
                                                                    </p>
                                                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 space-y-2.5">
                                                                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                                            <span>Subtotal</span>
                                                                            <span>{formatCurrency(sale.subtotal_amount)}</span>
                                                                        </div>
                                                                        {Number(sale.discount_amount) > 0 && (
                                                                            <div className="flex justify-between text-sm text-emerald-600">
                                                                                <span>
                                                                                    Diskon {sale.discount_type === 'percent'
                                                                                        ? `(${Number(sale.discount_value)}%)`
                                                                                        : '(nominal)'}
                                                                                </span>
                                                                                <span>- {formatCurrency(sale.discount_amount)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2.5 font-semibold text-slate-800 dark:text-slate-100">
                                                                            <span>Total</span>
                                                                            <span>{formatCurrency(sale.total_amount)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                                            <span>Metode Bayar</span>
                                                                            <span className="font-medium uppercase">{sale.payment_method}</span>
                                                                        </div>
                                                                        {sale.payment_method === 'cash' && sale.cash_received !== null && (
                                                                            <>
                                                                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                                                    <span>Uang Diterima</span>
                                                                                    <span>{formatCurrency(sale.cash_received!)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                                                    <span>Kembalian</span>
                                                                                    <span>{formatCurrency(sale.change_amount || 0)}</span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {sale.notes && (
                                                                            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                                                                <span>Catatan</span>
                                                                                <span className="text-right max-w-[60%]">{sale.notes}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Restock & Adjustment Tab */}
                    {(activeTab === 'restock' || activeTab === 'adjustment') && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-left">
                                <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Transaction ID</th>
                                        <th className="px-6 py-4 font-semibold">Date & Time</th>
                                        <th className="px-6 py-4 font-semibold">Barang</th>
                                        <th className="px-6 py-4 font-semibold">Kode</th>
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Qty</th>
                                        <th className="px-6 py-4 font-semibold">Keterangan</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(activeTab === 'restock' ? restockRows : adjustmentRows).length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center">
                                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum ada data riwayat</p>
                                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aktivitas transaksi akan muncul di tabel ini secara otomatis.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        (activeTab === 'restock' ? restockRows : adjustmentRows).map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/65 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-5">
                                                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold tracking-[0.14em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {row.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                                                    {new Date(row.datetime).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{row.title}</p>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{row.kode}</td>
                                                <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{row.subtitle}</td>
                                                <td className="px-6 py-5 font-semibold text-slate-800 dark:text-slate-100">{row.amount}</td>
                                                <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{row.remarks}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        row.status === 'restock'
                                                            ? 'vk-status-success'
                                                            : 'vk-status-warning'
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
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
