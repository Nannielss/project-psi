import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, Edit, Trash2, X, ChevronDown, QrCode, Printer } from 'lucide-react';
import { PageProps, Teacher, Subject } from '@/types';
import { toast } from 'sonner';
import { QRPrintDialog } from '@/components/features/qr/QRPrintDialog';

interface TeachersPageProps extends PageProps {
    teachers: {
        data: Teacher[];
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
    subjects: Subject[];
    filters: {
        search?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ teachers, subjects, filters }: TeachersPageProps) {
    const { flash } = usePage<TeachersPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [formData, setFormData] = useState({
        nip: '',
        name: '',
        subject_ids: [] as number[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQRPrintOpen, setIsQRPrintOpen] = useState(false);
    const [qrPrintMode, setQrPrintMode] = useState<'single' | 'all'>('single');
    const [selectedTeacherForQR, setSelectedTeacherForQR] = useState<Teacher | null>(null);
    const [qrData, setQrData] = useState<Teacher[]>([]);
    const [isLoadingQR, setIsLoadingQR] = useState(false);

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
        router.get('/teachers', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/teachers', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ nip: '', name: '', subject_ids: [] });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setFormData({
            nip: teacher.nip,
            name: teacher.name,
            subject_ids: teacher.subjects?.map(s => s.id) || [],
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacher) return;
        setIsSubmitting(true);
        router.put(`/teachers/${selectedTeacher.id}`, formData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedTeacher(null);
                setFormData({ nip: '', name: '', subject_ids: [] });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedTeacher) return;
        router.delete(`/teachers/${selectedTeacher.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedTeacher(null);
            },
        });
    };

    const toggleSubject = (subjectId: number) => {
        setFormData(prev => {
            const currentIds = prev.subject_ids;
            if (currentIds.includes(subjectId)) {
                return { ...prev, subject_ids: currentIds.filter(id => id !== subjectId) };
            } else {
                return { ...prev, subject_ids: [...currentIds, subjectId] };
            }
        });
    };

    const formatSubjectDisplay = (subjects: Subject[] | undefined): string => {
        if (!subjects || subjects.length === 0) return '-';
        return subjects.map(s => `${s.nama} (${s.hari} ${s.jam_mulai}-${s.jam_selesai})`).join(', ');
    };

    const handlePrintQRSingle = (teacher: Teacher) => {
        setSelectedTeacherForQR(teacher);
        setQrPrintMode('single');
        setIsQRPrintOpen(true);
    };

    const handlePrintQRAll = async () => {
        setSelectedTeacherForQR(null);
        setQrPrintMode('all');
        setIsLoadingQR(true);
        
        try {
            // Build query params with current filters
            const params: Record<string, string> = {};
            if (search) params.search = search;
            
            const response = await window.axios.get('/teachers/for-qr', { params });
            
            if (response.data && response.data.data) {
                setQrData(response.data.data);
                setIsQRPrintOpen(true);
            } else {
                toast.error('Format data tidak valid');
            }
        } catch (error: any) {
            console.error('Error fetching QR data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Gagal mengambil data untuk QR';
            toast.error(errorMessage);
        } finally {
            setIsLoadingQR(false);
        }
    };

    const getQRItems = () => {
        if (qrPrintMode === 'single' && selectedTeacherForQR) {
            return [{
                id: selectedTeacherForQR.id,
                code: selectedTeacherForQR.nip,
                name: selectedTeacherForQR.name,
                subtitle: selectedTeacherForQR.subjects?.map(s => s.nama).join(', ') || undefined,
            }];
        }
        // Use fetched QR data instead of paginated teachers.data
        return qrData.map(teacher => ({
            id: teacher.id,
            code: teacher.nip,
            name: teacher.name,
            subtitle: teacher.subjects?.map(s => s.nama).join(', ') || undefined,
        }));
    };

    return (
        <DashboardLayout>
            <Head title="Manajemen Guru" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Guru</h1>
                        <p className="text-muted-foreground">
                            Kelola data guru dengan CRUD dan pencarian
                        </p>
                    </div>
                    <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrintQRAll} disabled={isLoadingQR}>
                        <Printer className="mr-2 h-4 w-4" />
                        {isLoadingQR ? 'Memuat...' : 'Cetak Semua QR'}
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Guru
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Tambah Guru Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan data guru yang akan ditambahkan
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nip">NIP</Label>
                                        <Input
                                            id="nip"
                                            placeholder="Nomor Induk Pegawai"
                                            value={formData.nip}
                                            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Guru</Label>
                                        <Input
                                            id="name"
                                            placeholder="Nama lengkap guru"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mata Pelajaran</Label>
                                        {subjects.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                Belum ada mata pelajaran. Silakan tambahkan mata pelajaran terlebih dahulu.
                                            </p>
                                        ) : (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {formData.subject_ids.length > 0
                                                            ? `${formData.subject_ids.length} mata pelajaran dipilih`
                                                            : "Pilih mata pelajaran"}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <div className="max-h-60 overflow-y-auto p-2">
                                                        <div className="space-y-2">
                                                            {subjects.map((subject) => (
                                                                <div key={subject.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
                                                                    <Checkbox
                                                                        id={`subject-${subject.id}`}
                                                                        checked={formData.subject_ids.includes(subject.id)}
                                                                        onCheckedChange={() => toggleSubject(subject.id)}
                                                                    />
                                                                    <Label
                                                                        htmlFor={`subject-${subject.id}`}
                                                                        className="text-sm font-normal cursor-pointer flex-1"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-medium">{subject.nama}</span>
                                                                            <span className="text-muted-foreground ml-2 text-xs">
                                                                                {subject.hari} {subject.jam_mulai}-{subject.jam_selesai}
                                                                            </span>
                                                                        </div>
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
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
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pencarian</CardTitle>
                        <CardDescription>
                            Cari guru berdasarkan NIP atau nama
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari guru..."
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
                                            router.get('/teachers');
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
                        <CardTitle>Daftar Guru</CardTitle>
                        <CardDescription>
                            Total: {teachers.total} guru
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teachers.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data guru
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>NIP</TableHead>
                                                <TableHead>Nama Guru</TableHead>
                                                <TableHead>Mata Pelajaran</TableHead>
                                                <TableHead>Tanggal Dibuat</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {teachers.data.map((teacher) => (
                                                <TableRow key={teacher.id}>
                                                    <TableCell className="font-medium">
                                                        {teacher.nip}
                                                    </TableCell>
                                                    <TableCell>{teacher.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {teacher.subjects && teacher.subjects.length > 0 ? (
                                                                teacher.subjects.map((subject) => (
                                                                    <Badge key={subject.id} variant="secondary" className="text-xs">
                                                                        {subject.nama} ({subject.hari} {subject.jam_mulai}-{subject.jam_selesai})
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(teacher.created_at).toLocaleDateString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handlePrintQRSingle(teacher)}
                                                                title="Cetak QR"
                                                            >
                                                                <QrCode className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(teacher)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(teacher)}
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

                                {teachers.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((teachers.current_page - 1) * teachers.per_page) + 1} sampai{' '}
                                            {Math.min(teachers.current_page * teachers.per_page, teachers.total)} dari{' '}
                                            {teachers.total} guru
                                        </div>
                                        <div className="flex gap-2">
                                            {teachers.links.map((link, index) => {
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Guru</DialogTitle>
                            <DialogDescription>
                                Perbarui data guru yang dipilih
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_nip">NIP</Label>
                                    <Input
                                        id="edit_nip"
                                        placeholder="Nomor Induk Pegawai"
                                        value={formData.nip}
                                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_name">Nama Guru</Label>
                                    <Input
                                        id="edit_name"
                                        placeholder="Nama lengkap guru"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mata Pelajaran</Label>
                                    {subjects.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada mata pelajaran. Silakan tambahkan mata pelajaran terlebih dahulu.
                                        </p>
                                    ) : (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between"
                                                >
                                                    {formData.subject_ids.length > 0
                                                        ? `${formData.subject_ids.length} mata pelajaran dipilih`
                                                        : "Pilih mata pelajaran"}
                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <div className="max-h-60 overflow-y-auto p-2">
                                                    <div className="space-y-2">
                                                        {subjects.map((subject) => (
                                                            <div key={subject.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
                                                                <Checkbox
                                                                    id={`edit-subject-${subject.id}`}
                                                                    checked={formData.subject_ids.includes(subject.id)}
                                                                    onCheckedChange={() => toggleSubject(subject.id)}
                                                                />
                                                                <Label
                                                                    htmlFor={`edit-subject-${subject.id}`}
                                                                    className="text-sm font-normal cursor-pointer flex-1"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-medium">{subject.nama}</span>
                                                                        <span className="text-muted-foreground ml-2 text-xs">
                                                                            {subject.hari} {subject.jam_mulai}-{subject.jam_selesai}
                                                                        </span>
                                                                    </div>
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
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
                            <DialogTitle>Hapus Guru</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus guru{' '}
                                <strong>{selectedTeacher?.name}</strong> (NIP: {selectedTeacher?.nip})?
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

                {/* QR Print Dialog */}
                <QRPrintDialog
                    open={isQRPrintOpen}
                    onOpenChange={setIsQRPrintOpen}
                    items={getQRItems()}
                    title={qrPrintMode === 'single' 
                        ? `Cetak QR - ${selectedTeacherForQR?.name || ''}` 
                        : 'Cetak QR Semua Guru'}
                    description={qrPrintMode === 'single'
                        ? `QR Code untuk NIP: ${selectedTeacherForQR?.nip || ''}`
                        : `Cetak QR Code untuk ${qrData.length} guru`}
                    type="teacher"
                />
            </div>
        </DashboardLayout>
    );
}

