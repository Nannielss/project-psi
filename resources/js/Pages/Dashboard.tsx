import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

type DashboardStats = {
    total_items: number;
    low_stock_items: number;
    inventory_value: number;
    total_locations: number;
    stock_movements_today: number;
    sales_today: number;
    damaged_items: number;
};

type DashboardProps = {
    stats: DashboardStats;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export default function Dashboard({ stats }: DashboardProps) {
    const { auth } = usePage().props as { auth: { user: { role?: string } } };
    const canOpenLogistics = auth.user.role === 'admin' || auth.user.role === 'petugas';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="vk-chip mb-4">Performance Snapshot</p>
                    <h1 className="vk-page-title">Audit Persediaan Gudang</h1>
                    <p className="vk-page-copy mt-2 max-w-2xl">
                        Pantau nilai stok, aktivitas pergerakan barang, dan restock terbaru dalam satu workspace yang rapi.
                    </p>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Row 1: Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="vk-card-dark relative overflow-hidden p-6">
                        <div className="absolute right-[-1rem] top-[-0.5rem] h-20 w-20 rounded-full bg-white/8 blur-2xl" />
                        <p className="text-xs uppercase tracking-[0.22em] text-white/60">Total Inventory Value</p>
                        <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.06em]">
                            {formatCurrency(stats.inventory_value)}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
                            {stats.total_locations} lokasi
                        </div>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Penjualan Hari Ini</p>
                        <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">
                            {formatCurrency(stats.sales_today)}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                            {stats.stock_movements_today} pergerakan stok
                        </div>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Barang</p>
                        <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">{stats.total_items}</p>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Katalog aktif di sistem</p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Low Stock</p>
                        <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.05em] text-rose-500 dark:text-rose-400">{stats.low_stock_items}</p>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Perlu restock segera</p>
                    </div>
                </div>

                {/* Row 2: Alerts */}
                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="vk-card p-7">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Critical Alerts</h3>
                        </div>
                        <div className="mt-5 space-y-4">
                            <div className="vk-soft-panel flex items-center gap-4 p-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{stats.low_stock_items} Item Low Stock</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Perlu restock agar stok aman untuk operasional.</p>
                                </div>
                            </div>
                            <div className="vk-soft-panel flex items-center gap-4 p-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{stats.damaged_items} Barang Bermasalah</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Cek modul rusak/expired untuk tindak lanjut.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="vk-card p-7">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Quick Access</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Navigasi cepat ke modul utama.</p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {canOpenLogistics && (
                                <Link
                                    href={route('stock-transactions.index')}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    Manajemen Stok
                                </Link>
                            )}
                            <Link
                                href={route('history.index')}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                Riwayat Transaksi
                            </Link>
                            <Link
                                href={route('items.index')}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                Master Barang
                            </Link>
                            <Link
                                href={route('barcode.index')}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                Cetak Barcode
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
