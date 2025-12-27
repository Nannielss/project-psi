import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { PageProps, Major } from '@/types';
import { toast } from 'sonner';

interface MajorsPageProps extends PageProps {
    majors: {
        data: Major[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ majors, filters }: MajorsPageProps) {
    const { flash } = usePage<MajorsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
    const [formData, setFormData] = useState({
        kode: '',
        name: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/majors', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/majors', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ kode: '', name: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (major: Major) => {
        setSelectedMajor(major);
        setFormData({
            kode: major.kode,
            name: major.name,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMajor) return;
        setIsSubmitting(true);
        router.put(`/majors/${selectedMajor.id}`, formData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedMajor(null);
                setFormData({ kode: '', name: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = (major: Major) => {
        setSelectedMajor(major);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedMajor) return;
        router.delete(`/majors/${selectedMajor.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedMajor(null);
            },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Manajemen Jurusan" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Jurusan</h1>
                        <p className="text-muted-foreground">
                            Kelola data jurusan dengan CRUD dan pencarian
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Jurusan
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Jurusan Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan data jurusan yang akan ditambahkan
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="kode">Kode</Label>
                                        <Input
                                            id="kode"
                                            placeholder="Contoh: TP, TE, TK"
                                            value={formData.kode}
                                            onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                                            required
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Jurusan</Label>
                                        <Input
                                            id="name"
                                            placeholder="Contoh: Teknik Pemesinan"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pencarian</CardTitle>
                        <CardDescription>
                            Cari jurusan berdasarkan kode atau nama
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari jurusan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                                {search && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            router.get('/majors');
                                        }}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Jurusan</CardTitle>
                        <CardDescription>
                            Total: {majors.total} jurusan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {majors.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data jurusan
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama Jurusan</TableHead>
                                                <TableHead>Tanggal Dibuat</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {majors.data.map((major) => (
                                                <TableRow key={major.id}>
                                                    <TableCell className="font-medium">
                                                        <Badge variant="secondary">{major.kode}</Badge>
                                                    </TableCell>
                                                    <TableCell>{major.name}</TableCell>
                                                    <TableCell>
                                                        {major.created_at 
                                                            ? new Date(major.created_at).toLocaleDateString('id-ID')
                                                            : '-'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(major)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(major)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {majors.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((majors.current_page - 1) * majors.per_page) + 1} sampai{' '}
                                            {Math.min(majors.current_page * majors.per_page, majors.total)} dari{' '}
                                            {majors.total} jurusan
                                        </div>
                                        <div className="flex gap-2">
                                            {majors.links.map((link, index) => {
                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-2 text-sm rounded-md border pointer-events-none opacity-50"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        className={`px-3 py-2 text-sm rounded-md border ${
                                                            link.active
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'hover:bg-accent'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Jurusan</DialogTitle>
                            <DialogDescription>
                                Perbarui data jurusan yang dipilih
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_kode">Kode</Label>
                                    <Input
                                        id="edit_kode"
                                        placeholder="Contoh: TP, TE, TK"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_name">Nama Jurusan</Label>
                                    <Input
                                        id="edit_name"
                                        placeholder="Contoh: Teknik Pemesinan"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Memperbarui...' : 'Perbarui'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Jurusan</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus jurusan{' '}
                                <strong>{selectedMajor?.name}</strong> (Kode: {selectedMajor?.kode})?
                                Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

