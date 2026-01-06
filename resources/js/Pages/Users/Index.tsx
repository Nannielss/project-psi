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
import { PageProps, User, Teacher } from '@/types';
import { toast } from 'sonner';

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
    teachers: Teacher[];
    filters: {
        search?: string;
        role?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ users, teachers, filters }: UsersPageProps) {
    const { flash, auth } = usePage<UsersPageProps>().props;
    const currentUser = auth?.user;
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: '' as 'admin' | 'kajur' | 'wakajur' | 'guru' | '',
        teacher_id: '',
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
        router.get('/users', {
            search: search || undefined,
            role: roleFilter && roleFilter !== "all" ? roleFilter : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const submitData: any = {
            username: formData.username,
            password: formData.password,
            role: formData.role,
        };
        const rolesCanLinkTeacher = ['guru', 'kajur', 'wakajur'];
        if (rolesCanLinkTeacher.includes(formData.role) && formData.teacher_id) {
            submitData.teacher_id = formData.teacher_id;
        }
        router.post('/users', submitData, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ username: '', password: '', role: '', teacher_id: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEdit = (user: User) => {
        // Prevent non-admin from editing admin users
        if (user.role === 'admin' && currentUser?.role !== 'admin') {
            toast.error('Hanya admin yang dapat mengedit user dengan role admin.');
            return;
        }
        
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: (user.role as 'admin' | 'kajur' | 'wakajur' | 'guru') || '',
            teacher_id: (user as any).teacher_id?.toString() || '',
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);
        
        // Only include password if it's not empty
        const updateData: any = {
            username: formData.username,
            role: formData.role,
        };
        if (formData.password) {
            updateData.password = formData.password;
        }
        const rolesCanLinkTeacher = ['guru', 'kajur', 'wakajur'];
        if (rolesCanLinkTeacher.includes(formData.role)) {
            updateData.teacher_id = formData.teacher_id || null;
        } else {
            updateData.teacher_id = null;
        }

        router.put(`/users/${selectedUser.id}`, updateData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedUser(null);
                setFormData({ username: '', password: '', role: '', teacher_id: '' });
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
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

    const getRoleBadgeVariant = (role: string | undefined) => {
        if (role === 'admin') return 'default';
        if (role === 'kajur') return 'default';
        if (role === 'wakajur') return 'default';
        if (role === 'guru') return 'secondary';
        return 'outline';
    };

    const getRoleLabel = (role: string | undefined) => {
        if (role === 'admin') return 'Admin';
        if (role === 'kajur') return 'Kepala Jurusan';
        if (role === 'wakajur') return 'Wakil Kepala Jurusan';
        if (role === 'guru') return 'Guru';
        return 'Tidak Ada Role';
    };

    const canCreateRoleAdmin = currentUser?.role === 'admin';
    const canCreateRoleKajur = currentUser?.role !== 'wakajur';
    
    let availableRoles = ['kajur', 'wakajur', 'guru'];
    if (canCreateRoleAdmin) {
        availableRoles = ['admin', ...availableRoles];
    }
    if (!canCreateRoleKajur) {
        availableRoles = availableRoles.filter(role => role !== 'kajur');
    }

    return (
        <DashboardLayout>
            <Head title="Manajemen User" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
                        <p className="text-muted-foreground">
                            Kelola user yang dapat login ke sistem dengan username dan password
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah User Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan data user yang akan ditambahkan
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            placeholder="Username untuk login"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Minimal 8 karakter"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => {
                                                const newRole = value as 'admin' | 'kajur' | 'wakajur' | 'guru';
                                                const rolesCanLinkTeacher = ['guru', 'kajur', 'wakajur'];
                                                setFormData({ 
                                                    ...formData, 
                                                    role: newRole,
                                                    teacher_id: rolesCanLinkTeacher.includes(newRole) ? formData.teacher_id : ''
                                                });
                                            }}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRoles.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {getRoleLabel(role)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {(formData.role === 'guru' || formData.role === 'kajur' || formData.role === 'wakajur') && (
                                        <div className="space-y-2">
                                            <Label htmlFor="teacher_id">Link Guru</Label>
                                            <Select
                                                value={formData.teacher_id}
                                                onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                                                required={formData.role === 'guru'}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Guru" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map((teacher) => (
                                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                            {teacher.name} ({teacher.nip})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {formData.role === 'guru' 
                                                    ? 'Pilih guru yang akan di-link dengan user ini (wajib)'
                                                    : 'Pilih guru yang akan di-link dengan user ini (opsional)'}
                                            </p>
                                        </div>
                                    )}
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
                            Cari user berdasarkan username atau filter berdasarkan role
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari username..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Select
                                    value={roleFilter || "all"}
                                    onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Semua Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Role</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="kajur">Kepala Jurusan</SelectItem>
                                        <SelectItem value="wakajur">Wakil Kepala Jurusan</SelectItem>
                                        <SelectItem value="guru">Guru</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                                {(search || roleFilter) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setRoleFilter('');
                                            router.get('/users', {}, {
                                                preserveState: true,
                                                replace: true,
                                            });
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
                        <CardTitle>Daftar User</CardTitle>
                        <CardDescription>
                            Total: {users.total} user
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data user
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Username</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Guru Terkait</TableHead>
                                                <TableHead>Tanggal Dibuat</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.data.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">
                                                        {user.username}
                                                        {currentUser?.id === user.id && (
                                                            <Badge variant="outline" className="ml-2">
                                                                Anda
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                                            {getRoleLabel(user.role)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(user as any).teacher ? (
                                                            <span className="text-sm">
                                                                {(user as any).teacher.name} ({(user as any).teacher.nip})
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(user)}
                                                                disabled={user.role === 'admin' && currentUser?.role !== 'admin'}
                                                                title={user.role === 'admin' && currentUser?.role !== 'admin' ? 'Hanya admin yang dapat mengedit user admin' : 'Edit'}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(user)}
                                                                disabled={currentUser?.id === user.id || (user.role === 'admin' && currentUser?.role !== 'admin')}
                                                                title={
                                                                    currentUser?.id === user.id 
                                                                        ? 'Tidak dapat menghapus akun sendiri' 
                                                                        : user.role === 'admin' && currentUser?.role !== 'admin'
                                                                        ? 'Hanya admin yang dapat menghapus user admin'
                                                                        : 'Hapus'
                                                                }
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

                                {users.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((users.current_page - 1) * users.per_page) + 1} sampai{' '}
                                            {Math.min(users.current_page * users.per_page, users.total)} dari{' '}
                                            {users.total} user
                                        </div>
                                        <div className="flex gap-2">
                                            {users.links.map((link, index) => {
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
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Perbarui data user yang dipilih. Kosongkan password jika tidak ingin mengubahnya.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_username">Username</Label>
                                    <Input
                                        id="edit_username"
                                        placeholder="Username untuk login"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_password">Password</Label>
                                    <Input
                                        id="edit_password"
                                        type="password"
                                        placeholder="Kosongkan jika tidak ingin mengubah password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        minLength={8}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimal 8 karakter jika ingin mengubah password
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_role">Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => {
                                            const newRole = value as 'admin' | 'kajur' | 'wakajur' | 'guru';
                                            const rolesCanLinkTeacher = ['guru', 'kajur', 'wakajur'];
                                            setFormData({ 
                                                ...formData, 
                                                role: newRole,
                                                teacher_id: rolesCanLinkTeacher.includes(newRole) ? formData.teacher_id : ''
                                            });
                                        }}
                                        required
                                        disabled={selectedUser?.role === 'admin' && currentUser?.role !== 'admin'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {getRoleLabel(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedUser?.role === 'admin' && currentUser?.role !== 'admin' && (
                                        <p className="text-xs text-muted-foreground">
                                            Role tidak dapat diubah untuk user admin
                                        </p>
                                    )}
                                </div>
                                {(formData.role === 'guru' || formData.role === 'kajur' || formData.role === 'wakajur') && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_teacher_id">Link Guru</Label>
                                        <Select
                                            value={formData.teacher_id}
                                            onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                                            required={formData.role === 'guru'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Guru" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                        {teacher.name} ({teacher.nip})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {formData.role === 'guru' 
                                                ? 'Pilih guru yang akan di-link dengan user ini (wajib)'
                                                : 'Pilih guru yang akan di-link dengan user ini (opsional)'}
                                        </p>
                                    </div>
                                )}
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
                            <DialogTitle>Hapus User</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus user{' '}
                                <strong>{selectedUser?.username}</strong>?
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

