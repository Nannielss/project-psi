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
import { Plus, Search, Upload, Edit, Trash2, X, QrCode, Printer, Download } from 'lucide-react';
import { PageProps, Student, Major } from '@/types';
import { toast } from 'sonner';
import { QRPrintDialog } from '@/components/features/qr/QRPrintDialog';

interface StudentsPageProps extends PageProps {
    students: {
        data: Student[];
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
    majors: Major[];
    classes: string[];
    filters: {
        search?: string;
        major_id?: string;
        class?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ students, majors, classes, filters }: StudentsPageProps) {
    const { flash } = usePage<StudentsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [majorFilter, setMajorFilter] = useState(filters.major_id || '');
    const [classFilter, setClassFilter] = useState(filters.class || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({
        nis: '',
        name: '',
        major_id: '',
        class: '',
    });
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQRPrintOpen, setIsQRPrintOpen] = useState(false);
    const [qrPrintMode, setQrPrintMode] = useState<'single' | 'filtered'>('filtered');
    const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
    const [qrData, setQrData] = useState<Student[]>([]);
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
        router.get('/students', {
            search: search || undefined,
            major_id: majorFilter || undefined,
            class: classFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = (newMajorFilter?: string, newClassFilter?: string) => {
        const majorValue = newMajorFilter !== undefined ? newMajorFilter : majorFilter;
        const classValue = newClassFilter !== undefined ? newClassFilter : classFilter;
        
        router.get('/students', {
            search: search || undefined,
            major_id: majorValue && majorValue !== 'all' ? majorValue : undefined,
            class: classValue && classValue !== 'all' ? classValue : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/students', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ nis: '', name: '', major_id: '', class: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setFormData({
            nis: student.nis,
            name: student.name,
            major_id: student.major_id.toString(),
            class: student.class,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        setIsSubmitting(true);
        router.put(`/students/${selectedStudent.id}`, formData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedStudent(null);
                setFormData({ nis: '', name: '', major_id: '', class: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = (student: Student) => {
        setSelectedStudent(student);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedStudent) return;
        router.delete(`/students/${selectedStudent.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedStudent(null);
            },
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', importFile);
        router.post('/students/import', formData, {
            onSuccess: () => {
                setIsImportOpen(false);
                setImportFile(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handlePrintQRSingle = (student: Student) => {
        setSelectedStudentForQR(student);
        setQrPrintMode('single');
        setIsQRPrintOpen(true);
    };

    const handlePrintQRFiltered = async () => {
        setSelectedStudentForQR(null);
        setQrPrintMode('filtered');
        setIsLoadingQR(true);
        
        try {
            // Build query params with current filters
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (majorFilter) params.major_id = majorFilter;
            if (classFilter) params.class = classFilter;
            
            const response = await window.axios.get('/students/for-qr', { params });
            
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
        if (qrPrintMode === 'single' && selectedStudentForQR) {
            return [{
                id: selectedStudentForQR.id,
                code: selectedStudentForQR.nis,
                name: selectedStudentForQR.name,
                subtitle: `${selectedStudentForQR.class} - ${selectedStudentForQR.major?.name || ''}`,
            }];
        }
        // Use fetched QR data instead of paginated students.data
        return qrData.map(student => ({
            id: student.id,
            code: student.nis,
            name: student.name,
            subtitle: `${student.class} - ${student.major?.name || ''}`,
        }));
    };

    const getFilterDescription = () => {
        const parts: string[] = [];
        if (classFilter) parts.push(`Kelas: ${classFilter}`);
        if (majorFilter) {
            const major = majors.find(m => m.id.toString() === majorFilter);
            if (major) parts.push(`Jurusan: ${major.name}`);
        }
        if (search) parts.push(`Pencarian: "${search}"`);
        return parts.length > 0 ? parts.join(', ') : 'Semua siswa';
    };

    return (
        <DashboardLayout>
            <Head title="Manajemen Siswa" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Siswa</h1>
                        <p className="text-muted-foreground">
                            Kelola data siswa dengan CRUD, filter, dan import CSV
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrintQRFiltered} disabled={isLoadingQR}>
                            <Printer className="mr-2 h-4 w-4" />
                            {isLoadingQR ? 'Memuat...' : 'Cetak QR'}
                        </Button>
                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Excel
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Import Siswa dari Excel</DialogTitle>
                                    <DialogDescription>
                                        Upload file Excel dengan format: nis, name, Class. Kode jurusan akan diekstrak otomatis dari kolom Class (contoh: "X TE 1" → kode jurusan "TE").
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleImport}>
                                    <div className="space-y-4 py-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <Label htmlFor="file">File Excel</Label>
                                                <Input
                                                    id="file"
                                                    type="file"
                                                    accept=".xlsx,.xls"
                                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                                    required
                                                    className="mt-2"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    window.open('/students/import/template', '_blank');
                                                }}
                                                className="mt-8"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Template
                                            </Button>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsImportOpen(false)}
                                        >
                                            Batal
                                        </Button>
                                        <Button type="submit" disabled={!importFile || isSubmitting}>
                                            {isSubmitting ? 'Mengimpor...' : 'Import'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Siswa
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Tambah Siswa Baru</DialogTitle>
                                    <DialogDescription>
                                        Masukkan data siswa yang akan ditambahkan
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate}>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nis">NIS</Label>
                                            <Input
                                                id="nis"
                                                value={formData.nis}
                                                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nama</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="major_id">Jurusan</Label>
                                            <Select
                                                value={formData.major_id}
                                                onValueChange={(value) => setFormData({ ...formData, major_id: value })}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Jurusan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {majors.map((major) => (
                                                        <SelectItem key={major.id} value={major.id.toString()}>
                                                            {major.name} ({major.kode})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="class">Kelas</Label>
                                            <Input
                                                id="class"
                                                placeholder="Contoh: XI A, X B, XII A"
                                                value={formData.class}
                                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
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
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter & Pencarian</CardTitle>
                        <CardDescription>
                            Gunakan filter dan pencarian untuk menemukan siswa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Cari (NIS/Nama)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="search"
                                            placeholder="Cari siswa..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                        <Button type="submit" size="icon">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="major_filter">Filter Jurusan</Label>
                                    <Select
                                        value={majorFilter || 'all'}
                                        onValueChange={(value) => {
                                            const newValue = value === 'all' ? '' : value;
                                            setMajorFilter(newValue);
                                            handleFilterChange(value, undefined);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Jurusan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Jurusan</SelectItem>
                                            {majors.map((major) => (
                                                <SelectItem key={major.id} value={major.id.toString()}>
                                                    {major.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="class_filter">Filter Kelas</Label>
                                    <Select
                                        value={classFilter || 'all'}
                                        onValueChange={(value) => {
                                            const newValue = value === 'all' ? '' : value;
                                            setClassFilter(newValue);
                                            handleFilterChange(undefined, value);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Kelas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kelas</SelectItem>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls} value={cls}>
                                                    {cls}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(search || majorFilter || classFilter) && (
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setSearch('');
                                                setMajorFilter('');
                                                setClassFilter('');
                                                router.get('/students', {}, {
                                                    preserveState: false,
                                                    replace: true,
                                                });
                                            }}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Reset
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Siswa</CardTitle>
                        <CardDescription>
                            Total: {students.total} siswa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {students.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data siswa
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>NIS</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Jurusan</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Tanggal Dibuat</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.data.map((student) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="font-medium">
                                                        {student.nis}
                                                    </TableCell>
                                                    <TableCell>{student.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {student.major?.name || '-'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{student.class}</TableCell>
                                                    <TableCell>
                                                        {new Date(student.created_at).toLocaleDateString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handlePrintQRSingle(student)}
                                                                title="Cetak QR"
                                                            >
                                                                <QrCode className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(student)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(student)}
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

                                {students.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((students.current_page - 1) * students.per_page) + 1} sampai{' '}
                                            {Math.min(students.current_page * students.per_page, students.total)} dari{' '}
                                            {students.total} siswa
                                        </div>
                                        <div className="flex gap-2">
                                            {students.links.map((link, index) => {
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
                            <DialogTitle>Edit Siswa</DialogTitle>
                            <DialogDescription>
                                Perbarui data siswa yang dipilih
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_nis">NIS</Label>
                                    <Input
                                        id="edit_nis"
                                        value={formData.nis}
                                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_name">Nama</Label>
                                    <Input
                                        id="edit_name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_major_id">Jurusan</Label>
                                    <Select
                                        value={formData.major_id}
                                        onValueChange={(value) => setFormData({ ...formData, major_id: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Jurusan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {majors.map((major) => (
                                                <SelectItem key={major.id} value={major.id.toString()}>
                                                    {major.name} ({major.kode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_class">Kelas</Label>
                                    <Input
                                        id="edit_class"
                                        placeholder="Contoh: XI A, X TKJ 1, XII RPL 2"
                                        value={formData.class}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
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
                            <DialogTitle>Hapus Siswa</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus siswa{' '}
                                <strong>{selectedStudent?.name}</strong> (NIS: {selectedStudent?.nis})?
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
                        ? `Cetak QR - ${selectedStudentForQR?.name || ''}` 
                        : 'Cetak QR Siswa'}
                    description={qrPrintMode === 'single'
                        ? `QR Code untuk NIS: ${selectedStudentForQR?.nis || ''}`
                        : `Cetak QR Code untuk ${qrData.length} siswa (${getFilterDescription()})`}
                    type="student"
                />
            </div>
        </DashboardLayout>
    );
}

