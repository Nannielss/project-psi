import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, PackageCheck, MapPin, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IndexPageProps {
    deviceLocation?: {
        id: number;
        name: string;
    };
}

export default function IndexPage({ deviceLocation }: IndexPageProps) {
    const handleLogout = () => {
        router.post(route('tool-loans.location-logout'), {}, {
            onSuccess: () => {
                // Redirect handled by backend
            },
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Peminjaman & Pengembalian Alat" />

            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{deviceLocation?.name || 'Tidak diketahui'}</span>
                            </p>
                            {deviceLocation && (
                                <Button variant="ghost" size="sm" className="p-0.5 ml-2" onClick={handleLogout} title="Logout Lokasi Device">
                                    <LogOut className="h-4 w-4 text-red-600" />
                                </Button>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Peminjaman & Pengembalian Alat</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Pilih menu untuk meminjam atau mengembalikan alat laboratorium
                        </p>

                    </div>

                    {/* Options Grid */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Borrow Option */}
                        <Link href="/tool-loans/borrow" className="group">
                            <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-primary">
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <Package className="h-10 w-10 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl">Pinjam Alat</CardTitle>
                                    <CardDescription className="text-base">
                                        Pinjam alat laboratorium untuk keperluan praktikum
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span>Scan QR identitas siswa</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span>Scan QR atau input kode alat</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span>Ambil foto wajah + alat</span>
                                        </div>
                                    </div>
                                    <Button className="w-full group-hover:bg-primary/90" size="lg">
                                        Mulai Peminjaman
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Return Option */}
                        <Link href="/tool-loans/return" className="group">
                            <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-primary">
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                        <PackageCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <CardTitle className="text-2xl">Kembalikan Alat</CardTitle>
                                    <CardDescription className="text-base">
                                        Kembalikan alat yang telah dipinjam
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                            <span>Scan QR identitas siswa</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                            <span>Pilih kondisi alat</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                            <span>Ambil foto alat</span>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                                        Mulai Pengembalian
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {/* Info Section */}
                    <div className="max-w-4xl mx-auto">
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Informasi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Ketentuan Peminjaman:</h4>
                                        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                            <li>Siswa harus scan QR identitas terlebih dahulu</li>
                                            <li>Siswa tidak bisa meminjam jika masih ada pinjaman aktif</li>
                                            <li>Alat yang sedang dipinjam tidak bisa dipinjam lagi</li>
                                            <li>Hanya alat dengan kondisi baik yang bisa dipinjam</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Ketentuan Pengembalian:</h4>
                                        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                            <li>Siswa harus scan QR identitas terlebih dahulu</li>
                                            <li>Kondisi alat wajib dipilih saat pengembalian</li>
                                            <li>Foto alat wajib diambil sebagai dokumentasi</li>
                                            <li>Kondisi alat akan otomatis terupdate setelah pengembalian</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

