import { useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import Barcode from 'react-barcode';
import { Package, Printer, Search, Tag } from 'lucide-react';

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
    harga_jual: number | string;
    location_id: number | null;
};

type BarcodePageProps = {
    items: Item[];
    locations: Location[];
};

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function BarcodeIndex({ items, locations }: BarcodePageProps) {
    const page = usePage();
    const params = new URLSearchParams(page.url.split('?')[1] || '');
    const [search, setSearch] = useState(params.get('search') || '');
    const [locationFilter, setLocationFilter] = useState<string>(params.get('location') || 'all');
    const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
                item.kode_barang.toLowerCase().includes(search.toLowerCase());

            const matchesLocation =
                locationFilter === 'all' || String(item.location_id ?? '') === locationFilter;

            return matchesSearch && matchesLocation;
        });
    }, [items, locationFilter, search]);

    const openPrintWindow = (printItems: Item[]) => {
        const printableCards = printItems
            .map((item) => cardRefs.current[item.id]?.outerHTML)
            .filter(Boolean)
            .join('');

        if (!printableCards) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=1080,height=760');
        if (!printWindow) {
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Barcode Inventory</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 24px; color: #1e293b; }
                        .sheet { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
                        .barcode-card { border: 1px solid #d8e1ef; border-radius: 18px; padding: 18px; background: #fff; page-break-inside: avoid; }
                        .eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: .18em; color: #64748b; margin-bottom: 8px; }
                        .title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
                        .meta { font-size: 12px; color: #64748b; margin-bottom: 12px; }
                        .barcode-wrap { display: flex; justify-content: center; padding: 10px 0 6px; }
                        @media print { body { margin: 12px; } }
                    </style>
                </head>
                <body>
                    <div class="sheet">${printableCards}</div>
                    <script>window.onload = function(){ window.print(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Label Inventory</p>
                        <h1 className="vk-page-title">Barcode</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Cetak barcode barang untuk rak gudang, label produk, atau kebutuhan transaksi kasir.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openPrintWindow(filteredItems)}
                        className="vk-card-dark flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        <Printer className="h-4 w-4" />
                        Cetak Semua Hasil
                    </button>
                </div>
            }
        >
            <Head title="Barcode" />

            <div className="space-y-6">
                <div className="grid gap-5 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
                    <div className="vk-card flex items-center gap-4 px-6 py-5">
                        <div className="rounded-2xl bg-indigo-50 p-4 text-primary">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Label</p>
                            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-slate-800">{filteredItems.length}</p>
                        </div>
                    </div>

                    <div className="vk-card flex items-center gap-4 px-6 py-5">
                        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total SKU</p>
                            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-slate-800">{items.length}</p>
                        </div>
                    </div>

                    <div className="vk-card p-5">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari nama barang atau kode..."
                                    className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                />
                            </div>
                            <select
                                value={locationFilter}
                                onChange={(event) => setLocationFilter(event.target.value)}
                                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                            >
                                <option value="all">Semua Lokasi</option>
                                {locations.map((location) => (
                                    <option key={location.id} value={String(location.id)}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredItems.length === 0 ? (
                        <div className="vk-card col-span-full px-6 py-16 text-center">
                            <Package className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                            <p className="text-lg font-semibold text-slate-700">Tidak ada barcode yang cocok</p>
                            <p className="mt-2 text-sm text-slate-500">Ubah kata kunci pencarian atau filter lokasi.</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const location = locations.find((entry) => entry.id === item.location_id);

                            return (
                                <div key={item.id} className="vk-card overflow-hidden p-5">
                                    <div
                                        ref={(node) => {
                                            cardRefs.current[item.id] = node;
                                        }}
                                        className="barcode-card rounded-[20px] border border-slate-200 bg-white px-5 py-5"
                                    >
                                        <p className="eyebrow text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Inventory Barcode</p>
                                        <h3 className="title mt-2 text-lg font-semibold text-slate-800">{item.nama_barang}</h3>
                                        <p className="meta mt-1 text-sm text-slate-500">
                                            {item.kode_barang} | {location?.name || 'Tanpa lokasi'}
                                        </p>
                                        <div className="barcode-wrap mt-5 flex justify-center rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-4">
                                            <Barcode value={item.kode_barang} displayValue fontSize={16} height={54} width={1.5} />
                                        </div>
                                        <p className="meta mt-4 text-sm text-slate-500">
                                            Stok: {item.stok} {item.satuan} | Harga: {formatCurrency(item.harga_jual)}
                                        </p>
                                    </div>

                                    <div className="mt-5 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => openPrintWindow([item])}
                                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-primary"
                                        >
                                            Cetak Label
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
