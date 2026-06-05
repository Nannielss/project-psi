import { FormEvent, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    items_count: number;
    created_at: string;
};

type CategoriesIndexProps = {
    categories: Category[];
};

type CategoryForm = {
    name: string;
    description: string;
};

const defaultForm: CategoryForm = {
    name: '',
    description: '',
};

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<CategoryForm>(defaultForm);

    const filteredCategories = useMemo(() => {
        return categories.filter((category) =>
            category.name.toLowerCase().includes(search.toLowerCase()) ||
            category.slug.toLowerCase().includes(search.toLowerCase()) ||
            (category.description || '').toLowerCase().includes(search.toLowerCase()),
        );
    }, [categories, search]);

    const totalUsedItems = categories.reduce((sum, category) => sum + Number(category.items_count || 0), 0);
    const emptyCategoryCount = categories.filter((category) => Number(category.items_count || 0) === 0).length;

    const openModal = (category: Category | null = null) => {
        setSelectedCategory(category);
        setForm(category ? {
            name: category.name,
            description: category.description || '',
        } : defaultForm);
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedCategory(null);
        setForm(defaultForm);
        setShowModal(false);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (selectedCategory) {
            router.put(route('categories.update', selectedCategory.id), form, {
                onSuccess: closeModal,
            });
            return;
        }

        router.post(route('categories.store'), form, {
            onSuccess: closeModal,
        });
    };

    const handleDelete = (category: Category) => {
        if (category.slug === 'umum') {
            alert('Kategori default Umum tidak boleh dihapus.');
            return;
        }

        const message = category.items_count > 0
            ? `Kategori "${category.name}" dipakai oleh ${category.items_count} barang. Jika dihapus, barang tersebut akan dipindahkan ke kategori Umum. Lanjutkan?`
            : `Yakin ingin menghapus kategori "${category.name}"?`;

        if (!confirm(message)) {
            return;
        }

        router.delete(route('categories.destroy', category.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="vk-chip mb-4">Klasifikasi Barang</p>
                        <h1 className="vk-page-title">Kategori Barang</h1>
                        <p className="vk-page-copy mt-2 max-w-2xl">
                            Kelompokkan barang berdasarkan kategori agar data inventaris, kasir, barcode, dan riwayat lebih rapi.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="vk-card-dark flex items-center gap-3 px-5 py-3 text-sm font-semibold"
                    >
                        Tambah Kategori
                    </button>
                </div>
            }
        >
            <Head title="Kategori Barang" />

            <div className="space-y-6">
                <div className="grid gap-5 xl:grid-cols-[0.8fr_0.8fr_1.4fr]">
                    <div className="vk-card px-6 py-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Kategori</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-800 dark:text-slate-100">{categories.length}</p>
                    </div>
                    <div className="vk-card px-6 py-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Kategori Kosong</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-amber-500">{emptyCategoryCount}</p>
                    </div>
                    <div className="vk-card px-6 py-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Barang Terkategori</p>
                        <p className="mt-2 text-[2.35rem] font-semibold tracking-[-0.06em] text-slate-800 dark:text-slate-100">{totalUsedItems}</p>
                    </div>
                </div>

                <section className="vk-card overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Daftar Kategori</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola kategori yang digunakan pada master barang.</p>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari kategori..."
                            className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 lg:max-w-sm"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-left">
                            <thead className="bg-slate-50/70 text-[0.72rem] uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-800/70 dark:text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Kategori</th>
                                    <th className="px-6 py-4 font-semibold">Slug</th>
                                    <th className="px-6 py-4 font-semibold">Deskripsi</th>
                                    <th className="px-6 py-4 font-semibold">Jumlah Barang</th>
                                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Kategori tidak ditemukan</p>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Coba ubah kata kunci pencarian.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <tr key={category.id} className="hover:bg-slate-50/65 dark:hover:bg-slate-800/65">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                        {category.name.slice(0, 2).toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{category.name}</p>
                                                        {category.slug === 'umum' && (
                                                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">Default</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {category.slug}
                                                </span>
                                            </td>
                                            <td className="max-w-md px-6 py-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                {category.description || '-'}
                                            </td>
                                            <td className="px-6 py-5 font-semibold text-slate-800 dark:text-slate-100">
                                                {category.items_count} barang
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openModal(category)}
                                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:border-amber-200 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(category)}
                                                        disabled={category.slug === 'umum'}
                                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-xl overflow-hidden">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-800 dark:text-slate-100">
                                    {selectedCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Nama kategori akan otomatis dibuat menjadi slug sistem.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                            >
                                x
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Nama Kategori</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    placeholder="Contoh: ATK, Elektronik, Sembako"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Deskripsi</label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    placeholder="Keterangan kategori barang..."
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button type="submit" className="vk-card-dark px-5 py-3 text-sm font-semibold">
                                    Simpan Kategori
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
