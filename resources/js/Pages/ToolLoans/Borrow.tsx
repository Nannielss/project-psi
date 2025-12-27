import { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import { Student, ToolUnit } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';
import { PhotoCapture } from '@/components/features/camera/PhotoCapture';

interface BorrowPageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Borrow() {
    const { flash } = usePage().props as BorrowPageProps;
    const [step, setStep] = useState(1);
    const [nis, setNis] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
    const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);
    const [studentVerificationError, setStudentVerificationError] = useState('');

    const [unitCode, setUnitCode] = useState('');
    const [verifiedToolUnit, setVerifiedToolUnit] = useState<ToolUnit | null>(null);
    const [isVerifyingTool, setIsVerifyingTool] = useState(false);
    const [toolVerificationError, setToolVerificationError] = useState('');

    const [borrowPhoto, setBorrowPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerType, setScannerType] = useState<'student' | 'tool'>('student');

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

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
                toast.success('Identitas siswa berhasil diverifikasi');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Siswa dengan NIS tersebut tidak ditemukan';
            setStudentVerificationError(errorMessage);
            setVerifiedStudent(null);
            if (error.response?.status === 422 && error.response?.data?.active_loan) {
                toast.error(errorMessage);
            }
        } finally {
            setIsVerifyingStudent(false);
        }
    };

    const handleVerifyTool = async (codeToVerify?: string) => {
        const codeValue = codeToVerify || unitCode.trim();
        if (!codeValue) {
            setToolVerificationError('Masukkan kode alat terlebih dahulu');
            return;
        }

        setIsVerifyingTool(true);
        setToolVerificationError('');

        try {
            const response = await axios.post('/tool-loans/verify-tool', { unit_code: codeValue });
            if (response.data.success) {
                setVerifiedToolUnit(response.data.tool_unit);
                setUnitCode(codeValue);
                setStep(3);
                toast.success('Alat berhasil diverifikasi');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Alat dengan kode tersebut tidak ditemukan';
            setToolVerificationError(errorMessage);
            setVerifiedToolUnit(null);
            toast.error(errorMessage);
        } finally {
            setIsVerifyingTool(false);
        }
    };

    const handleQRScanSuccess = (decodedText: string) => {
        if (scannerType === 'student') {
            handleVerifyStudent(decodedText);
        } else {
            handleVerifyTool(decodedText);
        }
    };

    const handleQRScanError = (error: string) => {
        toast.error(error);
    };

    const handlePhotoCapture = (file: File) => {
        setBorrowPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedStudent || !verifiedToolUnit || !borrowPhoto) {
            toast.error('Pastikan semua data sudah lengkap');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('student_id', verifiedStudent.id.toString());
        formData.append('tool_unit_id', verifiedToolUnit.id.toString());
        formData.append('borrow_photo', borrowPhoto);
        if (notes) {
            formData.append('notes', notes);
        }

        router.post('/tool-loans/borrow', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Peminjaman alat berhasil dicatat');
                // Reset form
                setStep(1);
                setNis('');
                setVerifiedStudent(null);
                setUnitCode('');
                setVerifiedToolUnit(null);
                setBorrowPhoto(null);
                setPhotoPreview(null);
                setNotes('');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                if (errors.student_id) {
                    toast.error(errors.student_id);
                } else if (errors.tool_unit_id) {
                    toast.error(errors.tool_unit_id);
                } else if (errors.borrow_photo) {
                    toast.error(errors.borrow_photo);
                } else {
                    toast.error('Terjadi kesalahan saat menyimpan data');
                }
            },
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Peminjaman Alat" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Link href="/tool-loans">
                            <Button variant="ghost" className="mb-2">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Menu
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Peminjaman Alat</h1>
                            <p className="text-muted-foreground">
                                Scan QR identitas siswa dan alat, lalu ambil foto untuk meminjam alat
                            </p>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                            }`}>
                                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                            </div>
                            <span className="font-medium">Verifikasi Siswa</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                            }`}>
                                {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                            </div>
                            <span className="font-medium">Verifikasi Alat</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                            }`}>
                                3
                            </div>
                            <span className="font-medium">Foto & Submit</span>
                        </div>
                    </div>

                    {/* Step 1: Verify Student */}
                    {step === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Verifikasi Identitas Siswa</CardTitle>
                                <CardDescription>
                                    Scan QR code atau masukkan NIS siswa
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nis">NIS Siswa</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="nis"
                                            placeholder="Masukkan NIS atau scan QR code"
                                            value={nis}
                                            onChange={(e) => {
                                                setNis(e.target.value);
                                                setStudentVerificationError('');
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleVerifyStudent();
                                                }
                                            }}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => handleVerifyStudent()}
                                            disabled={isVerifyingStudent}
                                        >
                                            {isVerifyingStudent ? 'Memverifikasi...' : 'Verifikasi'}
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>atau</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setScannerType('student');
                                                setIsScannerOpen(true);
                                            }}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Scan QR Code
                                        </Button>
                                    </div>
                                </div>

                                {studentVerificationError && (
                                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">{studentVerificationError}</span>
                                    </div>
                                )}

                                {verifiedStudent && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900 dark:text-green-100">
                                                Identitas Terverifikasi
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {verifiedStudent.name} (NIS: {verifiedStudent.nis})
                                            </p>
                                            {verifiedStudent.major && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                    {verifiedStudent.major.name} - {verifiedStudent.class}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => setStep(2)}
                                            disabled={!verifiedStudent}
                                        >
                                            Lanjutkan
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Verify Tool */}
                    {step === 2 && verifiedStudent && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Verifikasi Alat</CardTitle>
                                <CardDescription>
                                    Scan QR code atau masukkan kode unit alat
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">Siswa: {verifiedStudent.name}</p>
                                    <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="unit_code">Kode Unit Alat</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="unit_code"
                                            placeholder="Masukkan kode unit atau scan QR code"
                                            value={unitCode}
                                            onChange={(e) => {
                                                setUnitCode(e.target.value);
                                                setToolVerificationError('');
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleVerifyTool();
                                                }
                                            }}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => handleVerifyTool()}
                                            disabled={isVerifyingTool}
                                        >
                                            {isVerifyingTool ? 'Memverifikasi...' : 'Verifikasi'}
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>atau</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setScannerType('tool');
                                                setIsScannerOpen(true);
                                            }}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Scan QR Code
                                        </Button>
                                    </div>
                                </div>

                                {toolVerificationError && (
                                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">{toolVerificationError}</span>
                                    </div>
                                )}

                                {verifiedToolUnit && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900 dark:text-green-100">
                                                Alat Terverifikasi
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {verifiedToolUnit.tool?.name} - Unit: {verifiedToolUnit.unit_code}
                                            </p>
                                            <Badge variant="secondary" className="mt-1">
                                                Kondisi: {verifiedToolUnit.condition}
                                            </Badge>
                                        </div>
                                        <Button
                                            onClick={() => setStep(3)}
                                            disabled={!verifiedToolUnit}
                                        >
                                            Lanjutkan
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Photo & Submit */}
                    {step === 3 && verifiedStudent && verifiedToolUnit && (
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ambil Foto & Submit</CardTitle>
                                    <CardDescription>
                                        Ambil foto wajah siswa bersama alat yang dipinjam
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium">Siswa: {verifiedStudent.name}</p>
                                        <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                        <p className="text-sm font-medium mt-2">Alat: {verifiedToolUnit.tool?.name}</p>
                                        <p className="text-xs text-muted-foreground">Unit: {verifiedToolUnit.unit_code}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Foto Wajah + Alat</Label>
                                        {photoPreview ? (
                                            <div className="space-y-3">
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    className="w-full max-w-md rounded-lg border"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBorrowPhoto(null);
                                                        setPhotoPreview(null);
                                                    }}
                                                >
                                                    Ganti Foto
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsPhotoDialogOpen(true)}
                                            >
                                                <Camera className="mr-2 h-4 w-4" />
                                                Ambil Foto
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Catatan (Opsional)</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Catatan tambahan untuk peminjaman"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(2)}
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Kembali
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !borrowPhoto}
                                            className="flex-1"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Peminjaman'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    )}

                    {/* QR Scanner Dialog */}
                    <QRScanner
                        open={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScanSuccess={handleQRScanSuccess}
                        onScanError={handleQRScanError}
                    />

                    {/* Photo Capture Dialog */}
                    <PhotoCapture
                        open={isPhotoDialogOpen}
                        onClose={() => setIsPhotoDialogOpen(false)}
                        onCapture={handlePhotoCapture}
                        title="Ambil Foto Wajah + Alat"
                        description="Posisikan wajah siswa dan alat dalam frame kamera"
                    />
                </div>
            </div>
        </div>
    );
}


