import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, PackageCheck, Clock, History } from 'lucide-react';

interface DashboardProps {
    stats: {
        total_loans: number;
        active_loans: number;
        returned_loans: number;
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    return (
        <DashboardLayout>
            <Head title="Dashboard" />

            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Ringkasan peminjaman dan pengembalian alat
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Peminjaman
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Semua peminjaman
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Sedang Dipinjam
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Alat yang belum dikembalikan
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Sudah Dikembalikan
                            </CardTitle>
                            <PackageCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.returned_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Alat yang sudah dikembalikan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Access */}
                <Card>
                    <CardHeader>
                        <CardTitle>Akses Cepat</CardTitle>
                        <CardDescription>
                            Navigasi cepat ke halaman penting
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Link href="/history">
                                <Button variant="outline">
                                    <History className="mr-2 h-4 w-4" />
                                    Lihat Riwayat Peminjaman
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
