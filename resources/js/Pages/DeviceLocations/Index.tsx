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
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, X, MapPin, Eye, EyeOff } from 'lucide-react';
import { PageProps, DeviceLocation } from '@/types';
import { toast } from 'sonner';

interface DeviceLocationsPageProps extends PageProps {
    locations: {
        data: DeviceLocation[];
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
        is_active?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ locations, filters }: DeviceLocationsPageProps) {
    const { flash } = usePage<DeviceLocationsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isActiveFilter, setIsActiveFilter] = useState(filters.is_active || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<DeviceLocation | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

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
        router.get('/device-locations', {
            search: search || undefined,
            is_active: isActiveFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/device-locations', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ name: '', password: '', is_active: true });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (location: DeviceLocation) => {
        setSelectedLocation(location);
        setFormData({
            name: location.name,
            password: '', // Don't pre-fill password
            is_active: location.is_active,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocation) return;

        setIsSubmitting(true);
        const updateData: { name: string; is_active: boolean; password?: string } = {
            name: formData.name,
            is_active: formData.is_active,
        };
        
        // Only include password if it's provided
        if (formData.password) {
            updateData.password = formData.password;
        }

        router.put(`/device-locations/${selectedLocation.id}`, updateData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedLocation(null);
                setFormData({ name: '', password: '', is_active: true });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedLocation) return;

        setIsSubmitting(true);
        router.delete(`/device-locations/${selectedLocation.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedLocation(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const openDeleteDialog = (location: DeviceLocation) => {
        setSelectedLocation(location);
        setIsDeleteOpen(true);
    };

    return (
        <DashboardLayout>
            <Head title="Kelola Lokasi Device" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Kelola Lokasi Device</h1>
                        <p className="text-muted-foreground">
                            Kelola lokasi device untuk sistem peminjaman alat
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Lokasi
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Lokasi Device</DialogTitle>
                                <DialogDescription>
                                    Tambahkan lokasi device baru dengan nama dan password
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lokasi</Label>
                                        <Input
                                            id="name"
                                            placeholder="Contoh: Gedung A, Lab 1"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Masukkan password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={4}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Password minimal 4 karakter
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                        />
                                        <Label htmlFor="is_active">Aktif</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreateOpen(false);
                                            setFormData({ name: '', password: '', is_active: true });
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
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter & Pencarian</CardTitle>
                        <CardDescription>
                            Cari lokasi berdasarkan nama atau status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="search">Cari</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="search"
                                            placeholder="Cari berdasarkan nama lokasi"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="submit" size="icon">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="is_active">Status</Label>
                                    <select
                                        id="is_active"
                                        value={isActiveFilter}
                                        onChange={(e) => setIsActiveFilter(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Semua</option>
                                        <option value="true">Aktif</option>
                                        <option value="false">Tidak Aktif</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Lokasi Device</CardTitle>
                        <CardDescription>
                            Total: {locations.total} lokasi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {locations.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data lokasi device
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Lokasi</TableHead>
                                                <TableHead>Password</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Tanggal Dibuat</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {locations.data.map((location) => (
                                                <TableRow key={location.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{location.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {location.plain_password ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm">
                                                                    {showPasswords[location.id] ? location.plain_password : '••••••••'}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPasswords(prev => ({
                                                                        ...prev,
                                                                        [location.id]: !prev[location.id]
                                                                    }))}
                                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                                >
                                                                    {showPasswords[location.id] ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {location.is_active ? (
                                                            <Badge variant="default">Aktif</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Tidak Aktif</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(location.created_at).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEdit(location)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => openDeleteDialog(location)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Hapus
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {locations.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((locations.current_page - 1) * locations.per_page) + 1} sampai{' '}
                                            {Math.min(locations.current_page * locations.per_page, locations.total)} dari{' '}
                                            {locations.total} lokasi
                                        </div>
                                        <div className="flex gap-2">
                                            {locations.links.map((link, index) => {
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
                            <DialogTitle>Edit Lokasi Device</DialogTitle>
                            <DialogDescription>
                                Ubah informasi lokasi device
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nama Lokasi</Label>
                                    <Input
                                        id="edit-name"
                                        placeholder="Contoh: Gedung A, Lab 1"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-password">Password Baru (Opsional)</Label>
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        placeholder="Kosongkan jika tidak ingin mengubah password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        minLength={4}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Kosongkan jika tidak ingin mengubah password. Minimal 4 karakter jika diisi.
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="edit-is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="edit-is_active">Aktif</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditOpen(false);
                                        setSelectedLocation(null);
                                        setFormData({ name: '', password: '', is_active: true });
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

                {/* Delete Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Lokasi Device</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus lokasi "{selectedLocation?.name}"?
                                <br />
                                <span className="text-destructive font-semibold">
                                    Tindakan ini tidak dapat dibatalkan.
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteOpen(false);
                                    setSelectedLocation(null);
                                }}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}