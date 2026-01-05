import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, Camera, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Student, ToolUnit, Teacher, Subject } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';
import { PhotoCapture } from '@/components/features/camera/PhotoCapture';
import { ToolCodeAutocomplete } from '@/components/features/tools/ToolCodeAutocomplete';

interface BorrowPageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

interface SelectedTool {
    toolUnit: ToolUnit;
    photo: File | null;
    photoPreview: string | null;
}

export default function Borrow() {
    const { flash } = usePage().props as BorrowPageProps;
    const [step, setStep] = useState(1);
    const [nis, setNis] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
    const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);
    const [studentVerificationError, setStudentVerificationError] = useState('');

    const [unitCode, setUnitCode] = useState('');
    const [isVerifyingTool, setIsVerifyingTool] = useState(false);
    const [toolVerificationError, setToolVerificationError] = useState('');
    const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);

    const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
    const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerType, setScannerType] = useState<'student' | 'tool'>('student');

    // Teacher and Subject state
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Load teachers on mount
    useEffect(() => {
        loadTeachers();
    }, []);

    // Filter subjects when teacher changes
    useEffect(() => {
        if (selectedTeacherId) {
            const teacher = teachers.find((t) => t.id.toString() === selectedTeacherId);
            if (teacher && teacher.subjects) {
                setFilteredSubjects(teacher.subjects);
            } else {
                setFilteredSubjects([]);
            }
            setSelectedSubjectId(''); // Reset subject when teacher changes
        } else {
            setFilteredSubjects([]);
            setSelectedSubjectId('');
        }
    }, [selectedTeacherId, teachers]);

    const loadTeachers = async () => {
        try {
            const response = await axios.get('/tool-loans/teachers');
            if (response.data.success) {
                setTeachers(response.data.teachers);
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    };

    const handleVerifyStudent = async (nisToVerify?: string) => {
        const nisValue = nisToVerify || nis.trim();
        if (!nisValue) {
            setStudentVerificationError('Masukkan NIS terlebih dahulu');
            return;
        }

        setIsVerifyingStudent(true);
        setStudentVerificationError('');

        try {
            const response = await axios.post('/tool-loans/verify-student', { nis: nisValue });
            if (response.data.success) {
                setVerifiedStudent(response.data.student);
                setNis(nisValue);
                setStep(2);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Siswa tidak ditemukan';
            setStudentVerificationError(errorMessage);
            setVerifiedStudent(null);
        } finally {
            setIsVerifyingStudent(false);
        }
    };

    const handleVerifyTool = async (codeToVerify?: string) => {
        const codeValue = codeToVerify || unitCode.trim();
        if (!codeValue) {
            setToolVerificationError('Masukkan kode alat');
            return;
        }

        // Check if already added
        if (selectedTools.some((t) => t.toolUnit.unit_code === codeValue)) {
            setToolVerificationError('Alat ini sudah ditambahkan');
            return;
        }

        setIsVerifyingTool(true);
        setToolVerificationError('');

        try {
            const response = await axios.post('/tool-loans/verify-tool', { unit_code: codeValue });
            if (response.data.success) {
                const newTool: SelectedTool = {
                    toolUnit: response.data.tool_unit,
                    photo: null,
                    photoPreview: null,
                };
                setSelectedTools([...selectedTools, newTool]);
                setUnitCode('');
                toast.success('Alat ditambahkan');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Alat tidak ditemukan';
            setToolVerificationError(errorMessage);
        } finally {
            setIsVerifyingTool(false);
        }
    };

    const handleToolAutocompleteSelect = async (tool: { unit_code: string; tool_name: string; available_stock: number }) => {
        await handleVerifyTool(tool.unit_code);
    };

    const handleRemoveTool = (index: number) => {
        setSelectedTools(selectedTools.filter((_, i) => i !== index));
    };

    const handleStudentPhotoCapture = (file: File) => {
        setStudentPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setStudentPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedStudent || selectedTools.length === 0) {
            toast.error('Pastikan siswa dan minimal 1 alat sudah dipilih');
            return;
        }

        if (!studentPhoto) {
            toast.error('Foto wajah siswa wajib diambil');
            return;
        }

        setIsSubmitting(true);

        try {
            const results = [];
            // Submit all tools sequentially
            for (let i = 0; i < selectedTools.length; i++) {
                const tool = selectedTools[i];
                try {
                    const formData = new FormData();
                    formData.append('student_id', verifiedStudent.id.toString());
                    formData.append('tool_unit_id', tool.toolUnit.id.toString());
                    formData.append('borrow_photo', studentPhoto);
                    if (selectedTeacherId) {
                        formData.append('teacher_id', selectedTeacherId);
                    }
                    if (selectedSubjectId) {
                        formData.append('subject_id', selectedSubjectId);
                    }

                    await axios.post('/tool-loans/borrow', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    results.push({ success: true, tool: tool.toolUnit.unit_code });
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message;
                    results.push({ success: false, tool: tool.toolUnit.unit_code, error: errorMessage });
                }
            }

            const successCount = results.filter((r) => r.success).length;
            const failedCount = results.filter((r) => !r.success).length;

            if (successCount > 0) {
                toast.success(`${successCount} alat berhasil dipinjam`);
            }
            if (failedCount > 0) {
                toast.error(`${failedCount} alat gagal dipinjam`);
            }

            // Redirect to tool-loans page if all successful
            if (failedCount === 0) {
                router.visit('/tool-loans');
            } else {
                // Remove successfully submitted tools
                const failedTools = results.filter((r) => !r.success).map((r) => r.tool);
                setSelectedTools(selectedTools.filter((t) => failedTools.includes(t.toolUnit.unit_code)));
            }
        } catch (error: any) {
            toast.error('Terjadi kesalahan saat menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQRScanSuccess = (decodedText: string) => {
        if (scannerType === 'student') {
            handleVerifyStudent(decodedText);
        } else {
            handleVerifyTool(decodedText);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Peminjaman Alat" />

            <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Link href="/tool-loans">
                            <Button variant="ghost" className="mb-2">
                                ← Kembali
                            </Button>
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Peminjaman Alat</h1>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Scan QR code untuk memverifikasi siswa dan menambah alat yang dipinjam
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                    step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                                }`}
                            >
                                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                            </div>
                            <span className="font-medium">Verifikasi Siswa</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                    step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                                }`}
                            >
                                {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                            </div>
                            <span className="font-medium">Tambah Alat</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                    step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                                }`}
                            >
                                3
                            </div>
                            <span className="font-medium">Foto & Submit</span>
                        </div>
                    </div>

                    {/* Step 1: Verify Student */}
                    {step === 1 && (
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <CardTitle className="text-2xl mb-2">Verifikasi Siswa</CardTitle>
                                <CardDescription className="text-base">
                                    Scan QR code NIS siswa untuk memulai peminjaman
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <QRScanner
                                    open={true}
                                    onClose={() => {}}
                                    onScanSuccess={handleQRScanSuccess}
                                    onScanError={(error) => toast.error(error)}
                                    inline={true}
                                />

                                {studentVerificationError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center">
                                        {studentVerificationError}
                                    </div>
                                )}

                                {verifiedStudent && (
                                    <div className="p-6 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg space-y-4">
                                        <div className="flex items-center justify-center mb-2">
                                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-lg font-semibold">{verifiedStudent.name}</p>
                                            <p className="text-sm text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                            {verifiedStudent.major && (
                                                <p className="text-xs text-muted-foreground">{verifiedStudent.major.name}</p>
                                            )}
                                        </div>
                                        <Button onClick={() => setStep(2)} className="w-full mt-4" size="lg">
                                            Lanjutkan ke Pilih Alat
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Add Tools */}
                    {step === 2 && verifiedStudent && (
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <CardTitle className="text-2xl mb-2">Tambah Alat</CardTitle>
                                <CardDescription className="text-base">
                                    Scan QR code atau cari kode alat yang akan dipinjam
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Siswa Terverifikasi</p>
                                        <p className="font-semibold">{verifiedStudent.name}</p>
                                        <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-base font-semibold mb-2 block">Scan QR Code Alat</Label>
                                        <QRScanner
                                            open={true}
                                            onClose={() => {}}
                                            onScanSuccess={(decodedText) => {
                                                setScannerType('tool');
                                                handleVerifyTool(decodedText);
                                            }}
                                            onScanError={(error) => toast.error(error)}
                                            inline={true}
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">atau</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-base font-semibold mb-2 block">Cari Kode atau Nama Alat</Label>
                                        <ToolCodeAutocomplete
                                            value={unitCode}
                                            onChange={setUnitCode}
                                            onSelect={handleToolAutocompleteSelect}
                                            placeholder="Masukkan kode alat..."
                                            disabled={isVerifyingTool}
                                        />
                                    </div>
                                </div>

                                {toolVerificationError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center">
                                        {toolVerificationError}
                                    </div>
                                )}

                                {selectedTools.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-semibold">Daftar Alat</Label>
                                            <Badge variant="secondary" className="text-sm">
                                                {selectedTools.length} alat
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedTools.map((tool, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 border-2 rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex-1 space-y-1">
                                                        <p className="font-medium">{tool.toolUnit.tool?.name}</p>
                                                        <p className="text-sm text-muted-foreground">Kode: {tool.toolUnit.unit_code}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveTool(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setStep(1);
                                            setSelectedTools([]);
                                        }}
                                        className="flex-1"
                                    >
                                        Ganti Siswa
                                    </Button>
                                    {selectedTools.length > 0 && (
                                        <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                                            Lanjutkan ({selectedTools.length} alat)
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Submit */}
                    {step === 3 && verifiedStudent && selectedTools.length > 0 && (
                        <form onSubmit={handleSubmit}>
                            <Card className="border-2">
                                <CardHeader className="text-center pb-6">
                                    <CardTitle className="text-2xl mb-2">Konfirmasi Peminjaman</CardTitle>
                                    <CardDescription className="text-base">
                                        Ambil foto wajah siswa, pilih guru dan mapel, lalu konfirmasi data peminjaman
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Siswa</p>
                                            <p className="font-semibold text-lg">{verifiedStudent.name}</p>
                                            <p className="text-sm text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Foto Wajah Siswa *</Label>
                                        {studentPhotoPreview ? (
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="relative">
                                                    <img
                                                        src={studentPhotoPreview}
                                                        alt="Foto Wajah"
                                                        className="w-64 h-64 object-cover rounded-lg border-2 shadow-lg"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setStudentPhoto(null);
                                                        setStudentPhotoPreview(null);
                                                    }}
                                                >
                                                    Ganti Foto
                                                </Button>
                                            </div>
                                        ) : (
                                            <PhotoCapture
                                                open={true}
                                                onClose={() => {}}
                                                onCapture={handleStudentPhotoCapture}
                                                title="Ambil Foto Wajah Siswa"
                                                description="Posisikan wajah siswa dalam frame kamera"
                                                inline={true}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="teacher" className="text-base font-semibold">
                                            Pilih Guru
                                        </Label>
                                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                            <SelectTrigger id="teacher" className="h-12">
                                                <SelectValue placeholder="Pilih guru" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                        {teacher.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="subject" className="text-base font-semibold">
                                            Pilih Mapel
                                        </Label>
                                        <Select
                                            value={selectedSubjectId}
                                            onValueChange={setSelectedSubjectId}
                                            disabled={!selectedTeacherId || filteredSubjects.length === 0}
                                        >
                                            <SelectTrigger id="subject" className="h-12">
                                                <SelectValue
                                                    placeholder={
                                                        !selectedTeacherId
                                                            ? 'Pilih guru terlebih dahulu'
                                                            : filteredSubjects.length === 0
                                                            ? 'Guru ini belum memiliki mapel'
                                                            : 'Pilih mapel'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredSubjects.map((subject) => (
                                                    <SelectItem key={subject.id} value={subject.id.toString()}>
                                                        {subject.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-semibold">Alat yang Dipinjam</Label>
                                            <Badge variant="secondary" className="text-sm">
                                                {selectedTools.length} alat
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedTools.map((tool, index) => (
                                                <div key={index} className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                    <p className="font-medium">{tool.toolUnit.tool?.name}</p>
                                                    <p className="text-sm text-muted-foreground">Kode: {tool.toolUnit.unit_code}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                                            Kembali
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !studentPhoto}
                                            className="flex-1"
                                            size="lg"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Peminjaman'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
