import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Package,
    PackageCheck,
    Clock,
    History,
    Wrench,
    AlertTriangle,
    TrendingUp,
    Box,
    ShoppingCart,
    ArrowRight,
    CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
    stats: {
        tools_count: number;
        tools_available: number;
        tools_borrowed: number;
        total_loans: number;
        active_loans: number;
        loans_today: number;
        returns_today: number;
    };
    recent_loans?: Array<{
        id: number;
        student_name: string;
        student_nis: string;
        major_name: string;
        tool_name: string;
        unit_code: string;
        status: string;
        borrowed_at: string;
    }>;
    alerts?: {
        overdue_loans?: Array<{
            id: number;
            student_name: string;
            student_nis: string;
            tool_name: string;
            unit_code: string;
            borrowed_at: string;
            hours_ago: number;
        }>;
        low_stock_materials?: Array<{
            id: number;
            nama_bahan: string;
            stok: number;
            satuan: string;
        }>;
        damaged_tools_pending?: Array<{
            id: number;
            tool_name: string;
            unit_code: string;
            condition: string;
        }>;
    };
}

export default function Dashboard({
    stats,
    recent_loans = [],
    alerts = {
        overdue_loans: [],
        low_stock_materials: [],
        damaged_tools_pending: [],
    },
}: DashboardProps) {
    const getStatusBadge = (status: string) => {
        if (status === 'borrowed') {
            return <Badge variant="secondary">Sedang Dipinjam</Badge>;
        }
        return <Badge variant="default">Dikembalikan</Badge>;
    };

    const overdueLoans = alerts?.overdue_loans || [];
    const lowStockMaterials = alerts?.low_stock_materials || [];
    const damagedToolsPending = alerts?.damaged_tools_pending || [];
    const hasAlerts = overdueLoans.length > 0 || lowStockMaterials.length > 0 || damagedToolsPending.length > 0;

    return (
        <DashboardLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Ringkasan sistem inventaris dan aktivitas
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Alat</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.tools_count}</div>
                            <p className="text-xs text-muted-foreground">
                                Alat terdaftar di sistem
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Alat Tersedia</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.tools_available}</div>
                            <p className="text-xs text-muted-foreground">
                                Siap untuk dipinjam
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sedang Dipinjam</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.tools_borrowed}</div>
                            <p className="text-xs text-muted-foreground">
                                Alat yang belum dikembalikan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Peminjaman Aktif</CardTitle>
                            <PackageCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Total peminjaman aktif
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Activity */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Peminjaman Hari Ini</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.loans_today}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.returns_today} dikembalikan hari ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Peminjaman</CardTitle>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Semua waktu
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts & Quick Actions Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Alerts */}
                    {hasAlerts && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    Peringatan
                                </CardTitle>
                                <CardDescription>
                                    Item yang memerlukan perhatian
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Overdue Loans */}
                                {overdueLoans.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 text-yellow-600">
                                            Peminjaman Terlambat ({overdueLoans.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {overdueLoans.slice(0, 3).map((loan) => (
                                                <div
                                                    key={loan.id}
                                                    className="text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800"
                                                >
                                                    <div className="font-medium">{loan.tool_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {loan.student_name} ({loan.student_nis}) - {loan.hours_ago} jam yang lalu
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Low Stock Materials */}
                                {lowStockMaterials.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 text-orange-600">
                                            Stok Rendah ({lowStockMaterials.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {lowStockMaterials.slice(0, 3).map((material) => (
                                                <div
                                                    key={material.id}
                                                    className="text-sm p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800"
                                                >
                                                    <div className="font-medium">{material.nama_bahan}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Stok: {material.stok} {material.satuan}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Damaged Tools */}
                                {damagedToolsPending.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 text-red-600">
                                            Alat Rusak ({damagedToolsPending.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {damagedToolsPending.slice(0, 3).map((tool) => (
                                                <div
                                                    key={tool.id}
                                                    className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                                                >
                                                    <div className="font-medium">{tool.tool_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Unit: {tool.unit_code} - Perlu perbaikan
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    
                </div>

                {/* Recent Loans */}
                <Card>
                    <CardHeader>
                        <CardTitle>Peminjaman Terbaru</CardTitle>
                        <CardDescription>
                            5 peminjaman terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Siswa</TableHead>
                                    <TableHead>Alat</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_loans.length > 0 ? (
                                    recent_loans.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>
                                                <div className="font-medium">{loan.student_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {loan.student_nis} - {loan.major_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{loan.tool_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {loan.unit_code}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {loan.borrowed_at}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
