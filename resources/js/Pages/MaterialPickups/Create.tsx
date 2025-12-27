import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
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
import { QrCode, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Upload, Camera } from 'lucide-react';
import { PageProps, Material, Teacher } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';

interface MaterialPickupsCreatePageProps extends PageProps {
    materials: Material[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Create({ materials }: MaterialPickupsCreatePageProps) {
    const { flash } = usePage<MaterialPickupsCreatePageProps>().props;
    const [step, setStep] = useState(1);
    const [nip, setNip] = useState('');
    const [verifiedTeacher, setVerifiedTeacher] = useState<Teacher | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [formData, setFormData] = useState({
        material_id: '',
        jumlah: 1,
        keterangan: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleVerifyQR = async (nipToVerify?: string) => {
        const nipValue = nipToVerify || nip.trim();
        if (!nipValue) {
            setVerificationError('Masukkan NIP terlebih dahulu');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            const response = await axios.post('/material-pickups/verify-qr', { nip: nipValue });
            if (response.data.success) {
                setVerifiedTeacher(response.data.teacher);
                setNip(nipValue);
                setStep(2);
                toast.success('Identitas guru berhasil diverifikasi');
            }
        } catch (error: any) {
            setVerificationError(
                error.response?.data?.message || 'Guru dengan NIP tersebut tidak ditemukan'
            );
            setVerifiedTeacher(null);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleQRScanSuccess = (decodedText: string) => {
        // QR code contains NIP, verify it
        handleVerifyQR(decodedText);
    };

    const handleQRScanError = (error: string) => {
        toast.error(error);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For now, we'll extract NIP from filename or ask user to input
        // In a full implementation, you would decode QR from image here
        // For simplicity, we'll show a message to manually enter NIP
        toast.info('Silakan masukkan NIP secara manual atau gunakan scanner QR code');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedTeacher) {
            toast.error('Verifikasi identitas guru terlebih dahulu');
            return;
        }

        const selectedMaterial = materials.find(m => m.id === parseInt(formData.material_id));
        if (!selectedMaterial) {
            toast.error('Pilih bahan terlebih dahulu');
            return;
        }

        if (selectedMaterial.stok < formData.jumlah) {
            toast.error(`Stok tidak mencukupi. Stok tersedia: ${selectedMaterial.stok}`);
            return;
        }

        setIsSubmitting(true);

        router.post('/material-pickups', {
            material_id: formData.material_id,
            teacher_id: verifiedTeacher.id,
            jumlah: formData.jumlah,
            keterangan: formData.keterangan || undefined,
        }, {
            onSuccess: () => {
                toast.success('Pengambilan bahan berhasil dicatat');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                if (errors.jumlah) {
                    toast.error(errors.jumlah);
                } else {
                    toast.error('Terjadi kesalahan saat menyimpan data');
                }
            },
        });
    };

    const selectedMaterial = materials.find(m => m.id === parseInt(formData.material_id));

    return (
        <DashboardLayout>
            <Head title="Ambil Bahan" />

            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ambil Bahan</h1>
                    <p className="text-muted-foreground">
                        Verifikasi identitas guru dan catat pengambilan bahan
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                            step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                        }`}>
                            {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                        </div>
                        <span className="font-medium">Verifikasi Identitas</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                            step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
                        }`}>
                            2
                        </div>
                        <span className="font-medium">Pilih Bahan</span>
                    </div>
                </div>

                {/* Step 1: Verify Teacher */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Verifikasi Identitas Guru</CardTitle>
                            <CardDescription>
                                Scan QR code atau masukkan NIP guru
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nip">NIP Guru</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="nip"
                                        placeholder="Masukkan NIP atau scan QR code"
                                        value={nip}
                                        onChange={(e) => {
                                            setNip(e.target.value);
                                            setVerificationError('');
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleVerifyQR();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleVerifyQR}
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
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload QR Code
                                    </Button>
                                </div>
                            </div>

                            {verificationError && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm">{verificationError}</span>
                                </div>
                            )}

                            {verifiedTeacher && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <div className="flex-1">
                                        <p className="font-medium text-green-900 dark:text-green-100">
                                            Identitas Terverifikasi
                                        </p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            {verifiedTeacher.name} (NIP: {verifiedTeacher.nip})
                                        </p>
                                        {verifiedTeacher.subjects && verifiedTeacher.subjects.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {verifiedTeacher.subjects.map((subject) => (
                                                    <Badge key={subject.id} variant="secondary" className="text-xs">
                                                        {subject.nama}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!verifiedTeacher}
                                    >
                                        Lanjutkan
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Select Material */}
                {step === 2 && verifiedTeacher && (
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Pilih Bahan</CardTitle>
                                <CardDescription>
                                    Pilih bahan yang akan diambil oleh {verifiedTeacher.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">Guru: {verifiedTeacher.name}</p>
                                    <p className="text-xs text-muted-foreground">NIP: {verifiedTeacher.nip}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="material_id">Bahan</Label>
                                    <Select
                                        value={formData.material_id}
                                        onValueChange={(value) => setFormData({ ...formData, material_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih bahan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {materials.map((material) => (
                                                <SelectItem
                                                    key={material.id}
                                                    value={material.id.toString()}
                                                    disabled={material.stok === 0}
                                                >
                                                    {material.nama_bahan} - Stok: {material.stok} {material.satuan}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedMaterial && (
                                        <div className="text-sm text-muted-foreground">
                                            Stok tersedia: {selectedMaterial.stok} {selectedMaterial.satuan}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jumlah">Jumlah</Label>
                                    <Input
                                        id="jumlah"
                                        type="number"
                                        min="1"
                                        max={selectedMaterial?.stok || 1}
                                        value={formData.jumlah}
                                        onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                    {selectedMaterial && (
                                        <div className="text-sm text-muted-foreground">
                                            Satuan: {selectedMaterial.satuan}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                                    <Textarea
                                        id="keterangan"
                                        placeholder="Keterangan pengambilan bahan"
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        rows={3}
                                    />
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
                                        type="submit"
                                        disabled={isSubmitting || !formData.material_id}
                                        className="flex-1"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Pengambilan'}
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
            </div>
        </DashboardLayout>
    );
}

