import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

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

export default function SalesIndex({ customers, items, summary }: SalesPageProps) {
    const page = usePage();
    const params = new URLSearchParams(page.url.split('?')[1] || '');
    const receiptUrl = typeof page.props.flash?.receipt_url === 'string' ? page.props.flash.receipt_url : null;

    const printFrameRef = useRef<HTMLIFrameElement | null>(null);
    const lastPrintedReceipt = useRef<string | null>(null);
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

    const printReceipt = (url: string, options?: { silent?: boolean }) => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!options?.silent) {
            toast.success('Resi sedang disiapkan untuk dicetak');
        }

        const existingFrame = printFrameRef.current;
        if (existingFrame) {
            existingFrame.remove();
        }

        const frame = document.createElement('iframe');
        frame.style.position = 'fixed';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = '0';
        frame.style.visibility = 'hidden';
        frame.src = url;
        frame.onload = () => {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
            window.setTimeout(() => {
                frame.remove();
                if (printFrameRef.current === frame) {
                    printFrameRef.current = null;
                }
            }, 1200);
        };

        document.body.appendChild(frame);
        printFrameRef.current = frame;
    };

    useEffect(() => {
        if (!receiptUrl || lastPrintedReceipt.current === receiptUrl || typeof window === 'undefined') {
            return;
        }

        lastPrintedReceipt.current = receiptUrl;
        printReceipt(receiptUrl, { silent: true });
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
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Penjualan Hari Ini</p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">
                            {formatCurrency(summary.sales_today)}
                        </p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Transaksi Hari Ini</p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">
                            {summary.transactions_today}
                        </p>
                    </div>
                    <div className="vk-card p-6">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Item Siap Jual</p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">
                            {summary.items_available}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        <section className="vk-card overflow-hidden">
                            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                                <div className="relative max-w-md">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari barang atau kode..."
                                        className="vk-field rounded-full pl-11 pr-4"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 p-6 md:grid-cols-2">
                                {filteredItems.length === 0 ? (
                                    <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-6 py-12 text-center">
                                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Barang tidak ditemukan</p>
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Coba cari dengan nama lain atau gunakan kode barang yang lebih spesifik.</p>
                                    </div>
                                ) : (
                                    filteredItems.map((item) => (
                                        <div key={item.id} className="rounded-[22px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.22)]">
                                            <p className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">{item.kode_barang}</p>
                                            <h3 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">{item.nama_barang}</h3>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                Stok: {item.stok} {item.satuan}
                                            </p>
                                            <p className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
                                                {formatCurrency(item.harga_jual)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item.id)}
                                                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-slate-100 dark:hover:bg-slate-600"
                                            >
                                                Tambah ke Keranjang
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>


                    <form onSubmit={submit} className="vk-card h-fit overflow-hidden">
                        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Keranjang Kasir</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Pilih pelanggan dan cek total sebelum simpan.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Jenis Pelanggan</label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomerMode('non_member');
                                            setCustomerId('');
                                        }}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                                            customerMode === 'non_member'
                                                ? 'border-slate-400 bg-slate-200 text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
                                                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Non Member
                                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Pembeli umum / walk-in</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomerMode('member')}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                                            customerMode === 'member'
                                                ? 'border-indigo-400 bg-indigo-200 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-900/60 dark:text-indigo-100'
                                                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Member
                                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Toko / reseller terdaftar</p>
                                    </button>
                                </div>
                            </div>

                            {customerMode === 'member' && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Pilih Member / Partner</label>
                                    <select
                                        value={customerId}
                                        onChange={(event) => setCustomerId(event.target.value)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-sm text-slate-700 dark:text-slate-100 outline-none"
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
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Diskon</label>
                                <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                                    <select
                                        value={discountType}
                                        onChange={(event) => setDiscountType(event.target.value as DiscountType)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-sm text-slate-700 dark:text-slate-100 outline-none"
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
                                        className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-700 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    {discountType === 'percent'
                                        ? 'Diskon persen dibatasi maksimal 100% dan otomatis dihitung dari subtotal.'
                                        : 'Diskon nominal langsung memotong subtotal belanja.'}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Catatan</label>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="Opsional: catatan transaksi"
                                    className="min-h-[96px] w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>

                            <div className="space-y-3 rounded-[22px] border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800/70 p-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Metode Pembayaran</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                                        className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-sm text-slate-700 dark:text-slate-100 outline-none"
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
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Uang Diterima</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={cashReceived}
                                                onChange={(event) => setCashReceived(event.target.value)}
                                                placeholder="Contoh: 500000"
                                                className="vk-field"
                                            />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Pembayaran</p>
                                                <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                                                    {formatCurrency(cashReceivedValue)}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Kembalian</p>
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
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        Pembayaran non-cash diproses sebesar total belanja tanpa hitung kembalian.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {cartDetails.length === 0 ? (
                                    <div className="rounded-[22px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                        Keranjang masih kosong. Tambahkan barang dari katalog di sebelah kiri.
                                    </div>
                                ) : (
                                    cartDetails.map((line) => (
                                        <div key={line.item_id} className="rounded-[22px] border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-4 py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{line.item.nama_barang}</p>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatCurrency(line.price)} / {line.item.satuan}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(line.item_id, 0)}
                                                    className="rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300 transition hover:bg-rose-100"
                                                >
                                                    Hapus
                                                </button>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1">
                                                    <button type="button" onClick={() => updateQty(line.item_id, line.quantity - 1)} className="rounded-full px-2 py-1 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        −
                                                    </button>
                                                    <span className="min-w-8 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">{line.quantity}</span>
                                                    <button type="button" onClick={() => updateQty(line.item_id, line.quantity + 1)} className="rounded-full px-2 py-1 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        +
                                                    </button>
                                                </div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(line.subtotal)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800/80 p-5">
                                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                    <span>Total Item</span>
                                    <span>{cartDetails.reduce((sum, line) => sum + line.quantity, 0)}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm text-emerald-600">
                                    <span>Diskon {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                                    <span>{formatCurrency(discountAmount)}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Belanja</span>
                                    <span className="text-2xl font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="vk-card-dark flex w-full items-center justify-center gap-3 px-5 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? 'Menyimpan Transaksi...' : 'Simpan Transaksi Kasir'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>


        </AuthenticatedLayout>
    );
}
