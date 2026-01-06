import { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Search, Edit, Trash2, X, Image as ImageIcon, QrCode, Printer, Package, Upload, Download } from 'lucide-react';
import { PageProps, Tool, ToolUnit } from '@/types';
import { toast } from 'sonner';
import { QRPrintDialog } from '@/components/features/qr/QRPrintDialog';

interface ToolsPageProps extends PageProps {
    tools: {
        data: Tool[];
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
        condition?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ tools, filters }: ToolsPageProps) {
    const { flash, auth } = usePage<ToolsPageProps>().props;
    const currentUser = auth?.user;
    const [search, setSearch] = useState(filters.search || '');
    const [conditionFilter, setConditionFilter] = useState(filters.condition || 'all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isUnitsOpen, setIsUnitsOpen] = useState(false);
    const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
    const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<ToolUnit | null>(null);
    const [units, setUnits] = useState<ToolUnit[]>([]);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        location: '',
        photo: null as File | null,
        description: '',
    });
    const [unitFormData, setUnitFormData] = useState({
        condition: 'good' as 'good' | 'damaged' | 'scrapped',
        description: '',
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQRPrintOpen, setIsQRPrintOpen] = useState(false);
    const [qrPrintMode, setQrPrintMode] = useState<'single' | 'all'>('single');
    const [selectedToolForQR, setSelectedToolForQR] = useState<Tool | null>(null);
    const [qrData, setQrData] = useState<Array<{
        id: number | string;
        unit_code: string;
        unit_number: number;
        tool: {
            id: number;
            name: string;
            location: string;
        };
    }>>([]);
    const [isLoadingQR, setIsLoadingQR] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        router.get('/tools', {
            search: search || undefined,
            condition: conditionFilter !== 'all' ? conditionFilter : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleConditionFilterChange = (value: string) => {
        setConditionFilter(value);
        router.get('/tools', {
            search: search || undefined,
            condition: value !== 'all' ? value : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('code', formData.code);
        formDataToSend.append('name', formData.name);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('description', formData.description || '');
        if (formData.photo) {
            formDataToSend.append('photo', formData.photo);
        }

        router.post('/tools', formDataToSend, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ code: '', name: '', location: '', photo: null, description: '' });
                setPhotoPreview(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (tool: Tool) => {
        setSelectedTool(tool);
        setFormData({
            code: tool.code,
            name: tool.name,
            location: tool.location,
            photo: null,
            description: tool.description || '',
        });
        setPhotoPreview(tool.photo ? `/storage/${tool.photo}` : null);
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTool) return;
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('code', formData.code);
        formDataToSend.append('name', formData.name);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('description', formData.description || '');
        if (formData.photo) {
            formDataToSend.append('photo', formData.photo);
        }
        formDataToSend.append('_method', 'PUT');

        router.post(`/tools/${selectedTool.id}`, formDataToSend, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedTool(null);
                setFormData({ code: '', name: '', location: '', photo: null, description: '' });
                setPhotoPreview(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = (tool: Tool) => {
        setSelectedTool(tool);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedTool) return;
        router.delete(`/tools/${selectedTool.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedTool(null);
            },
        });
    };

    const handleViewUnits = async (tool: Tool) => {
        setSelectedTool(tool);
        try {
            const response = await fetch(`/tools/${tool.id}/units`);
            const data = await response.json();
            setUnits(data.units || []);
            setIsUnitsOpen(true);
        } catch (error) {
            toast.error('Gagal memuat data unit');
        }
    };

    const handleAddUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTool) return;
        setIsSubmitting(true);

        router.post(`/tools/${selectedTool.id}/units`, unitFormData, {
            onSuccess: () => {
                setIsAddUnitOpen(false);
                setUnitFormData({ condition: 'good', description: '' });
                // Reload units
                handleViewUnits(selectedTool);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEditUnit = (unit: ToolUnit) => {
        setSelectedUnit(unit);
        setUnitFormData({
            condition: unit.condition,
            description: unit.description || '',
        });
        setIsEditUnitOpen(true);
    };

    const handleUpdateUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTool || !selectedUnit) return;
        setIsSubmitting(true);

        router.put(`/tools/${selectedTool.id}/units/${selectedUnit.id}`, unitFormData, {
            onSuccess: () => {
                setIsEditUnitOpen(false);
                setSelectedUnit(null);
                setUnitFormData({ condition: 'good', description: '' });
                // Reload units
                handleViewUnits(selectedTool);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDeleteUnit = (unit: ToolUnit) => {
        if (!selectedTool) return;
        if (confirm(`Apakah Anda yakin ingin menghapus unit ${unit.unit_code}?`)) {
            router.delete(`/tools/${selectedTool.id}/units/${unit.id}`, {
                onSuccess: () => {
                    // Reload units
                    handleViewUnits(selectedTool);
                },
            });
        }
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('file', importFile);

        router.post('/tools/import', formDataToSend, {
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

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getPhotoUrl = (tool: Tool) => {
        if (tool.photo) {
            return `/storage/${tool.photo}`;
        }
        return null;
    };

    const getConditionBadge = (condition: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            good: 'default',
            damaged: 'destructive',
            scrapped: 'secondary',
        };
        const labels: Record<string, string> = {
            good: 'Baik',
            damaged: 'Rusak',
            scrapped: 'Rusak Total',
        };
        return (
            <Badge variant={variants[condition] || 'outline'}>
                {labels[condition] || condition}
            </Badge>
        );
    };

    const handlePrintQRSingle = (tool: Tool) => {
        setSelectedToolForQR(tool);
        setQrPrintMode('single');
        setIsQRPrintOpen(true);
    };

    const handlePrintQRAll = async () => {
        setSelectedToolForQR(null);
        setQrPrintMode('all');
        setIsLoadingQR(true);

        try {
            // Build query params with current filters
            const params: Record<string, string> = {};
            if (search) params.search = search;

            const response = await window.axios.get('/tools/for-qr', { params });

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
        if (qrPrintMode === 'single' && selectedToolForQR) {
            // Get all units for this tool
            return (selectedToolForQR.units || []).map(unit => ({
                id: unit.id,
                code: unit.unit_code,
                name: `${selectedToolForQR.name} #${unit.unit_number}`,
                subtitle: selectedToolForQR.location,
            }));
        }
        // Use fetched QR data instead of paginated tools.data
        return qrData.map(item => ({
            id: item.id,
            code: item.unit_code,
            name: `${item.tool.name} #${item.unit_number}`,
            subtitle: item.tool.location,
        }));
    };

    return (
        <DashboardLayout>
            <Head title="Manajemen Alat" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Alat</h1>
                        <p className="text-muted-foreground">
                            Kelola data alat dengan CRUD dan pencarian
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrintQRAll} disabled={isLoadingQR}>
                            <Printer className="mr-2 h-4 w-4" />
                            {isLoadingQR ? 'Memuat...' : 'Cetak Semua QR'}
                        </Button>
                        {currentUser?.role !== 'guru' && (
                            <>
                                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import Excel
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Import Alat dari Excel</DialogTitle>
                                            <DialogDescription>
                                                Upload file Excel dengan format: code, name, location, description. Jumlah unit akan diambil otomatis dari angka ke-5 pada kode alat (contoh: WK.09.03.131.1.2025 → jumlah unit = 1).
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
                                                            window.open('/tools/import/template', '_blank');
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
                                            Tambah Alat
                                        </Button>
                                    </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Tambah Alat Baru</DialogTitle>
                                    <DialogDescription>
                                        Masukkan data alat yang akan ditambahkan
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate}>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Kode Alat</Label>
                                            <Input
                                                id="code"
                                                placeholder="WK.09.03.131.1.2025"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nama Alat</Label>
                                            <Input
                                                id="name"
                                                placeholder="Nama alat"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Lokasi</Label>
                                            <Input
                                                id="location"
                                                placeholder="Lokasi alat"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Catatan</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Jumlah unit akan diambil otomatis dari angka ke-5 pada kode alat. Contoh: WK.09.03.131.1.2025 → jumlah unit = 1
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="photo">Foto</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    id="photo"
                                                    type="file"
                                                    accept="image/*"
                                                    ref={fileInputRef}
                                                    onChange={handlePhotoChange}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <ImageIcon className="mr-2 h-4 w-4" />
                                                    Pilih Foto
                                                </Button>
                                                {photoPreview && (
                                                    <div className="relative">
                                                        <img
                                                            src={photoPreview}
                                                            alt="Preview"
                                                            className="h-20 w-20 object-cover rounded-md"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6"
                                                            onClick={() => {
                                                                setPhotoPreview(null);
                                                                setFormData({ ...formData, photo: null });
                                                                if (fileInputRef.current) {
                                                                    fileInputRef.current.value = '';
                                                                }
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Keterangan</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Keterangan alat (opsional)"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsCreateOpen(false);
                                                setFormData({ code: '', name: '', location: '', photo: null, description: '' });
                                                setPhotoPreview(null);
                                            }}
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
                            </>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pencarian</CardTitle>
                        <CardDescription>
                            Cari alat berdasarkan kode, nama, lokasi, atau keterangan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari alat..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Select value={conditionFilter} onValueChange={handleConditionFilterChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter Kondisi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Kondisi</SelectItem>
                                        <SelectItem value="good">Baik</SelectItem>
                                        <SelectItem value="damaged">Rusak</SelectItem>
                                        <SelectItem value="scrapped">Rusak Total</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                                {(search || conditionFilter !== 'all') && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setConditionFilter('all');
                                            router.get('/tools');
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
                        <CardTitle>Daftar Alat</CardTitle>
                        <CardDescription>
                            Total: {tools.total} alat
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tools.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data alat
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Foto</TableHead>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Lokasi</TableHead>
                                                <TableHead>Total Unit</TableHead>
                                                <TableHead>Jumlah Tersedia</TableHead>
                                                <TableHead>Jumlah Dipinjam</TableHead>
                                                <TableHead>Kondisi</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tools.data.map((tool) => (
                                                <TableRow key={tool.id}>
                                                    <TableCell>
                                                        {getPhotoUrl(tool) ? (
                                                            <img
                                                                src={getPhotoUrl(tool)!}
                                                                alt={tool.name}
                                                                className="h-16 w-16 object-cover rounded-md"
                                                            />
                                                        ) : (
                                                            <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {tool.code}
                                                    </TableCell>
                                                    <TableCell>{tool.name}</TableCell>
                                                    <TableCell>{tool.location}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {tool.total_units || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="default" className="bg-green-500">
                                                            {tool.available_count || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {tool.borrowed_count || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">Baik:</span>
                                                                <Badge variant="default">{tool.good_count || 0}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">Rusak:</span>
                                                                <Badge variant="destructive">{tool.damaged_count || 0}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">Rusak Total:</span>
                                                                <Badge variant="secondary">{tool.scrapped_count || 0}</Badge>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handlePrintQRSingle(tool)}
                                                                title="Cetak QR"
                                                            >
                                                                <QrCode className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewUnits(tool)}
                                                                title="Lihat Unit"
                                                            >
                                                                <Package className="h-4 w-4" />
                                                            </Button>
                                                            {currentUser?.role !== 'guru' && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEdit(tool)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDelete(tool)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {tools.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((tools.current_page - 1) * tools.per_page) + 1} sampai{' '}
                                            {Math.min(tools.current_page * tools.per_page, tools.total)} dari{' '}
                                            {tools.total} alat
                                        </div>
                                        <div className="flex gap-2">
                                            {tools.links.map((link, index) => {
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
                            <DialogTitle>Edit Alat</DialogTitle>
                            <DialogDescription>
                                Perbarui data alat yang dipilih
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_code">Kode Alat</Label>
                                    <Input
                                        id="edit_code"
                                        placeholder="WK.09.03.131.1.2025"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_name">Nama Alat</Label>
                                    <Input
                                        id="edit_name"
                                        placeholder="Nama alat"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_location">Lokasi</Label>
                                    <Input
                                        id="edit_location"
                                        placeholder="Lokasi alat"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_photo">Foto</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="edit_photo"
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            {photoPreview ? 'Ganti Foto' : 'Pilih Foto'}
                                        </Button>
                                        {photoPreview && (
                                            <div className="relative">
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    className="h-20 w-20 object-cover rounded-md"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6"
                                                    onClick={() => {
                                                        setPhotoPreview(null);
                                                        setFormData({ ...formData, photo: null });
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = '';
                                                        }
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_description">Keterangan</Label>
                                    <Textarea
                                        id="edit_description"
                                        placeholder="Keterangan alat (opsional)"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditOpen(false);
                                        setSelectedTool(null);
                                        setFormData({ code: '', name: '', location: '', photo: null, description: '' });
                                        setPhotoPreview(null);
                                    }}
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
                            <DialogTitle>Hapus Alat</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus alat{' '}
                                <strong>{selectedTool?.name}</strong> (Kode: {selectedTool?.code})?
                                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua unit terkait.
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

                {/* View Units Dialog */}
                <Dialog open={isUnitsOpen} onOpenChange={setIsUnitsOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Unit Alat: {selectedTool?.name}</DialogTitle>
                            <DialogDescription>
                                Kode: {selectedTool?.code} | Lokasi: {selectedTool?.location}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => {
                                        setUnitFormData({ condition: 'good', description: '' });
                                        setIsAddUnitOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Unit
                                </Button>
                            </div>
                            
                            {units.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Belum ada unit
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Unit #</TableHead>
                                                <TableHead>Kode Unit</TableHead>
                                                <TableHead>Kondisi</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {units.map((unit) => (
                                                <TableRow key={unit.id}>
                                                    <TableCell className="font-medium">
                                                        #{unit.unit_number}
                                                    </TableCell>
                                                    <TableCell>{unit.unit_code}</TableCell>
                                                    <TableCell>
                                                        {getConditionBadge(unit.condition)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {unit.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {currentUser?.role !== 'guru' && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEditUnit(unit)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteUnit(unit)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUnitsOpen(false)}
                            >
                                Tutup
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Unit Dialog */}
                <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Unit</DialogTitle>
                            <DialogDescription>
                                Tambahkan unit baru untuk alat {selectedTool?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUnit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unit_condition">Kondisi</Label>
                                    <Select
                                        value={unitFormData.condition}
                                        onValueChange={(value: 'good' | 'damaged' | 'scrapped') =>
                                            setUnitFormData({ ...unitFormData, condition: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="good">Baik</SelectItem>
                                            <SelectItem value="damaged">Rusak</SelectItem>
                                            <SelectItem value="scrapped">Rusak Total</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit_description">Keterangan</Label>
                                    <Textarea
                                        id="unit_description"
                                        placeholder="Keterangan unit (opsional)"
                                        value={unitFormData.description}
                                        onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddUnitOpen(false)}
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

                {/* Edit Unit Dialog */}
                <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Unit</DialogTitle>
                            <DialogDescription>
                                Perbarui data unit {selectedUnit?.unit_code}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateUnit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_unit_condition">Kondisi</Label>
                                    <Select
                                        value={unitFormData.condition}
                                        onValueChange={(value: 'good' | 'damaged' | 'scrapped') =>
                                            setUnitFormData({ ...unitFormData, condition: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="good">Baik</SelectItem>
                                            <SelectItem value="damaged">Rusak</SelectItem>
                                            <SelectItem value="scrapped">Rusak Total</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_unit_description">Keterangan</Label>
                                    <Textarea
                                        id="edit_unit_description"
                                        placeholder="Keterangan unit (opsional)"
                                        value={unitFormData.description}
                                        onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditUnitOpen(false);
                                        setSelectedUnit(null);
                                    }}
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

                {/* QR Print Dialog */}
                <QRPrintDialog
                    open={isQRPrintOpen}
                    onOpenChange={setIsQRPrintOpen}
                    items={getQRItems()}
                    title={qrPrintMode === 'single'
                        ? `Cetak QR - ${selectedToolForQR?.name || ''}`
                        : 'Cetak QR Semua Alat'}
                    description={qrPrintMode === 'single'
                        ? `QR Code untuk ${selectedToolForQR?.total_units || 0} unit alat`
                        : `Cetak QR Code untuk ${qrData.length} unit alat`}
                    type="tool"
                />
            </div>
        </DashboardLayout>
    );
}
