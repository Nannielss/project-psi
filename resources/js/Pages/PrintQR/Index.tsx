import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, X } from 'lucide-react';
import { PageProps, Student, Teacher, Major } from '@/types';
import { toast } from 'sonner';
import { QRPrintDialog } from '@/components/features/qr/QRPrintDialog';

interface PrintQRPageProps extends PageProps {
    majors: Major[];
    classes: string[];
    filters?: {
        category?: 'student' | 'teacher' | 'tool';
        search?: string;
        major_id?: string;
        class?: string;
    };
}

export default function PrintQR({ majors, classes, filters }: PrintQRPageProps) {
    const { flash } = usePage<PrintQRPageProps>().props;
    const [activeCategory, setActiveCategory] = useState<'student' | 'teacher' | 'tool'>(
        filters?.category || 'student'
    );
    const [search, setSearch] = useState(filters?.search || '');
    const [majorFilter, setMajorFilter] = useState(filters?.major_id || '');
    const [classFilter, setClassFilter] = useState(filters?.class || '');
    const [isQRPrintOpen, setIsQRPrintOpen] = useState(false);
    const [qrData, setQrData] = useState<(Student | Teacher | { id: number; unit_code: string; unit_number: number; tool: { id: number; name: string; location: string } })[]>([]);
    const [isLoadingQR, setIsLoadingQR] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleLoadQRData = async () => {
        setIsLoadingQR(true);

        try {
            const params: Record<string, string> = {};
            if (search) params.search = search;

            let endpoint = '';
            if (activeCategory === 'student') {
                endpoint = '/students/for-qr';
                if (majorFilter) params.major_id = majorFilter;
                if (classFilter) params.class = classFilter;
            } else if (activeCategory === 'teacher') {
                endpoint = '/teachers/for-qr';
            } else {
                endpoint = '/tools/for-qr';
            }

            const response = await window.axios.get(endpoint, { params });

            if (response.data && response.data.data) {
                setQrData(response.data.data);
                setIsQRPrintOpen(true);
            } else {
                toast.error('Format data tidak valid');
            }
        } catch (error: unknown) {
            console.error('Error fetching QR data:', error);
            const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || 'Gagal mengambil data untuk QR';
            toast.error(errorMessage);
        } finally {
            setIsLoadingQR(false);
        }
    };

    const getQRItems = () => {
        if (activeCategory === 'student') {
            return qrData
                .filter((item): item is Student => 'nis' in item && 'class' in item)
                .map((student) => ({
                    id: student.id,
                    code: student.nis,
                    name: student.name,
                    subtitle: `${student.class} - ${student.major?.name || ''}`,
                }));
        } else if (activeCategory === 'teacher') {
            return qrData
                .filter((item): item is Teacher => 'nip' in item && !('class' in item))
                .map((teacher) => ({
                    id: teacher.id,
                    code: teacher.nip,
                    name: teacher.name,
                    subtitle: teacher.subjects?.map(s => s.nama).join(', ') || undefined,
                }));
        } else {
            // Tool units
            return qrData
                .filter((item): item is { id: number; unit_code: string; unit_number: number; tool: { id: number; name: string; location: string } } => 'unit_code' in item && 'tool' in item)
                .map((item) => ({
                    id: item.id,
                    code: item.unit_code,
                    name: `${item.tool.name} #${item.unit_number}`,
                    subtitle: item.tool.location,
                }));
        }
    };

    const getCategoryTitle = () => {
        switch (activeCategory) {
            case 'student':
                return 'Cetak QR Siswa';
            case 'teacher':
                return 'Cetak QR Guru';
            case 'tool':
                return 'Cetak QR Alat';
            default:
                return 'Cetak QR';
        }
    };

    const handleReset = () => {
        setSearch('');
        setMajorFilter('');
        setClassFilter('');
    };

    return (
        <DashboardLayout>
            <Head title="Cetak QR Code" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Cetak QR Code</h1>
                        <p className="text-muted-foreground">
                            Cetak QR Code untuk Guru, Siswa, atau Alat
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pilih Kategori</CardTitle>
                        <CardDescription>
                            Pilih kategori yang ingin dicetak QR Code-nya
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2 border-b">
                                <Button
                                    type="button"
                                    variant={activeCategory === 'student' ? 'default' : 'ghost'}
                                    onClick={() => setActiveCategory('student')}
                                    className="rounded-b-none"
                                >
                                    Siswa
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeCategory === 'teacher' ? 'default' : 'ghost'}
                                    onClick={() => setActiveCategory('teacher')}
                                    className="rounded-b-none"
                                >
                                    Guru
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeCategory === 'tool' ? 'default' : 'ghost'}
                                    onClick={() => setActiveCategory('tool')}
                                    className="rounded-b-none"
                                >
                                    Alat
                                </Button>
                            </div>

                            {activeCategory === 'student' && (
                                <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="search_student">Cari Siswa</Label>
                                        <Input
                                            id="search_student"
                                            placeholder="Cari berdasarkan NIS atau nama"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="major_filter">Filter Jurusan</Label>
                                        <Select
                                            value={majorFilter || 'all'}
                                            onValueChange={(value) => setMajorFilter(value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Jurusan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Jurusan</SelectItem>
                                                {majors.map((major) => (
                                                    <SelectItem key={major.id} value={major.id.toString()}>
                                                        {major.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="class_filter">Filter Kelas</Label>
                                        <Select
                                            value={classFilter || 'all'}
                                            onValueChange={(value) => setClassFilter(value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Kelas</SelectItem>
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls} value={cls}>
                                                        {cls}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {(search || majorFilter || classFilter) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleReset}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reset Filter
                                    </Button>
                                )}
                                </div>
                            )}

                            {activeCategory === 'teacher' && (
                                <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="search_teacher">Cari Guru</Label>
                                        <Input
                                            id="search_teacher"
                                            placeholder="Cari berdasarkan NIP atau nama"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    {search && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSearch('')}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Reset Filter
                                        </Button>
                                    )}
                                </div>
                            )}

                            {activeCategory === 'tool' && (
                                <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="search_tool">Cari Alat</Label>
                                        <Input
                                            id="search_tool"
                                            placeholder="Cari berdasarkan kode, nama, atau lokasi"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    {search && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSearch('')}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Reset Filter
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={handleLoadQRData}
                                disabled={isLoadingQR}
                                size="lg"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                {isLoadingQR ? 'Memuat...' : 'Cetak QR'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* QR Print Dialog */}
                <QRPrintDialog
                    open={isQRPrintOpen}
                    onOpenChange={setIsQRPrintOpen}
                    items={getQRItems()}
                    title={getCategoryTitle()}
                    description={`Cetak QR Code untuk ${qrData.length} ${activeCategory === 'student' ? 'siswa' : activeCategory === 'teacher' ? 'guru' : 'alat'}`}
                    type={activeCategory}
                />
            </div>
        </DashboardLayout>
    );
}
