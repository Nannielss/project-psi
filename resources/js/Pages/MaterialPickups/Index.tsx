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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Plus } from 'lucide-react';
import { PageProps, MaterialPickup } from '@/types';
import { toast } from 'sonner';

interface MaterialPickupsPageProps extends PageProps {
    pickups: {
        data: MaterialPickup[];
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
        date_from?: string;
        date_to?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ pickups, filters }: MaterialPickupsPageProps) {
    const { flash } = usePage<MaterialPickupsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

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
        router.get('/material-pickups', {
            search: search || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        router.get('/material-pickups');
    };

    return (
        <DashboardLayout>
            <Head title="Riwayat Ambil Bahan" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Riwayat Ambil Bahan</h1>
                        <p className="text-muted-foreground">
                            Daftar semua pengambilan bahan yang telah dicatat
                        </p>
                    </div>
                    <Link href="/material-pickups/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Ambil Bahan
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter & Pencarian</CardTitle>
                        <CardDescription>
                            Cari riwayat berdasarkan guru, bahan, atau tanggal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="search">Cari</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="search"
                                            placeholder="Cari berdasarkan nama guru, NIP, atau nama bahan"
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
                            {(search || dateFrom || dateTo) && (
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
                            Total: {pickups.total} pengambilan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pickups.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada data pengambilan bahan
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Guru</TableHead>
                                                <TableHead>Bahan</TableHead>
                                                <TableHead>Jumlah Ambil</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pickups.data.map((pickup) => (
                                                <TableRow key={pickup.id}>
                                                    <TableCell>
                                                        {new Date(pickup.created_at).toLocaleString('id-ID', {
                                                            dateStyle: 'short',
                                                            timeStyle: 'short',
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {pickup.teacher?.name || '-'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                NIP: {pickup.teacher?.nip || '-'}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {pickup.material?.nama_bahan || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {pickup.jumlah} {pickup.material?.satuan || ' '}
                                                    </TableCell>
                                                    <TableCell>
                                                        {pickup.keterangan || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {pickups.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((pickups.current_page - 1) * pickups.per_page) + 1} sampai{' '}
                                            {Math.min(pickups.current_page * pickups.per_page, pickups.total)} dari{' '}
                                            {pickups.total} pengambilan
                                        </div>
                                        <div className="flex gap-2">
                                            {pickups.links.map((link, index) => {
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
            </div>
        </DashboardLayout>
    );
}
