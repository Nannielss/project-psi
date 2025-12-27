import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const [activeLoan, setActiveLoan] = useState<ToolLoan | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');

    const [returnCondition, setReturnCondition] = useState<'good' | 'damaged' | 'service'>('good');
    const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

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
            setVerificationError('Masukkan NIS terlebih dahulu');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            const response = await axios.post('/tool-loans/get-active-loan', { nis: nisValue });
            if (response.data.success) {
                setVerifiedStudent(response.data.student);
                setActiveLoan(response.data.loan);
                setNis(nisValue);
                setStep(2);
                toast.success('Pinjaman aktif ditemukan');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Siswa dengan NIS tersebut tidak ditemukan atau tidak memiliki pinjaman aktif';
            setVerificationError(errorMessage);
            setVerifiedStudent(null);
            setActiveLoan(null);
            toast.error(errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleQRScanSuccess = (decodedText: string) => {
        handleVerifyStudent(decodedText);
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
        formData.append('student_id', verifiedStudent.id.toString());
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
                setNis('');
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
                            <h1 className="text-3xl font-bold tracking-tight">Pengembalian Alat</h1>
                            <p className="text-muted-foreground">
                                Scan QR identitas siswa, pilih kondisi alat, lalu ambil foto untuk mengembalikan alat
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
                            <span className="font-medium">Kondisi Alat</span>
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
                                    Scan QR code atau masukkan NIS siswa untuk melihat pinjaman aktif
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
                                                setVerificationError('');
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
                                            disabled={isVerifying}
                                        >
                                            {isVerifying ? 'Memverifikasi...' : 'Verifikasi'}
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>atau</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsScannerOpen(true)}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Scan QR Code
                                        </Button>
                                    </div>
                                </div>

                                {verificationError && (
                                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">{verificationError}</span>
                                    </div>
                                )}

                                {verifiedStudent && activeLoan && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900 dark:text-green-100">
                                                Pinjaman Aktif Ditemukan
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {verifiedStudent.name} (NIS: {verifiedStudent.nis})
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                Alat: {activeLoan.tool_unit?.tool?.name} - {activeLoan.tool_unit?.unit_code}
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                Dipinjam: {new Date(activeLoan.borrowed_at).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setStep(2)}
                                            disabled={!verifiedStudent || !activeLoan}
                                        >
                                            Lanjutkan
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Select Condition */}
                    {step === 2 && verifiedStudent && activeLoan && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pilih Kondisi Alat</CardTitle>
                                <CardDescription>
                                    Pilih kondisi alat saat dikembalikan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">Siswa: {verifiedStudent.name}</p>
                                    <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                    <p className="text-sm font-medium mt-2">Alat: {activeLoan.tool_unit?.tool?.name}</p>
                                    <p className="text-xs text-muted-foreground">Unit: {activeLoan.tool_unit?.unit_code}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="return_condition">Kondisi Alat</Label>
                                    <Select
                                        value={returnCondition}
                                        onValueChange={(value: 'good' | 'damaged' | 'service') => setReturnCondition(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kondisi alat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="good">Baik</SelectItem>
                                            <SelectItem value="damaged">Rusak</SelectItem>
                                            <SelectItem value="service">Perlu Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        Kondisi alat akan diupdate setelah pengembalian dicatat
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali
                                    </Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        className="flex-1"
                                    >
                                        Lanjutkan
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Photo & Submit */}
                    {step === 3 && verifiedStudent && activeLoan && (
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ambil Foto & Submit</CardTitle>
                                    <CardDescription>
                                        Ambil foto alat yang dikembalikan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium">Siswa: {verifiedStudent.name}</p>
                                        <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                        <p className="text-sm font-medium mt-2">Alat: {activeLoan.tool_unit?.tool?.name}</p>
                                        <p className="text-xs text-muted-foreground">Unit: {activeLoan.tool_unit?.unit_code}</p>
                                        <Badge variant="secondary" className="mt-2">
                                            Kondisi: {returnCondition === 'good' ? 'Baik' : returnCondition === 'damaged' ? 'Rusak' : 'Perlu Service'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Foto Alat</Label>
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
                                                        setReturnPhoto(null);
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
                                            placeholder="Catatan tambahan untuk pengembalian"
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
                                            disabled={isSubmitting || !returnPhoto}
                                            className="flex-1"
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


