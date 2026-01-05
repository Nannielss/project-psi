import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import { Student, ToolLoan } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';
import { PhotoCapture } from '@/components/features/camera/PhotoCapture';

interface ReturnPageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Return() {
    const { flash } = usePage<ReturnPageProps>().props;
    const [step, setStep] = useState(1);
    const [nis, setNis] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
    const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);
    const [studentVerificationError, setStudentVerificationError] = useState('');
    
    const [unitCode, setUnitCode] = useState('');
    const [activeLoan, setActiveLoan] = useState<ToolLoan | null>(null);
    const [isVerifyingTool, setIsVerifyingTool] = useState(false);
    const [toolVerificationError, setToolVerificationError] = useState('');

    const [returnCondition, setReturnCondition] = useState<'good' | 'damaged'>('good');
    const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
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
        if (!verifiedStudent) {
            setToolVerificationError('Verifikasi siswa terlebih dahulu');
            return;
        }

        const codeValue = codeToVerify || unitCode.trim();
        if (!codeValue) {
            setToolVerificationError('Masukkan kode alat terlebih dahulu');
            return;
        }

        setIsVerifyingTool(true);
        setToolVerificationError('');

        try {
            const response = await axios.post('/tool-loans/get-active-loan-by-tool', {
                unit_code: codeValue,
                student_id: verifiedStudent.id,
            });
            if (response.data.success) {
                setActiveLoan(response.data.loan);
                setUnitCode(codeValue);
                setStep(3);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Alat tidak ditemukan atau tidak dipinjam oleh siswa ini';
            setToolVerificationError(errorMessage);
            setActiveLoan(null);
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
        setReturnPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedStudent || !activeLoan || !returnPhoto) {
            toast.error('Pastikan semua data sudah lengkap');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('tool_unit_id', activeLoan.tool_unit_id.toString());
        formData.append('return_photo', returnPhoto);
        formData.append('return_condition', returnCondition);
        if (notes) {
            formData.append('notes', notes);
        }

        router.post('/tool-loans/return', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Pengembalian alat berhasil dicatat');
                // Reset form
                setStep(1);
                setUnitCode('');
                setVerifiedStudent(null);
                setActiveLoan(null);
                setReturnCondition('good');
                setReturnPhoto(null);
                setPhotoPreview(null);
                setNotes('');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                if (errors.student_id) {
                    toast.error(errors.student_id);
                } else if (errors.return_photo) {
                    toast.error(errors.return_photo);
                } else if (errors.return_condition) {
                    toast.error(errors.return_condition);
                } else {
                    toast.error('Terjadi kesalahan saat menyimpan data');
                }
            },
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Pengembalian Alat" />

            <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Link href="/tool-loans">
                            <Button variant="ghost" className="mb-2">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Menu
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pengembalian Alat</h1>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1">
                                Scan QR code untuk memverifikasi siswa dan alat yang akan dikembalikan
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
                            <span className="font-medium">Scan QR Alat</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                            }`}>
                                {step > 3 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
                            </div>
                            <span className="font-medium">Kondisi Alat</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                step >= 4 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                            }`}>
                                4
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
                                    Scan QR code NIS siswa untuk memulai pengembalian
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Button
                                        type="button"
                                        size="lg"
                                        className="h-24 w-24 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                                        onClick={() => {
                                            setScannerType('student');
                                            setIsScannerOpen(true);
                                        }}
                                    >
                                        <Camera className="h-12 w-12" />
                                    </Button>
                                    <p className="mt-6 text-sm text-muted-foreground text-center max-w-md">
                                        Tekan tombol kamera untuk memindai QR code NIS siswa
                                    </p>
                                </div>

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
                                        <Button
                                            onClick={() => setStep(2)}
                                            className="w-full mt-4"
                                            size="lg"
                                        >
                                            Lanjutkan ke Scan Alat
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Verify Tool */}
                    {step === 2 && verifiedStudent && (
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <CardTitle className="text-2xl mb-2">Scan QR Code Alat</CardTitle>
                                <CardDescription className="text-base">
                                    Scan QR code alat yang akan dikembalikan
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

                                <div className="flex flex-col items-center justify-center py-6">
                                    <Button
                                        type="button"
                                        size="lg"
                                        className="h-24 w-24 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                                        onClick={() => {
                                            setScannerType('tool');
                                            setIsScannerOpen(true);
                                        }}
                                        disabled={isVerifyingTool}
                                    >
                                        <Camera className="h-12 w-12" />
                                    </Button>
                                    <p className="mt-6 text-sm text-muted-foreground text-center max-w-md">
                                        Tekan tombol kamera untuk memindai QR code alat
                                    </p>
                                </div>

                                {toolVerificationError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center">
                                        {toolVerificationError}
                                    </div>
                                )}

                                {activeLoan && (
                                    <div className="p-6 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg space-y-4">
                                        <div className="flex items-center justify-center mb-2">
                                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="font-semibold text-lg">Pinjaman Ditemukan</p>
                                            <div className="space-y-1">
                                                <p className="font-medium">{activeLoan.tool_unit?.tool?.name}</p>
                                                <p className="text-sm text-muted-foreground">Kode: {activeLoan.tool_unit?.unit_code}</p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Dipinjam: {new Date(activeLoan.borrowed_at).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setStep(3)}
                                            className="w-full mt-4"
                                            size="lg"
                                        >
                                            Lanjutkan ke Pilih Kondisi
                                        </Button>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setStep(1);
                                            setUnitCode('');
                                            setActiveLoan(null);
                                        }}
                                        className="w-full"
                                    >
                                        Ganti Siswa
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Select Condition */}
                    {step === 3 && verifiedStudent && activeLoan && (
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <CardTitle className="text-2xl mb-2">Pilih Kondisi Alat</CardTitle>
                                <CardDescription className="text-base">
                                    Pilih kondisi alat saat dikembalikan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <div className="space-y-2">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Siswa</p>
                                            <p className="font-semibold">{verifiedStudent.name}</p>
                                            <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <p className="text-sm font-medium text-muted-foreground text-center">Alat</p>
                                            <p className="font-semibold text-center">{activeLoan.tool_unit?.tool?.name}</p>
                                            <p className="text-xs text-muted-foreground text-center">Unit: {activeLoan.tool_unit?.unit_code}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="return_condition" className="text-base font-semibold">Kondisi Alat</Label>
                                    <Select
                                        value={returnCondition}
                                        onValueChange={(value: 'good' | 'damaged') => setReturnCondition(value)}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Pilih kondisi alat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="good">Baik</SelectItem>
                                            <SelectItem value="damaged">Rusak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Kondisi alat akan diupdate setelah pengembalian dicatat
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(2)}
                                        className="flex-1"
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        onClick={() => setStep(4)}
                                        className="flex-1"
                                        size="lg"
                                    >
                                        Lanjutkan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 4: Photo & Submit */}
                    {step === 4 && verifiedStudent && activeLoan && (
                        <form onSubmit={handleSubmit}>
                            <Card className="border-2">
                                <CardHeader className="text-center pb-6">
                                    <CardTitle className="text-2xl mb-2">Ambil Foto & Submit</CardTitle>
                                    <CardDescription className="text-base">
                                        Ambil foto alat yang dikembalikan dan konfirmasi data
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="space-y-2">
                                            <div className="text-center space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Siswa</p>
                                                <p className="font-semibold">{verifiedStudent.name}</p>
                                                <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                            </div>
                                            <div className="border-t pt-2 mt-2">
                                                <p className="text-sm font-medium text-muted-foreground text-center">Alat</p>
                                                <p className="font-semibold text-center">{activeLoan.tool_unit?.tool?.name}</p>
                                                <p className="text-xs text-muted-foreground text-center">Unit: {activeLoan.tool_unit?.unit_code}</p>
                                                <div className="flex justify-center mt-2">
                                                    <Badge variant="secondary">
                                                        Kondisi: {returnCondition === 'good' ? 'Baik' : 'Rusak'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Foto Alat *</Label>
                                        {photoPreview ? (
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="relative">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="w-full max-w-md rounded-lg border-2 shadow-lg"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setReturnPhoto(null);
                                                        setPhotoPreview(null);
                                                    }}
                                                >
                                                    Ganti Foto
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-32 w-32 rounded-full"
                                                    onClick={() => setIsPhotoDialogOpen(true)}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Camera className="h-8 w-8" />
                                                        <span className="text-sm">Ambil Foto</span>
                                                    </div>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-base font-semibold">Catatan (Opsional)</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Catatan tambahan untuk pengembalian"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={4}
                                            className="resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(3)}
                                            className="flex-1"
                                        >
                                            Kembali
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !returnPhoto}
                                            className="flex-1"
                                            size="lg"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengembalian'}
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
                        title="Ambil Foto Alat"
                        description="Posisikan alat dalam frame kamera"
                    />
                </div>
            </div>
        </div>
    );
}


