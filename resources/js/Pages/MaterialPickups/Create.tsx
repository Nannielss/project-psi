import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, X, Image as ImageIcon, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Camera, Package } from 'lucide-react';
import { PageProps, Material, Teacher } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';

interface MaterialPickupsCreatePageProps extends PageProps {
    materials: {
        data: Material[];
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

export default function Create({ materials, filters }: MaterialPickupsCreatePageProps) {
    const { flash, auth } = usePage<MaterialPickupsCreatePageProps>().props;
    const currentUser = auth?.user;
    const isGuru = currentUser?.role === 'guru';

    // Search state
    const [search, setSearch] = useState(filters.search || '');

    // CRUD states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [formData, setFormData] = useState({
        nama_bahan: '',
        stok: 0,
        satuan: '',
        foto: null as File | null,
        keterangan: '',
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pickup modal states
    const [isPickupOpen, setIsPickupOpen] = useState(false);
    const [pickupStep, setPickupStep] = useState(1);
    const [selectedMaterialForPickup, setSelectedMaterialForPickup] = useState<Material | null>(null);
    const [verifiedTeacher, setVerifiedTeacher] = useState<Teacher | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [pickupFormData, setPickupFormData] = useState({
        jumlah: 1,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: '',
    });
    const [isSubmittingPickup, setIsSubmittingPickup] = useState(false);

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/material-pickups/create', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // CRUD handlers
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const formDataToSend = new FormData();
        formDataToSend.append('nama_bahan', formData.nama_bahan);
        formDataToSend.append('stok', formData.stok.toString());
        formDataToSend.append('satuan', formData.satuan);
        formDataToSend.append('keterangan', formData.keterangan || '');
        if (formData.foto) {
            formDataToSend.append('foto', formData.foto);
        }

        router.post('/material-pickups/materials', formDataToSend, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ nama_bahan: '', stok: 0, satuan: '', foto: null, keterangan: '' });
                setPhotoPreview(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (material: Material) => {
        setSelectedMaterial(material);
        setFormData({
            nama_bahan: material.nama_bahan,
            stok: material.stok,
            satuan: material.satuan,
            foto: null,
            keterangan: material.keterangan || '',
        });
        setPhotoPreview(material.foto ? `/storage/${material.foto}` : null);
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterial) return;
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('nama_bahan', formData.nama_bahan);
        formDataToSend.append('stok', formData.stok.toString());
        formDataToSend.append('satuan', formData.satuan);
        formDataToSend.append('keterangan', formData.keterangan || '');
        if (formData.foto) {
            formDataToSend.append('foto', formData.foto);
        }

        router.put(`/material-pickups/materials/${selectedMaterial.id}`, formDataToSend, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedMaterial(null);
                setFormData({ nama_bahan: '', stok: 0, satuan: '', foto: null, keterangan: '' });
                setPhotoPreview(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = (material: Material) => {
        setSelectedMaterial(material);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedMaterial) return;
        router.delete(`/material-pickups/materials/${selectedMaterial.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedMaterial(null);
            },
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, foto: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getPhotoUrl = (material: Material) => {
        if (material.foto) {
            return `/storage/${material.foto}`;
        }
        return null;
    };

    // Pickup handlers
    const handleOpenPickupModal = (material: Material) => {
        setSelectedMaterialForPickup(material);
        setVerifiedTeacher(null);
        setPickupStep(1);
        setPickupFormData({
            jumlah: 1,
            tanggal: new Date().toISOString().split('T')[0],
            keterangan: '',
        });
        setVerificationError('');
        setIsPickupOpen(true);
    };

    const handleVerifyQR = async (nipToVerify?: string) => {
        const nipValue = nipToVerify || '';
        if (!nipValue) {
            setVerificationError('NIP tidak valid');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            const response = await axios.post('/material-pickups/verify-qr', { nip: nipValue });
            if (response.data.success) {
                setVerifiedTeacher(response.data.teacher);
                setPickupStep(2);
                toast.success('Identitas guru berhasil diverifikasi');
            }
        } catch (error: any) {
            setVerificationError(
                error.response?.data?.message || 'Guru dengan NIP tersebut tidak ditemukan'
            );
            setVerifiedTeacher(null);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleQRScanSuccess = (decodedText: string) => {
        handleVerifyQR(decodedText);
    };

    const handleQRScanError = (error: string) => {
        toast.error(error);
    };

    const handlePickupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedTeacher || !selectedMaterialForPickup) {
            toast.error('Verifikasi identitas guru terlebih dahulu');
            return;
        }

        if (selectedMaterialForPickup.stok < pickupFormData.jumlah) {
            toast.error(`Stok tidak mencukupi. Stok tersedia: ${selectedMaterialForPickup.stok}`);
            return;
        }

        setIsSubmittingPickup(true);

        router.post('/material-pickups', {
            material_id: selectedMaterialForPickup.id,
            teacher_id: verifiedTeacher.id,
            jumlah: pickupFormData.jumlah,
            keterangan: pickupFormData.keterangan || undefined,
        }, {
            onSuccess: () => {
                toast.success('Pengambilan bahan berhasil dicatat');
                setIsPickupOpen(false);
                setPickupStep(1);
                setVerifiedTeacher(null);
                setSelectedMaterialForPickup(null);
                setPickupFormData({
                    jumlah: 1,
                    tanggal: new Date().toISOString().split('T')[0],
                    keterangan: '',
                });
            },
            onError: (errors) => {
                setIsSubmittingPickup(false);
                if (errors.jumlah) {
                    toast.error(errors.jumlah);
                } else {
                    toast.error('Terjadi kesalahan saat menyimpan data');
                }
            },
        });
    };

    const resetPickupModal = () => {
        setIsPickupOpen(false);
        setPickupStep(1);
        setVerifiedTeacher(null);
        setSelectedMaterialForPickup(null);
        setVerificationError('');
        setPickupFormData({
            jumlah: 1,
            tanggal: new Date().toISOString().split('T')[0],
            keterangan: '',
        });
    };

    return (
        <DashboardLayout>
            <Head title="Ambil Bahan" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ambil Bahan</h1>
                        <p className="text-muted-foreground">
                            Daftar bahan dan catat pengambilan bahan
                        </p>
                    </div>
                    {!isGuru && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Bahan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Tambah Bahan Baru</DialogTitle>
                                    <DialogDescription>
                                        Masukkan data bahan yang akan ditambahkan
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate}>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nama_bahan">Nama Bahan</Label>
                                            <Input
                                                id="nama_bahan"
                                                placeholder="Nama bahan"
                                                value={formData.nama_bahan}
                                                onChange={(e) => setFormData({ ...formData, nama_bahan: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="stok">Stok</Label>
                                                <Input
                                                    id="stok"
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={formData.stok}
                                                    onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="satuan">Satuan</Label>
                                                <Input
                                                    id="satuan"
                                                    placeholder="pcs, kg, liter, dll"
                                                    value={formData.satuan}
                                                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="foto">Foto</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    id="foto"
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
                                                                setFormData({ ...formData, foto: null });
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
                                            <Label htmlFor="keterangan">Keterangan</Label>
                                            <Textarea
                                                id="keterangan"
                                                placeholder="Keterangan bahan (opsional)"
                                                value={formData.keterangan}
                                                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
                                                setFormData({ nama_bahan: '', stok: 0, satuan: '', foto: null, keterangan: '' });
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
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pencarian</CardTitle>
                        <CardDescription>
                            Cari bahan berdasarkan nama atau keterangan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari bahan..."
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
                                            router.get('/material-pickups/create');
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
                        <CardTitle>Daftar Bahan</CardTitle>
                        <CardDescription>
                            Total: {materials.total} bahan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {materials.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data bahan
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Foto</TableHead>
                                                <TableHead>Nama Bahan</TableHead>
                                                <TableHead>Stok</TableHead>
                                                <TableHead>Satuan</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {materials.data.map((material) => (
                                                <TableRow key={material.id}>
                                                    <TableCell>
                                                        {getPhotoUrl(material) ? (
                                                            <img
                                                                src={getPhotoUrl(material)!}
                                                                alt={material.nama_bahan}
                                                                className="h-16 w-16 object-cover rounded-md"
                                                            />
                                                        ) : (
                                                            <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {material.nama_bahan}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={material.stok > 0 ? 'default' : 'destructive'}>
                                                            {material.stok}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{material.satuan}</TableCell>
                                                    <TableCell>
                                                        {material.keterangan || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleOpenPickupModal(material)}
                                                                disabled={material.stok === 0}
                                                            >
                                                                <Package className="mr-2 h-4 w-4" />
                                                                Ambil Bahan
                                                            </Button>
                                                            {!isGuru && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEdit(material)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDelete(material)}
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

                                {materials.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((materials.current_page - 1) * materials.per_page) + 1} sampai{' '}
                                            {Math.min(materials.current_page * materials.per_page, materials.total)} dari{' '}
                                            {materials.total} bahan
                                        </div>
                                        <div className="flex gap-2">
                                            {materials.links.map((link, index) => {
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
                {!isGuru && (
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Bahan</DialogTitle>
                                <DialogDescription>
                                    Perbarui data bahan yang dipilih
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdate}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_nama_bahan">Nama Bahan</Label>
                                        <Input
                                            id="edit_nama_bahan"
                                            placeholder="Nama bahan"
                                            value={formData.nama_bahan}
                                            onChange={(e) => setFormData({ ...formData, nama_bahan: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_stok">Stok</Label>
                                            <Input
                                                id="edit_stok"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={formData.stok}
                                                onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_satuan">Satuan</Label>
                                            <Input
                                                id="edit_satuan"
                                                placeholder="pcs, kg, liter, dll"
                                                value={formData.satuan}
                                                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_foto">Foto</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="edit_foto"
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
                                                            setFormData({ ...formData, foto: null });
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
                                        <Label htmlFor="edit_keterangan">Keterangan</Label>
                                        <Textarea
                                            id="edit_keterangan"
                                            placeholder="Keterangan bahan (opsional)"
                                            value={formData.keterangan}
                                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
                                            setSelectedMaterial(null);
                                            setFormData({ nama_bahan: '', stok: 0, satuan: '', foto: null, keterangan: '' });
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
                )}

                {/* Delete Dialog */}
                {!isGuru && (
                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Hapus Bahan</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus bahan{' '}
                                    <strong>{selectedMaterial?.nama_bahan}</strong>?
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
                )}

                {/* Pickup Modal */}
                <Dialog open={isPickupOpen} onOpenChange={resetPickupModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Ambil Bahan</DialogTitle>
                            <DialogDescription>
                                {pickupStep === 1
                                    ? 'Scan QR code guru untuk verifikasi identitas'
                                    : 'Konfirmasi pengambilan bahan'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-4 py-4">
                            <div className={`flex items-center gap-2 ${pickupStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                    pickupStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                                }`}>
                                    {pickupStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                                </div>
                                <span className="font-medium">Verifikasi</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className={`flex items-center gap-2 ${pickupStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                    pickupStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                                }`}>
                                    2
                                </div>
                                <span className="font-medium">Konfirmasi</span>
                            </div>
                        </div>

                        {/* Step 1: Verify Teacher */}
                        {pickupStep === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Scan QR Code Guru</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsScannerOpen(true)}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Buka Scanner QR Code
                                    </Button>
                                </div>

                                {verificationError && (
                                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">{verificationError}</span>
                                    </div>
                                )}

                                {verifiedTeacher && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900 dark:text-green-100">
                                                Identitas Terverifikasi
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {verifiedTeacher.name} (NIP: {verifiedTeacher.nip})
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Confirm Pickup */}
                        {pickupStep === 2 && verifiedTeacher && selectedMaterialForPickup && (
                            <form onSubmit={handlePickupSubmit} className="space-y-4">
                                <div className="p-3 bg-muted rounded-md space-y-2">
                                    <p className="text-sm font-medium">Guru: {verifiedTeacher.name}</p>
                                    <p className="text-xs text-muted-foreground">NIP: {verifiedTeacher.nip}</p>
                                    {verifiedTeacher.subjects && verifiedTeacher.subjects.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {verifiedTeacher.subjects.map((subject) => (
                                                <Badge key={subject.id} variant="secondary" className="text-xs">
                                                    {subject.nama}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-muted rounded-md space-y-2">
                                    <p className="text-sm font-medium">Bahan: {selectedMaterialForPickup.nama_bahan}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Stok tersedia: {selectedMaterialForPickup.stok} {selectedMaterialForPickup.satuan}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jumlah">Jumlah</Label>
                                    <Input
                                        id="jumlah"
                                        type="number"
                                        min="1"
                                        max={selectedMaterialForPickup.stok}
                                        value={pickupFormData.jumlah}
                                        onChange={(e) => setPickupFormData({ ...pickupFormData, jumlah: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                    <div className="text-sm text-muted-foreground">
                                        Satuan: {selectedMaterialForPickup.satuan}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tanggal">Tanggal</Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={pickupFormData.tanggal}
                                        onChange={(e) => setPickupFormData({ ...pickupFormData, tanggal: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="keterangan_pickup">Keterangan / Keperluan (Opsional)</Label>
                                    <Textarea
                                        id="keterangan_pickup"
                                        placeholder="Keterangan atau keperluan pengambilan bahan"
                                        value={pickupFormData.keterangan}
                                        onChange={(e) => setPickupFormData({ ...pickupFormData, keterangan: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setPickupStep(1)}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingPickup || !pickupFormData.jumlah}
                                    >
                                        {isSubmittingPickup ? 'Menyimpan...' : 'Simpan Pengambilan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* QR Scanner Dialog */}
                <QRScanner
                    open={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={handleQRScanSuccess}
                    onScanError={handleQRScanError}
                />
            </div>
        </DashboardLayout>
    );
}
