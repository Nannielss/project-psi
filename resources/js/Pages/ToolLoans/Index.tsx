import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Eye } from 'lucide-react';
import { PageProps, ToolLoan } from '@/types';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ToolLoansPageProps extends PageProps {
    loans: {
        data: ToolLoan[];
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
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ loans, filters }: ToolLoansPageProps) {
    const { flash } = usePage<ToolLoansPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedLoan, setSelectedLoan] = useState<ToolLoan | null>(null);
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [photoType, setPhotoType] = useState<'borrow' | 'return'>('borrow');

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
        router.get('/tool-loans/admin', {
            search: search || undefined,
            status: status || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/tool-loans/admin');
    };

    const getStatusBadge = (loanStatus: string) => {
        if (loanStatus === 'borrowed') {
            return <Badge variant="default">Dipinjam</Badge>;
        }
        return <Badge variant="secondary">Dikembalikan</Badge>;
    };

    const getConditionBadge = (condition?: string) => {
        if (!condition) return null;
        const labels: Record<string, string> = {
            good: 'Baik',
            damaged: 'Rusak',
            service: 'Perlu Service',
        };
        const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
            good: 'default',
            damaged: 'destructive',
            service: 'secondary',
        };
        return (
            <Badge variant={variants[condition]}>
                {labels[condition]}
            </Badge>
        );
    };

    const openPhotoDialog = (loan: ToolLoan, type: 'borrow' | 'return') => {
        setSelectedLoan(loan);
        setPhotoType(type);
        setPhotoDialogOpen(true);
    };

    return (
        <DashboardLayout>
            <Head title="Riwayat Peminjaman Alat" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Riwayat Peminjaman Alat</h1>
                        <p className="text-muted-foreground">
                            Daftar semua peminjaman dan pengembalian alat yang telah dicatat
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter & Pencarian</CardTitle>
                        <CardDescription>
                            Cari riwayat berdasarkan siswa, alat, status, atau tanggal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="search">Cari</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="search"
                                            placeholder="Cari berdasarkan NIS, nama siswa, atau kode alat"
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
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="borrowed">Dipinjam</SelectItem>
                                            <SelectItem value="returned">Dikembalikan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="date_from">Dari Tanggal</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date_to">Sampai Tanggal</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                            {(search || status || dateFrom || dateTo) && (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleReset}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Riwayat</CardTitle>
                        <CardDescription>
                            Total: {loans.total} peminjaman
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loans.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data peminjaman alat
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tanggal Pinjam</TableHead>
                                                <TableHead>Siswa</TableHead>
                                                <TableHead>Alat</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Tanggal Kembali</TableHead>
                                                <TableHead>Kondisi Kembali</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loans.data.map((loan) => (
                                                <TableRow key={loan.id}>
                                                    <TableCell>
                                                        {new Date(loan.borrowed_at).toLocaleString('id-ID', {
                                                            dateStyle: 'short',
                                                            timeStyle: 'short',
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {loan.student?.name || '-'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                NIS: {loan.student?.nis || '-'}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {loan.tool_unit?.tool?.name || '-'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Unit: {loan.tool_unit?.unit_code || '-'}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(loan.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {loan.returned_at
                                                            ? new Date(loan.returned_at).toLocaleString('id-ID', {
                                                                dateStyle: 'short',
                                                                timeStyle: 'short',
                                                            })
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getConditionBadge(loan.return_condition)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            {loan.borrow_photo && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openPhotoDialog(loan, 'borrow')}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    Foto Pinjam
                                                                </Button>
                                                            )}
                                                            {loan.return_photo && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openPhotoDialog(loan, 'return')}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    Foto Kembali
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {loans.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((loans.current_page - 1) * loans.per_page) + 1} sampai{' '}
                                            {Math.min(loans.current_page * loans.per_page, loans.total)} dari{' '}
                                            {loans.total} peminjaman
                                        </div>
                                        <div className="flex gap-2">
                                            {loans.links.map((link, index) => {
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

                {/* Photo Dialog */}
                <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {photoType === 'borrow' ? 'Foto Saat Peminjaman' : 'Foto Saat Pengembalian'}
                            </DialogTitle>
                            <DialogDescription>
                                Foto dokumentasi peminjaman/pengembalian alat
                            </DialogDescription>
                        </DialogHeader>
                        {selectedLoan && (
                            <div className="space-y-4">
                                {photoType === 'borrow' && selectedLoan.borrow_photo ? (
                                    <img
                                        src={`/tool-loan-photos/borrow/${selectedLoan.borrow_photo.split('/').pop()}`}
                                        alt="Foto peminjaman"
                                        className="w-full rounded-lg border"
                                    />
                                ) : photoType === 'return' && selectedLoan.return_photo ? (
                                    <img
                                        src={`/tool-loan-photos/return/${selectedLoan.return_photo.split('/').pop()}`}
                                        alt="Foto pengembalian"
                                        className="w-full rounded-lg border"
                                    />
                                ) : null}
                                <div className="text-sm text-muted-foreground">
                                    <p>Siswa: {selectedLoan.student?.name} (NIS: {selectedLoan.student?.nis})</p>
                                    <p>Alat: {selectedLoan.tool_unit?.tool?.name} - {selectedLoan.tool_unit?.unit_code}</p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

