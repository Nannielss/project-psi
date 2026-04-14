import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowUpRight, Boxes, MapPin, Package, ShoppingCart, Sparkles } from 'lucide-react';

type DashboardStats = {
    total_items: number;
    low_stock_items: number;
    inventory_value: number;
    total_locations: number;
    stock_movements_today: number;
    sales_today: number;
    damaged_items: number;
};

type RecentRestock = {
    id: number;
    item_name: string | null;
    quantity: number;
    unit: string | null;
    time: string | null;
    remarks: string | null;
};

type DashboardProps = {
    stats: DashboardStats;
    recentRestocks: RecentRestock[];
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export default function Dashboard({ stats, recentRestocks }: DashboardProps) {
    const { auth } = usePage().props as { auth: { user: { role?: string } } };
    const canOpenLogistics = auth.user.role === 'admin' || auth.user.role === 'petugas';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Performance Snapshot</p>
                        <h1 className="vk-page-title">Audit Persediaan Gudang</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Pantau nilai stok, aktivitas pergerakan barang, dan restock terbaru dalam satu workspace yang rapi.
                        </p>
                    </div>
                    <div className="vk-card-dark flex items-center gap-4 px-6 py-5 lg:min-w-[18rem] lg:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-white/65">Active Catalog Items</p>
                            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{stats.total_items}</p>
                        </div>
                        <div className="rounded-2xl bg-white/14 p-4">
                            <Boxes className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                    <section className="vk-card px-8 py-8">
                        <p className="vk-chip mb-5">Today&apos;s Revenue</p>
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-[3.2rem] font-semibold tracking-[-0.07em] text-slate-800">
                                    {formatCurrency(stats.sales_today)}
                                </h2>
                                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                                    <ArrowUpRight className="h-4 w-4" />
                                    Stok bergerak hari ini: {stats.stock_movements_today}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 text-sm">
                                <div>
                                    <p className="text-slate-400">Items</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-800">{stats.total_items}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Low Stock</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-rose-500">{stats.low_stock_items}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Lokasi</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-800">{stats.total_locations}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="vk-card-dark p-7">
                        <div className="flex items-center justify-between">
                            <div className="rounded-2xl bg-white/14 p-4">
                                <Package className="h-6 w-6" />
                            </div>
                            <Sparkles className="h-5 w-5 text-white/70" />
                        </div>
                        <div className="mt-14">
                            <p className="text-5xl font-semibold tracking-[-0.06em]">{stats.total_items}</p>
                            <p className="mt-2 text-base text-white/70">Active catalog items</p>
                        </div>
                        <div className="mt-14 h-2 rounded-full bg-white/15">
                            <div className="h-2 w-[72%] rounded-full bg-white/80" />
                        </div>
                    </section>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
                    <section className="space-y-6">
                        <div className="vk-card p-7">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800">Critical Alerts</h3>
                                <AlertTriangle className="h-5 w-5 text-rose-400" />
                            </div>
                            <div className="mt-5 space-y-4">
                                <div className="vk-soft-panel flex items-center gap-4 p-4">
                                    <div className="rounded-2xl bg-rose-100 p-3 text-rose-500">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800">{stats.low_stock_items} Item Low Stock</p>
                                        <p className="text-sm text-slate-500">Perlu restock agar stok aman untuk operasional.</p>
                                    </div>
                                </div>
                                <div className="vk-soft-panel flex items-center gap-4 p-4">
                                    <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                                        <ShoppingCart className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800">{stats.damaged_items} Barang Bermasalah</p>
                                        <p className="text-sm text-slate-500">Cek modul rusak/expired untuk tindak lanjut.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vk-card-dark relative overflow-hidden p-7">
                            <div className="absolute right-[-1.75rem] top-[-1rem] h-32 w-32 rounded-full bg-white/8 blur-2xl" />
                            <p className="text-sm uppercase tracking-[0.22em] text-white/60">Total Inventory Value</p>
                            <p className="mt-3 text-[2.35rem] font-semibold tracking-[-0.06em]">
                                {formatCurrency(stats.inventory_value)}
                            </p>
                            <div className="mt-6 flex items-center gap-3 text-sm text-white/70">
                                <MapPin className="h-4 w-4" />
                                Terdistribusi di {stats.total_locations} lokasi penyimpanan
                            </div>
                        </div>
                    </section>

                    <section className="vk-card p-7">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-[1.75rem] font-semibold tracking-[-0.05em] text-slate-800">Recent Restock</h3>
                                <p className="text-sm text-slate-500">Aliran restock terbaru dari aktivitas gudang.</p>
                            </div>
                            {canOpenLogistics ? (
                                <Link
                                    href={route('stock-transactions.index')}
                                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    View Logistics
                                </Link>
                            ) : (
                                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                                    Warehouse Panel
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-5">
                            {recentRestocks.length === 0 ? (
                                <div className="vk-soft-panel flex min-h-[16rem] flex-col items-center justify-center px-6 text-center">
                                    <Package className="mb-4 h-10 w-10 text-slate-300" />
                                    <p className="text-lg font-semibold text-slate-700">Belum ada restock terbaru</p>
                                    <p className="mt-2 max-w-md text-sm text-slate-500">
                                        Saat transaksi stok masuk dibuat, aktivitasnya akan muncul di panel ini.
                                    </p>
                                </div>
                            ) : (
                                recentRestocks.map((restock) => (
                                    <div key={restock.id} className="flex items-center gap-5 rounded-[24px] border border-slate-100 bg-slate-50/75 px-5 py-4">
                                        <div className="w-16 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            {restock.time || '--:--'}
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-slate-800">{restock.item_name || 'Item tanpa nama'}</p>
                                            <p className="truncate text-sm text-slate-500">{restock.remarks || 'Restock barang gudang'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex flex-col items-end gap-1">
                                                <span className="rounded-xl bg-primary px-2.5 py-1 text-sm font-semibold text-white shadow-sm">
                                                    +{restock.quantity}
                                                </span>
                                                <span className="vk-unit-badge">
                                                    {restock.unit || 'unit'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
