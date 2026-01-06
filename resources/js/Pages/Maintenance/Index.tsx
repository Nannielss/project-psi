import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, Wrench, CheckCircle2, XCircle } from 'lucide-react';
import { PageProps, ToolUnit } from '@/types';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface MaintenancePageProps extends PageProps {
    units: {
        data: ToolUnit[];
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

export default function Maintenance({ units, filters }: MaintenancePageProps) {
    const { flash } = usePage<MaintenancePageProps>().props;
    const [activeTab, setActiveTab] = useState<'damaged' | 'scrapped'>(
        (filters?.condition as 'damaged' | 'scrapped') || 'damaged'
    );
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedUnit, setSelectedUnit] = useState<ToolUnit | null>(null);
    const [actionType, setActionType] = useState<'repair' | 'scrap' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleTabChange = (tab: 'damaged' | 'scrapped') => {
        setActiveTab(tab);
        router.get('/maintenance', { 
            search: search || undefined,
            condition: tab 
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/maintenance', { 
            search: search || undefined,
            condition: activeTab 
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleAction = (unit: ToolUnit, type: 'repair' | 'scrap') => {
        setSelectedUnit(unit);
        setActionType(type);
        setIsDialogOpen(true);
    };

    const confirmAction = () => {
        if (!selectedUnit || !actionType) return;

        setIsProcessing(true);
        const route = actionType === 'repair' 
            ? `/maintenance/${selectedUnit.id}/repair`
            : `/maintenance/${selectedUnit.id}/scrap`;

                                        router.post(route, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                setSelectedUnit(null);
                setActionType(null);
                setIsProcessing(false);
                // Reload with current tab
                router.get('/maintenance', { condition: activeTab }, {
                    preserveState: true,
                    preserveScroll: true,
                });
            },
            onError: (errors) => {
                setIsProcessing(false);
                if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Terjadi kesalahan saat memproses permintaan');
                }
            },
        });
    };

    const getConditionBadge = (condition: string) => {
        switch (condition) {
            case 'good':
                return <Badge variant="default" className="bg-green-500">Baik</Badge>;
            case 'damaged':
                return <Badge variant="destructive">Rusak</Badge>;
            case 'scrapped':
                return <Badge variant="secondary">Rusak Total</Badge>;
            default:
                return <Badge variant="secondary">{condition}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <Head title="Maintenance Alat" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Wrench className="h-8 w-8" />
                            Maintenance Alat
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Kelola alat yang rusak dan perbaiki atau tandai sebagai rusak total
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Alat Maintenance</CardTitle>
                        <CardDescription>
                            Kelola alat yang belum ditindak dan alat yang rusak total
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Tabs */}
                        <div className="flex gap-2 border-b">
                            <Button
                                type="button"
                                variant={activeTab === 'damaged' ? 'default' : 'ghost'}
                                onClick={() => handleTabChange('damaged')}
                                className="rounded-b-none"
                            >
                                Belum Ditindak
                            </Button>
                            <Button
                                type="button"
                                variant={activeTab === 'scrapped' ? 'default' : 'ghost'}
                                onClick={() => handleTabChange('scrapped')}
                                className="rounded-b-none"
                            >
                                Rusak Total
                            </Button>
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari berdasarkan kode unit, nama alat, lokasi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                            {search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/maintenance', { condition: activeTab }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    Reset
                                </Button>
                            )}
                        </form>

                        {/* Table */}
                        {units.data.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>
                                    {activeTab === 'damaged' 
                                        ? 'Tidak ada alat rusak yang perlu diperbaiki'
                                        : 'Tidak ada alat yang rusak total'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kode Unit</TableHead>
                                                <TableHead>Nama Alat</TableHead>
                                                <TableHead>Lokasi</TableHead>
                                                <TableHead>Deskripsi Kerusakan</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                {activeTab === 'damaged' && (
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {units.data.map((unit) => (
                                                <TableRow key={unit.id}>
                                                    <TableCell className="font-medium">
                                                        {unit.unit_code}
                                                    </TableCell>
                                                    <TableCell>
                                                        {unit.tool?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {unit.tool?.location || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {unit.description || (
                                                            <span className="text-muted-foreground italic">
                                                                Tidak ada deskripsi
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(unit.updated_at).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    {activeTab === 'damaged' && (
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleAction(unit, 'repair')}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                    Sudah Diperbaiki
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleAction(unit, 'scrap')}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" />
                                                                    Rusak Total
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {units.last_page > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {units.data.length} dari {units.total} alat
                                        </div>
                                        <div className="flex gap-2">
                                            {units.links.map((link, index) => {
                                                if (index === 0) {
                                                    return (
                                                        <Button
                                                            key={index}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url)}
                                                        >
                                                            Sebelumnya
                                                        </Button>
                                                    );
                                                }
                                                if (index === units.links.length - 1) {
                                                    return (
                                                        <Button
                                                            key={index}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url)}
                                                        >
                                                            Selanjutnya
                                                        </Button>
                                                    );
                                                }
                                                if (link.label === '...') {
                                                    return (
                                                        <span key={index} className="px-2 py-1">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <Button
                                                        key={index}
                                                        variant={link.active ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => link.url && router.get(link.url)}
                                                    >
                                                        {link.label}
                                                    </Button>
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

            {/* Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'repair' ? 'Tandai Sebagai Sudah Diperbaiki?' : 'Tandai Sebagai Rusak Total?'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'repair' ? (
                                <>
                                    Unit <strong>{selectedUnit?.unit_code}</strong> akan ditandai sebagai sudah diperbaiki dan kembali tersedia untuk dipinjam.
                                </>
                            ) : (
                                <>
                                    Unit <strong>{selectedUnit?.unit_code}</strong> akan ditandai sebagai rusak total dan tidak dapat dipinjam lagi.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmAction}
                            disabled={isProcessing}
                            variant={actionType === 'scrap' ? 'destructive' : 'default'}
                        >
                            {isProcessing ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

