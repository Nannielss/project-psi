import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    CircleAlert,
    Eraser,
    Minus,
    Plus,
    Printer,
    Receipt,
    Search,
    ShoppingCart,
    Store,
    Trash2,
} from 'lucide-react';

type Customer = {
    id: number;
    shop_name: string;
    phone: string | null;
    address: string | null;
    tier: 'retail' | 'wholesale' | 'member';
    category: string | null;
};

type SaleItemOption = {
    id: number;
    kode_barang: string;
    nama_barang: string;
    satuan: string;
    stok: number;
    harga_jual: number | string;
    location_id: number | null;
};

type RecentSale = {
    id: number;
    customer_mode: 'member' | 'non_member';
    subtotal_amount: number | string;
    discount_amount: number | string;
    discount_type: 'nominal' | 'percent';
    discount_value: number | string;
    total_amount: number | string;
    payment_method: string;
    cash_received: number | string | null;
    change_amount: number | string | null;
    created_at: string;
    customer: Customer | null;
    user: {
        id: number;
        username: string;
    } | null;
    items: Array<{
        id: number;
        quantity: number;
        subtotal: number | string;
        item: {
            id: number;
            kode_barang: string;
            nama_barang: string;
            satuan: string;
        } | null;
    }>;
};

type SalesPageProps = {
    customers: Customer[];
    items: SaleItemOption[];
    recentSales: RecentSale[];
    summary: {
        sales_today: number;
        transactions_today: number;
        items_available: number;
    };
};

type CartLine = {
    item_id: number;
    quantity: number;
};

