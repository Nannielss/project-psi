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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { PageProps, Subject } from '@/types';
import { toast } from 'sonner';

interface SubjectsPageProps extends PageProps {
    subjects: {
        data: Subject[];
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

const DAYS = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
];

export default function Index({ subjects, filters }: SubjectsPageProps) {
    const { flash } = usePage<SubjectsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        nama: '',
        hari: '',
        jam_mulai: '',
        jam_selesai: '',
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
        router.get('/subjects', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/subjects', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ nama: '', hari: '', jam_mulai: '', jam_selesai: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (subject: Subject) => {
        setSelectedSubject(subject);
        setFormData({
            nama: subject.nama,
            hari: subject.hari,
            jam_mulai: subject.jam_mulai,
            jam_selesai: subject.jam_selesai,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject) return;
        setIsSubmitting(true);
        router.put(`/subjects/${selectedSubject.id}`, formData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedSubject(null);
                setFormData({ nama: '', hari: '', jam_mulai: '', jam_selesai: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = (subject: Subject) => {
        setSelectedSubject(subject);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedSubject) return;
        router.delete(`/subjects/${selectedSubject.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedSubject(null);
            },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Manajemen Mata Pelajaran" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Mata Pelajaran</h1>
                        <p className="text-muted-foreground">
                            Kelola data mata pelajaran dengan CRUD dan pencarian
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Mata Pelajaran
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Mata Pelajaran Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan data mata pelajaran yang akan ditambahkan
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nama">Nama Mata Pelajaran</Label>
                                        <Input
                                            id="nama"
                                            placeholder="Contoh: Matematika, Fisika"
                                            value={formData.nama}
                                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hari">Hari</Label>
                                        <Select
                                            value={formData.hari}
                                            onValueChange={(value) => setFormData({ ...formData, hari: value })}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Hari" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS.map((day) => (
                                                    <SelectItem key={day} value={day}>
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="jam_mulai">Jam Mulai</Label>
                                            <Input
                                                id="jam_mulai"
                                                type="time"
                                                value={formData.jam_mulai}
                                                onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="jam_selesai">Jam Selesai</Label>
                                            <Input
                                                id="jam_selesai"
                                                type="time"
                                                value={formData.jam_selesai}
                                                onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                                                required
                                            />
                                        </div>
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
                            Cari mata pelajaran berdasarkan nama atau hari
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari mata pelajaran..."
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
                                            router.get('/subjects');
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
                        <CardTitle>Daftar Mata Pelajaran</CardTitle>
                        <CardDescription>
                            Total: {subjects.total} mata pelajaran
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {subjects.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data mata pelajaran
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Mata Pelajaran</TableHead>
                                                <TableHead>Hari</TableHead>
                                                <TableHead>Jam</TableHead>
                                                <TableHead>Tanggal Dibuat</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subjects.data.map((subject) => (
                                                <TableRow key={subject.id}>
                                                    <TableCell className="font-medium">
                                                        {subject.nama}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{subject.hari}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {subject.jam_mulai} - {subject.jam_selesai}
                                                    </TableCell>
                                                    <TableCell>
                                                        {subject.created_at 
                                                            ? new Date(subject.created_at).toLocaleDateString('id-ID')
                                                            : '-'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(subject)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(subject)}
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

                                {subjects.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((subjects.current_page - 1) * subjects.per_page) + 1} sampai{' '}
                                            {Math.min(subjects.current_page * subjects.per_page, subjects.total)} dari{' '}
                                            {subjects.total} mata pelajaran
                                        </div>
                                        <div className="flex gap-2">
                                            {subjects.links.map((link, index) => {
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
                            <DialogTitle>Edit Mata Pelajaran</DialogTitle>
                            <DialogDescription>
                                Perbarui data mata pelajaran yang dipilih
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_nama">Nama Mata Pelajaran</Label>
                                    <Input
                                        id="edit_nama"
                                        placeholder="Contoh: Matematika, Fisika"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_hari">Hari</Label>
                                    <Select
                                        value={formData.hari}
                                        onValueChange={(value) => setFormData({ ...formData, hari: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Hari" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DAYS.map((day) => (
                                                <SelectItem key={day} value={day}>
                                                    {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_jam_mulai">Jam Mulai</Label>
                                        <Input
                                            id="edit_jam_mulai"
                                            type="time"
                                            value={formData.jam_mulai}
                                            onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_jam_selesai">Jam Selesai</Label>
                                        <Input
                                            id="edit_jam_selesai"
                                            type="time"
                                            value={formData.jam_selesai}
                                            onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                                            required
                                        />
                                    </div>
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
                            <DialogTitle>Hapus Mata Pelajaran</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus mata pelajaran{' '}
                                <strong>{selectedSubject?.nama}</strong>?
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



