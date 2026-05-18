import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PageProps, User } from '@/types';
import { toast } from 'sonner';

type InventoryRole = 'admin' | 'petugas' | 'kasir';

interface UsersPageProps extends PageProps {
    users: {
        data: User[];
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
        role?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

const roleOptions: InventoryRole[] = ['admin', 'petugas', 'kasir'];

function getRoleLabel(role: string | undefined) {
    if (role === 'admin') return 'Admin';
    if (role === 'petugas') return 'Petugas Gudang';
    if (role === 'kasir') return 'Kasir';
    return 'Tanpa Role';
}

function getRoleBadgeClass(role: string | undefined) {
    if (role === 'admin') return 'vk-role-admin';
    if (role === 'petugas') return 'vk-role-petugas';
    if (role === 'kasir') return 'vk-role-kasir';
    return 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700';
}

export default function Index({ users, filters }: UsersPageProps) {
    const { flash, auth } = usePage<UsersPageProps>().props;
    const currentUser = auth?.user;
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: '' as InventoryRole | '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            username: '',
            password: '',
            role: '',
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        router.get('/users', {
            search: search || undefined,
            role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/users', formData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                resetForm();
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            username: user.username,
            password: '',
            role: (user.role as InventoryRole) || '',
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setIsSubmitting(true);

        router.put(`/users/${selectedUser.id}`, formData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedUser(null);
                resetForm();
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedUser) return;

        router.delete(`/users/${selectedUser.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedUser(null);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen User" />

            <div className="space-y-6">
                <section className="vk-card overflow-hidden">
                    <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_240px] md:px-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                Access Control
                            </p>
                            <h1 className="mt-2 vk-page-title">Manajemen User</h1>
                            <p className="mt-3 max-w-2xl vk-page-copy">
                                Atur akun admin, petugas gudang, dan kasir agar setiap akses sistem tetap rapi dan terkontrol.
                            </p>
                        </div>

                        <div className="vk-soft-panel flex items-center gap-4 px-5 py-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Akses Aman</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Hanya admin yang bisa membuka modul ini.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <CardTitle>Daftar Pengguna</CardTitle>
                                        <CardDescription>
                                            Total {users.total} akun aktif dalam sistem inventori.
                                        </CardDescription>
                                    </div>

                                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="rounded-xl">
                                                Tambah User
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[28px] border-white/80 bg-white/95">
                                            <DialogHeader>
                                                <DialogTitle>Tambah User Baru</DialogTitle>
                                                <DialogDescription>
                                                    Buat akun baru untuk admin, petugas gudang, atau kasir.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreate} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Nama Lengkap</Label>
                                                    <Input id="name" placeholder="Nama pengguna" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" type="email" placeholder="email@perusahaan.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="username">Username</Label>
                                                    <Input id="username" placeholder="Username login" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="password">Password</Label>
                                                    <Input id="password" type="password" placeholder="Minimal 8 karakter" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="role">Role</Label>
                                                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as InventoryRole })} required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roleOptions.map((role) => (
                                                                <SelectItem key={role} value={role}>
                                                                    {getRoleLabel(role)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                                        Batal
                                                    </Button>
                                                    <Button type="submit" disabled={isSubmitting}>
                                                        {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px_auto_auto]">
                                    <div className="relative">
                                        <Input placeholder="Cari nama, username, atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                                    </div>
                                    <Select value={roleFilter || 'all'} onValueChange={(value) => setRoleFilter(value === 'all' ? '' : value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Role</SelectItem>
                                            {roleOptions.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {getRoleLabel(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit">Filter</Button>
                                    {(search || roleFilter) && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setSearch('');
                                                setRoleFilter('');
                                                router.get('/users', {}, { preserveState: true, replace: true });
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </form>

                                {users.data.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        Belum ada data user yang cocok dengan filter saat ini.
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 dark:border-slate-800">
                                            <Table>
                                                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/90">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="px-5 text-slate-500 dark:text-slate-400">Pengguna</TableHead>
                                                        <TableHead className="text-slate-500 dark:text-slate-400">Kontak</TableHead>
                                                        <TableHead className="text-slate-500 dark:text-slate-400">Role</TableHead>
                                                        <TableHead className="text-slate-500 dark:text-slate-400">Dibuat</TableHead>
                                                        <TableHead className="px-5 text-right text-slate-500 dark:text-slate-400">Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {users.data.map((user) => (
                                                        <TableRow key={user.id} className="border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/65">
                                                            <TableCell className="px-5 py-4">
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name || user.username}</p>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-slate-600 dark:text-slate-400">{user.email || '-'}</TableCell>
                                                            <TableCell className="py-4">
                                                                <Badge className={getRoleBadgeClass(user.role)}>
                                                                    {getRoleLabel(user.role)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-slate-600 dark:text-slate-400">
                                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                                                            </TableCell>
                                                            <TableCell className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(user)}
                                                                        disabled={currentUser?.id === user.id}
                                                                        className="rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
                                                                    >
                                                                        Hapus
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {users.last_page > 1 && (
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Menampilkan {((users.current_page - 1) * users.per_page) + 1} sampai {Math.min(users.current_page * users.per_page, users.total)} dari {users.total} user
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {users.links.map((link, index) => {
                                                        if (!link.url) {
                                                            return (
                                                                <span key={index} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                                                            );
                                                        }

                                                        return (
                                                            <Link
                                                                key={index}
                                                                href={link.url}
                                                                className={`rounded-xl border px-3 py-2 text-sm transition ${
                                                                    link.active
                                                                        ? 'border-primary bg-primary text-white shadow-sm'
                                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50'
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
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-200/80 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    Ringkasan Role
                                </CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">
                                    Distribusi akun berdasarkan fungsi operasional.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {roleOptions.map((role) => (
                                    <div key={role} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/80 px-4 py-3">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{getRoleLabel(role)}</span>
                                        <Badge className={getRoleBadgeClass(role)}>
                                            {users.data.filter((user) => user.role === role).length}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/80 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    Catatan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Akun `petugas` dipakai untuk operasional gudang, sedangkan `kasir` dipakai untuk transaksi penjualan. Admin dapat mengelola seluruh modul.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="rounded-[28px] border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95">
                        <DialogHeader>
                            <DialogTitle className="text-slate-800 dark:text-slate-100">Edit User</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                Perbarui data akun pengguna yang dipilih.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name">Nama Lengkap</Label>
                                <Input id="edit_name" placeholder="Nama pengguna" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_email">Email</Label>
                                <Input id="edit_email" type="email" placeholder="email@perusahaan.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_username">Username</Label>
                                <Input id="edit_username" placeholder="Username login" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_password">Password Baru</Label>
                                <Input id="edit_password" type="password" placeholder="Kosongkan jika tidak ingin mengubah password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} minLength={8} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_role">Role</Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as InventoryRole })} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {getRoleLabel(role)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="rounded-[28px] border-white/80 bg-white/95">
                        <DialogHeader>
                            <DialogTitle>Hapus User</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus akun <strong>{selectedUser?.username}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                Batal
                            </Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete}>
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    );
}
