import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Camera, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
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
    const [currentToolIndex, setCurrentToolIndex] = useState<number | null>(null);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [isStudentPhotoDialogOpen, setIsStudentPhotoDialogOpen] = useState(false);

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
        const codeValue = codeToVerify || unitCode.trim();
        if (!codeValue) {
            setToolVerificationError('Masukkan kode alat');
            return;
        }

        // Check if already added
        if (selectedTools.some(t => t.toolUnit.unit_code === codeValue)) {
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

    const handleRemoveTool = (index: number) => {
        setSelectedTools(selectedTools.filter((_, i) => i !== index));
    };

    const handlePhotoCapture = (file: File) => {
        if (currentToolIndex !== null) {
            const updatedTools = [...selectedTools];
            updatedTools[currentToolIndex].photo = file;
            const reader = new FileReader();
            reader.onloadend = () => {
                updatedTools[currentToolIndex].photoPreview = reader.result as string;
                setSelectedTools(updatedTools);
            };
            reader.readAsDataURL(file);
            setIsPhotoDialogOpen(false);
            setCurrentToolIndex(null);
        }
    };

    const handleStudentPhotoCapture = (file: File) => {
        setStudentPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setStudentPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setIsStudentPhotoDialogOpen(false);
    };

    const handleOpenPhotoDialog = (index: number) => {
        setCurrentToolIndex(index);
        setIsPhotoDialogOpen(true);
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

        // Check all tools have photos
        const toolsWithoutPhoto = selectedTools.filter(t => !t.photo);
        if (toolsWithoutPhoto.length > 0) {
            toast.error('Semua alat harus memiliki foto');
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
                    // Use student photo for all tools (or use tool photo if preferred)
                    formData.append('borrow_photo', studentPhoto);

                    await axios.post('/tool-loans/borrow', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    results.push({ success: true, tool: tool.toolUnit.unit_code });
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message;
                    results.push({ success: false, tool: tool.toolUnit.unit_code, error: errorMessage });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const failedCount = results.filter(r => !r.success).length;

            if (successCount > 0) {
                toast.success(`${successCount} alat berhasil dipinjam`);
            }
            if (failedCount > 0) {
                toast.error(`${failedCount} alat gagal dipinjam`);
            }

            // Reset form if all successful
            if (failedCount === 0) {
                setStep(1);
                setNis('');
                setVerifiedStudent(null);
                setSelectedTools([]);
                setUnitCode('');
                setStudentPhoto(null);
                setStudentPhotoPreview(null);
            } else {
                // Remove successfully submitted tools
                const failedTools = results.filter(r => !r.success).map(r => r.tool);
                setSelectedTools(selectedTools.filter(t => failedTools.includes(t.toolUnit.unit_code)));
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

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-6">
                    <div>
                        <Link href="/tool-loans">
                            <Button variant="ghost" className="mb-4">
                                ← Kembali
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">Peminjaman Alat</h1>
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
                            <span className="font-medium">Tambah Alat</span>
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
                                <CardTitle>Scan NIS Siswa</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setScannerType('student');
                                                setIsScannerOpen(true);
                                            }}
                                        >
                                            <Camera className="h-100 w-100" />
                                        </Button>
                                    </div>
                                </div>

                                {studentVerificationError && (
                                    <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                        {studentVerificationError}
                                    </div>
                                )}

                                {verifiedStudent && (
                                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                        <p className="font-medium">{verifiedStudent.name}</p>
                                        <p className="text-sm text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                        <Button
                                            onClick={() => setStep(2)}
                                            className="mt-3"
                                        >
                                            Lanjutkan
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Add Tools */}
                    {step === 2 && verifiedStudent && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tambah Alat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">{verifiedStudent.name}</p>
                                    <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Kode Unit</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Masukkan kode atau scan QR"
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
                                            {isVerifyingTool ? '...' : 'Tambah'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setScannerType('tool');
                                                setIsScannerOpen(true);
                                            }}
                                        >
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {toolVerificationError && (
                                    <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                        {toolVerificationError}
                                    </div>
                                )}

                                {selectedTools.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Daftar Alat ({selectedTools.length})</Label>
                                        {selectedTools.map((tool, index) => (
                                            <div key={index} className="p-3 border rounded-md flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{tool.toolUnit.tool?.name}</p>
                                                    <p className="text-sm text-muted-foreground">{tool.toolUnit.unit_code}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {tool.photoPreview ? (
                                                        <img src={tool.photoPreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenPhotoDialog(index)}
                                                        >
                                                            <Camera className="h-4 w-4 mr-1" />
                                                            Foto
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveTool(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setStep(1);
                                            setSelectedTools([]);
                                        }}
                                    >
                                        Ganti Siswa
                                    </Button>
                                    {selectedTools.length > 0 && (
                                        <Button
                                            onClick={() => setStep(3)}
                                            className="flex-1"
                                        >
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Konfirmasi Peminjaman</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="font-medium">{verifiedStudent.name}</p>
                                        <p className="text-sm text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Foto Wajah Siswa *</Label>
                                        {studentPhotoPreview ? (
                                            <div className="space-y-2">
                                                <img src={studentPhotoPreview} alt="Foto Wajah" className="w-48 h-48 object-cover rounded border" />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setStudentPhoto(null);
                                                        setStudentPhotoPreview(null);
                                                    }}
                                                >
                                                    Ganti Foto
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsStudentPhotoDialogOpen(true)}
                                            >
                                                <Camera className="h-4 w-4 mr-2" />
                                                Ambil Foto Wajah
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Alat yang Dipinjam ({selectedTools.length})</Label>
                                        {selectedTools.map((tool, index) => (
                                            <div key={index} className="p-3 border rounded-md">
                                                <p className="font-medium">{tool.toolUnit.tool?.name}</p>
                                                <p className="text-sm text-muted-foreground">{tool.toolUnit.unit_code}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(2)}
                                        >
                                            Kembali
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !studentPhoto}
                                            className="flex-1"
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

            <QRScanner
                open={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleQRScanSuccess}
                onScanError={(error) => toast.error(error)}
            />

            <PhotoCapture
                open={isPhotoDialogOpen}
                onClose={() => {
                    setIsPhotoDialogOpen(false);
                    setCurrentToolIndex(null);
                }}
                onCapture={handlePhotoCapture}
                title="Ambil Foto Alat"
            />

            <PhotoCapture
                open={isStudentPhotoDialogOpen}
                onClose={() => setIsStudentPhotoDialogOpen(false)}
                onCapture={handleStudentPhotoCapture}
                title="Ambil Foto Wajah Siswa"
                description="Posisikan wajah siswa dalam frame kamera"
            />
        </div>
    );
}