type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'debit';
type CustomerMode = 'member' | 'non_member';
type DiscountType = 'nominal' | 'percent';

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function SalesIndex({ customers, items, recentSales, summary }: SalesPageProps) {
    const page = usePage();
    const params = new URLSearchParams(page.url.split('?')[1] || '');
    const receiptUrl = typeof page.props.flash?.receipt_url === 'string' ? page.props.flash.receipt_url : null;
    const canClearRecent = page.props.auth?.user?.role === 'admin';
    const lastOpenedReceipt = useRef<string | null>(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [customerMode, setCustomerMode] = useState<CustomerMode>('non_member');
    const [customerId, setCustomerId] = useState<string>('');
    const [discountType, setDiscountType] = useState<DiscountType>('nominal');
    const [discountValueInput, setDiscountValueInput] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashReceived, setCashReceived] = useState('');
    const [notes, setNotes] = useState('');
    const [cart, setCart] = useState<CartLine[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
            item.kode_barang.toLowerCase().includes(search.toLowerCase()),
        );
    }, [items, search]);

    const cartDetails = useMemo(() => {
        return cart
            .map((line) => {
                const item = items.find((entry) => entry.id === line.item_id);
                if (!item) return null;

                const price = Number(item.harga_jual);

                return {
                    ...line,
                    item,
                    price,
                    subtotal: price * line.quantity,
                };
            })
            .filter(Boolean) as Array<CartLine & { item: SaleItemOption; price: number; subtotal: number }>;
    }, [cart, items]);

    const subtotal = useMemo(() => cartDetails.reduce((sum, line) => sum + line.subtotal, 0), [cartDetails]);
    const discountInputValue = useMemo(() => Math.max(Number(discountValueInput || 0), 0), [discountValueInput]);
    const discountValue = useMemo(() => {
        if (discountType === 'percent') {
            return Math.min(Math.max(discountInputValue, 0), 100);
        }

        return Math.min(discountInputValue, subtotal);
    }, [discountInputValue, discountType, subtotal]);
    const discountAmount = useMemo(() => {
        return discountType === 'percent'
            ? (subtotal * discountValue) / 100
            : discountValue;
    }, [discountType, discountValue, subtotal]);
    const total = useMemo(() => Math.max(subtotal - discountAmount, 0), [discountAmount, subtotal]);
    const cashReceivedValue = useMemo(() => Number(cashReceived || 0), [cashReceived]);
    const changeAmount = useMemo(
        () => (paymentMethod === 'cash' ? Math.max(cashReceivedValue - total, 0) : 0),
        [cashReceivedValue, paymentMethod, total],
    );
    const cashShortage = useMemo(
        () => (paymentMethod === 'cash' ? Math.max(total - cashReceivedValue, 0) : 0),
        [cashReceivedValue, paymentMethod, total],
    );
    const canSubmit = cartDetails.length > 0 && !isSubmitting && (paymentMethod !== 'cash' || cashShortage === 0);

    useEffect(() => {
        if (!receiptUrl || lastOpenedReceipt.current === receiptUrl || typeof window === 'undefined') {
            return;
        }

        lastOpenedReceipt.current = receiptUrl;
        window.open(receiptUrl, '_blank', 'noopener,noreferrer');
    }, [receiptUrl]);

    const addToCart = (itemId: number) => {
        const item = items.find((entry) => entry.id === itemId);
        if (!item || item.stok <= 0) return;

        setCart((current) => {
            const existing = current.find((line) => line.item_id === itemId);
            if (existing) {
                return current.map((line) =>
                    line.item_id === itemId
                        ? { ...line, quantity: Math.min(line.quantity + 1, item.stok) }
                        : line,
                );
            }

            return [...current, { item_id: itemId, quantity: 1 }];
        });
    };

    const updateQty = (itemId: number, nextQty: number) => {
        const item = items.find((entry) => entry.id === itemId);
        if (!item) return;

        if (nextQty <= 0) {
            setCart((current) => current.filter((line) => line.item_id !== itemId));
            return;
        }

        setCart((current) =>
            current.map((line) =>
                line.item_id === itemId
                    ? { ...line, quantity: Math.min(nextQty, item.stok) }
                    : line,
            ),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (cart.length === 0) return;

        setIsSubmitting(true);

        router.post(route('sales.store'), {
            customer_mode: customerMode,
            customer_id: customerMode === 'member' ? customerId || null : null,
            discount_type: discountType,
            discount_value: discountValue,
            payment_method: paymentMethod,
            cash_received: paymentMethod === 'cash' ? cashReceivedValue : null,
            notes,
            items: cart,
        }, {
            onSuccess: () => {
                setCart([]);
                setCustomerMode('non_member');
                setCustomerId('');
                setDiscountType('nominal');
                setDiscountValueInput('0');
                setPaymentMethod('cash');
                setCashReceived('');
                setNotes('');
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const clearRecentSales = () => {
        if (recentSales.length === 0) return;

        router.delete(route('sales.clear-recent'), {
            data: {
                sale_ids: recentSales.map((sale) => sale.id),
            },
            preserveScroll: true,
            onSuccess: () => setShowClearDialog(false),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Point of Sale</p>
                        <h1 className="vk-page-title">Kasir / Penjualan</h1>
                        <p className="vk-page-copy mt-2 max-w-3xl">
                            Buat transaksi penjualan, pilih pelanggan, dan kurangi stok otomatis dari satu workspace kasir.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Kasir / Penjualan" />

            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Penjualan Hari Ini</p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-800">
                            {formatCurrency(summary.sales_today)}
                        </p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transaksi Hari Ini</p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-800">
                            {summary.transactions_today}
                        </p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Item Siap Jual</p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-800">
                            {summary.items_available}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        <section className="vk-card overflow-hidden">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <div className="relative max-w-md">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari barang atau kode..."
                                        className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 p-6 md:grid-cols-2">
                                {filteredItems.map((item) => (
                                    <div key={item.id} className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{item.kode_barang}</p>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-800">{item.nama_barang}</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Stok: {item.stok} {item.satuan}
                                        </p>
                                        <p className="mt-4 text-xl font-semibold text-slate-800">
                                            {formatCurrency(item.harga_jual)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item.id)}
                                            className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah ke Keranjang
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="vk-card overflow-hidden">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <Receipt className="h-5 w-5 text-primary" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Transaksi Terbaru</h3>
                                        <p className="text-sm text-slate-500">Riwayat checkout kasir yang baru tersimpan.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowClearDialog(true)}
                                    disabled={recentSales.length === 0 || !canClearRecent}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Eraser className="h-3.5 w-3.5" />
                                    {canClearRecent ? 'Clear Riwayat' : 'Hanya Owner'}
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {recentSales.length === 0 ? (
                                    <div className="px-6 py-12 text-center text-slate-500">Belum ada transaksi penjualan.</div>
                                ) : (
                                    recentSales.map((sale) => (
                                        <div key={sale.id} className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800">SALE-{sale.id}</p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {sale.customer?.shop_name || 'Walk-in Customer'} | {new Date(sale.created_at).toLocaleString('id-ID')}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                        {sale.payment_method}
                                                    </p>
                                                    <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                        {sale.customer_mode === 'member' ? 'member' : 'non-member'}
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    {sale.items.map((entry) => `${entry.item?.nama_barang || 'Item'} x${entry.quantity}`).join(', ')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-800">{formatCurrency(sale.total_amount)}</p>
                                                <p className="mt-1 text-sm text-slate-500">{sale.user?.username || '-'}</p>
                                                {sale.payment_method === 'cash' && sale.cash_received !== null && (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Bayar {formatCurrency(sale.cash_received)} | Kembali {formatCurrency(sale.change_amount || 0)}
                                                    </p>
                                                )}
                                                {Number(sale.discount_amount) > 0 && (
                                                    <p className="mt-1 text-xs text-emerald-600">
                                                        Diskon {sale.discount_type === 'percent'
                                                            ? `${Number(sale.discount_value)}%`
                                                            : formatCurrency(sale.discount_value)} | Potongan {formatCurrency(sale.discount_amount)}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(route('sales.receipt', { sale: sale.id, auto_print: 1 }), '_blank', 'noopener,noreferrer')}
                                                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                    Cetak Struk
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <form onSubmit={submit} className="vk-card h-fit overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Keranjang Kasir</h3>
                                    <p className="text-sm text-slate-500">Pilih pelanggan dan cek total sebelum simpan.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Jenis Pelanggan</label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomerMode('non_member');
                                            setCustomerId('');
                                        }}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                                            customerMode === 'non_member'
                                                ? 'border-slate-300 bg-slate-100 text-slate-800'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Non Member
                                        <p className="mt-1 text-xs font-medium text-slate-500">Pembeli umum / walk-in</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomerMode('member')}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                                            customerMode === 'member'
                                                ? 'border-primary/30 bg-indigo-50 text-primary'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Member
                                        <p className="mt-1 text-xs font-medium text-slate-500">Toko / reseller terdaftar</p>
                                    </button>
                                </div>
                            </div>

                            {customerMode === 'member' && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Pilih Member / Partner</label>
                                    <select
                                        value={customerId}
                                        onChange={(event) => setCustomerId(event.target.value)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="">Pilih pelanggan member</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={String(customer.id)}>
                                                {customer.shop_name} - {customer.tier} {customer.category ? `(${customer.category})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Diskon</label>
                                <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                                    <select
                                        value={discountType}
                                        onChange={(event) => setDiscountType(event.target.value as DiscountType)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="nominal">Nominal</option>
                                        <option value="percent">Persen</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        max={discountType === 'percent' ? '100' : undefined}
                                        step={discountType === 'percent' ? '1' : '1000'}
                                        value={discountValueInput}
                                        onChange={(event) => setDiscountValueInput(event.target.value)}
                                        placeholder={discountType === 'percent' ? 'Contoh: 10' : 'Masukkan diskon nominal'}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    {discountType === 'percent'
                                        ? 'Diskon persen dibatasi maksimal 100% dan otomatis dihitung dari subtotal.'
                                        : 'Diskon nominal langsung memotong subtotal belanja.'}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Catatan</label>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="Opsional: catatan transaksi"
                                    className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-3 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Metode Pembayaran</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="qris">QRIS</option>
                                        <option value="debit">Debit</option>
                                    </select>
                                </div>

                                {paymentMethod === 'cash' ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Uang Diterima</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={cashReceived}
                                                onChange={(event) => setCashReceived(event.target.value)}
                                                placeholder="Contoh: 500000"
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Pembayaran</p>
                                                <p className="mt-2 text-base font-semibold text-slate-800">
                                                    {formatCurrency(cashReceivedValue)}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Kembalian</p>
                                                <p className="mt-2 text-base font-semibold text-emerald-600">
                                                    {formatCurrency(changeAmount)}
                                                </p>
                                            </div>
                                        </div>
                                        {cashShortage > 0 && (
                                            <p className="text-sm font-medium text-rose-500">
                                                Uang kurang {formatCurrency(cashShortage)}. Tambahkan pembayaran sebelum simpan transaksi.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                        Pembayaran non-cash diproses sebesar total belanja tanpa hitung kembalian.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {cartDetails.length === 0 ? (
                                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-500">
                                        Keranjang masih kosong. Tambahkan barang dari katalog di sebelah kiri.
                                    </div>
                                ) : (
                                    cartDetails.map((line) => (
                                        <div key={line.item_id} className="rounded-[22px] border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{line.item.nama_barang}</p>
                                                    <p className="mt-1 text-sm text-slate-500">{formatCurrency(line.price)} / {line.item.satuan}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(line.item_id, 0)}
                                                    className="rounded-full border border-slate-200 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                                                    <button type="button" onClick={() => updateQty(line.item_id, line.quantity - 1)} className="rounded-full p-1 text-slate-500">
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="min-w-8 text-center text-sm font-semibold text-slate-800">{line.quantity}</span>
                                                    <button type="button" onClick={() => updateQty(line.item_id, line.quantity + 1)} className="rounded-full p-1 text-slate-500">
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <p className="font-semibold text-slate-800">{formatCurrency(line.subtotal)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5">
                                <div className="flex items-center justify-between text-sm text-slate-500">
                                    <span>Total Item</span>
                                    <span>{cartDetails.reduce((sum, line) => sum + line.quantity, 0)}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm text-emerald-600">
                                    <span>Diskon {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                                    <span>{formatCurrency(discountAmount)}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">Total Belanja</span>
                                    <span className="text-2xl font-semibold tracking-[-0.05em] text-slate-800">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="vk-card-dark flex w-full items-center justify-center gap-3 px-5 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Store className="h-4 w-4" />
                                {isSubmitting ? 'Menyimpan Transaksi...' : 'Simpan Transaksi Kasir'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showClearDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-md overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-rose-50 p-3 text-rose-500">
                                    <CircleAlert className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Clear Riwayat Transaksi</h3>
                                    <p className="text-sm text-slate-500">Aksi ini akan membersihkan daftar transaksi terbaru.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <p className="text-sm leading-6 text-slate-600">
                                Riwayat penjualan yang tampil akan dihapus dari daftar transaksi terbaru.
                                Stok barang tidak akan dikembalikan.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowClearDialog(false)}
                                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={clearRecentSales}
                                    className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
                                >
                                    Ya, Clear Riwayat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
