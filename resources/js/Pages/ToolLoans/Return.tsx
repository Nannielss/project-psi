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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package } from 'lucide-react';
import { Student, Teacher, ToolLoan, PageProps } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';
import { PhotoCapture } from '@/components/features/camera/PhotoCapture';

interface ReturnPageProps extends PageProps {
    deviceLocation?: {
        id: number;
        name: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

interface ReturnItem {
    loan: ToolLoan;
    condition: 'good' | 'damaged';
    notes: string;
}

export default function Return() {
    const { flash, deviceLocation } = usePage<ReturnPageProps>().props;
    const [code, setCode] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
    const [verifiedTeacher, setVerifiedTeacher] = useState<Teacher | null>(null);
    const [borrowerType, setBorrowerType] = useState<'student' | 'teacher' | null>(null);
    const [_isVerifyingBorrower, setIsVerifyingBorrower] = useState(false);
    const [borrowerVerificationError, setBorrowerVerificationError] = useState('');

    const [activeLoans, setActiveLoans] = useState<ToolLoan[]>([]);
    const [isLoadingLoans, setIsLoadingLoans] = useState(false);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

    const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Show toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Load active loans when borrower is verified
    useEffect(() => {
        if ((verifiedStudent || verifiedTeacher) && borrowerType) {
            loadActiveLoans();
        }
    }, [verifiedStudent, verifiedTeacher, borrowerType]);

    // Auto-open camera when loans are loaded and no photo yet
    useEffect(() => {
        if ((verifiedStudent || verifiedTeacher) && returnItems.length > 0 && !photoPreview) {
            setIsPhotoOpen(true);
        }
    }, [verifiedStudent, verifiedTeacher, returnItems.length, photoPreview]);

    const loadActiveLoans = async () => {
        if (!borrowerType || (!verifiedStudent && !verifiedTeacher)) return;

        setIsLoadingLoans(true);
        try {
            const endpoint = borrowerType === 'student' 
                ? `/tool-loans/active-loans/student/${verifiedStudent!.id}`
                : `/tool-loans/active-loans/teacher/${verifiedTeacher!.id}`;
            
            const response = await axios.get(endpoint);
            if (response.data.success) {
                const loans = response.data.loans;
                const currentLocationId = response.data.current_location_id;

                // Filter loans: only show loans from current location
                let loansToReturn = loans;
                if (currentLocationId) {
                    // Filter to only include loans from current location
                    loansToReturn = loans.filter((loan: ToolLoan) =>
                        !loan.device_location_id || loan.device_location_id === currentLocationId
                    );

                    // Check if there are loans from other locations (for info message)
                    const locationMismatchLoans = loans.filter((loan: ToolLoan) =>
                        loan.device_location_id && loan.device_location_id !== currentLocationId
                    );

                    if (locationMismatchLoans.length > 0) {
                        // Group by location for informative message
                        const groupedByLocation: Record<string, string[]> = {};
                        locationMismatchLoans.forEach((loan: ToolLoan) => {
                            const locationName = loan.device_location?.name || 'lokasi lain';
                            if (!groupedByLocation[locationName]) {
                                groupedByLocation[locationName] = [];
                            }
                            groupedByLocation[locationName].push(loan.tool_unit?.unit_code || '');
                        });

                        // Build message based on whether there are returnable loans
                        const locationMessages: string[] = [];
                        Object.entries(groupedByLocation).forEach(([location, codes]) => {
                            const count = codes.length;
                            locationMessages.push(`${count} alat harus dikembalikan di ${location}`);
                        });

                        if (loansToReturn.length === 0) {
                            // No loans can be returned at current location - show error message
                            const errorMessage = `Alat tidak dapat dikembalikan di lokasi ini. ${locationMessages.join('. ')}`;
                            toast.error(errorMessage, { duration: 6000 });
                            // Reset state and redirect back to tool-loans page after showing error
                            setVerifiedStudent(null);
                            setVerifiedTeacher(null);
                            setBorrowerType(null);
                            setActiveLoans([]);
                            setReturnItems([]);
                            setTimeout(() => {
                                router.visit('/tool-loans');
                            }, 2000);
                        } else {
                            // Some loans can be returned - show informative message
                            const infoMessage = `Sisa ${locationMessages.join('. ')}`;
                            toast.warning(infoMessage, { duration: 5000 });
                        }
                    }
                }

                setActiveLoans(loansToReturn);
                // Initialize return items with default condition 'good'
                setReturnItems(loansToReturn.map((loan: ToolLoan) => ({
                    loan,
                    condition: 'good' as const,
                    notes: '',
                })));
            }
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal memuat daftar pinjaman';
            toast.error(errorMessage);
            setVerifiedStudent(null);
            setVerifiedTeacher(null);
            setBorrowerType(null);
            setActiveLoans([]);
            setReturnItems([]);
        } finally {
            setIsLoadingLoans(false);
        }
    };

    const handleVerifyBorrower = async (codeToVerify?: string) => {
        const codeValue = codeToVerify || code.trim();
        if (!codeValue) {
            setBorrowerVerificationError('Masukkan NIS atau NIP terlebih dahulu');
            return;
        }

        setIsVerifyingBorrower(true);
        setBorrowerVerificationError('');

        try {
            const response = await axios.post('/tool-loans/verify-borrower', { code: codeValue });
            if (response.data.success) {
                if (response.data.type === 'student') {
                    setVerifiedStudent(response.data.student);
                    setVerifiedTeacher(null);
                    setBorrowerType('student');
                    setCode(codeValue);
                } else if (response.data.type === 'teacher') {
                    setVerifiedTeacher(response.data.teacher);
                    setVerifiedStudent(null);
                    setBorrowerType('teacher');
                    setCode(codeValue);
                } else {
                    setBorrowerVerificationError('Data yang ditemukan bukan siswa atau guru');
                }
            } else {
                setBorrowerVerificationError('Siswa atau guru tidak ditemukan');
            }
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Siswa atau guru tidak ditemukan';
            setBorrowerVerificationError(errorMessage);
            setVerifiedStudent(null);
            setVerifiedTeacher(null);
            setBorrowerType(null);
        } finally {
            setIsVerifyingBorrower(false);
        }
    };

    const handleQRScanSuccess = (decodedText: string) => {
        handleVerifyBorrower(decodedText);
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
        setIsPhotoOpen(false);
    };


    const updateReturnItem = (index: number, updates: Partial<ReturnItem>) => {
        const newItems = [...returnItems];
        newItems[index] = { ...newItems[index], ...updates };
        setReturnItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!verifiedStudent && !verifiedTeacher) || returnItems.length === 0 || !returnPhoto) {
            toast.error('Pastikan semua data sudah lengkap');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('return_photo', returnPhoto);

        // Add returns array as JSON
        const returns = returnItems.map(item => ({
            tool_unit_id: item.loan.tool_unit_id,
            return_condition: item.condition,
            notes: item.condition === 'damaged' ? item.notes : null,
        }));
        formData.append('returns', JSON.stringify(returns));

        router.post('/tool-loans/return', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Pengembalian alat berhasil dicatat');
                router.visit('/tool-loans');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                if (errors.returns) {
                    toast.error(errors.returns);
                } else if (errors.return_photo) {
                    toast.error(errors.return_photo);
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
                                    Scan QR code untuk memverifikasi siswa dan kembalikan semua alat yang dipinjam
                            </p>
                        </div>
                    </div>


                    {/* Verify Borrower */}
                    {!verifiedStudent && !verifiedTeacher && (
                        <Card className="border-2">
                            <CardContent className="space-y-6 pt-6">
                                <QRScanner
                                    open={true}
                                    onClose={() => { }}
                                    onScanSuccess={handleQRScanSuccess}
                                    onScanError={handleQRScanError}
                                    inline={true}
                                />

                                {borrowerVerificationError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center">
                                        {borrowerVerificationError}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Return Form - All in One */}
                    {(verifiedStudent || verifiedTeacher) && (
                        <form onSubmit={handleSubmit}>
                            <Card className="border-2">
                                <CardContent className="space-y-6 pt-6">
                                    {/* Borrower Info */}
                                    <div className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {borrowerType === 'student' ? 'Siswa' : 'Guru'} Terverifikasi
                                            </p>
                                            <p className="font-semibold">
                                                {verifiedStudent?.name || verifiedTeacher?.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {borrowerType === 'student' ? `NIS: ${verifiedStudent?.nis}` : `NIP: ${code}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* List Barang */}
                                    {isLoadingLoans ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">Memuat daftar pinjaman...</p>
                                        </div>
                                    ) : activeLoans.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Tidak ada alat yang sedang dipinjam</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base font-semibold">Daftar Barang yang Dipinjam</Label>
                                                    <Badge variant="secondary" className="text-sm">
                                                        {activeLoans.length} alat
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {returnItems.map((item, index) => (
                                                        <div
                                                            key={item.loan.id}
                                                            className="p-3 border-2 rounded-lg"
                                                        >
                                                            <div className="space-y-1 mb-3">
                                                                <p className="font-medium">{item.loan.tool_unit?.tool?.name}</p>
                                                                <p className="text-sm text-muted-foreground">Kode: {item.loan.tool_unit?.unit_code}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Dipinjam: {new Date(item.loan.borrowed_at).toLocaleString('id-ID')}
                                                                </p>
                                                            </div>

                                                            {/* Kondisi Alat */}
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`condition-${index}`} className="text-sm font-semibold">
                                                                    Kondisi Alat
                                                                </Label>
                                                                <Select
                                                                    value={item.condition}
                                                                    onValueChange={(value: 'good' | 'damaged') => {
                                                                        updateReturnItem(index, {
                                                                            condition: value,
                                                                            notes: value === 'good' ? '' : item.notes
                                                                        });
                                                                    }}
                                                                >
                                                                    <SelectTrigger id={`condition-${index}`} className="h-10">
                                                                        <SelectValue placeholder="Pilih kondisi alat" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="good">Baik</SelectItem>
                                                                        <SelectItem value="damaged">Rusak</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                {item.condition === 'damaged' && (
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`notes-${index}`} className="text-sm font-semibold">
                                                                            Catatan Kerusakan *
                                                                        </Label>
                                                                        <Textarea
                                                                            id={`notes-${index}`}
                                                                            placeholder="Jelaskan kondisi kerusakan alat..."
                                                                            value={item.notes}
                                                                            onChange={(e) => updateReturnItem(index, { notes: e.target.value })}
                                                                            rows={2}
                                                                            className="resize-none"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Foto Wajah dan Alat */}
                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold">Foto Wajah dan Alat *</Label>
                                                {photoPreview ? (
                                                    <div className="flex flex-col items-center space-y-4">
                                                        <div className="relative w-full max-w-xs flex items-center justify-center bg-muted rounded-lg border-2 shadow-lg p-4">
                                                            <img
                                                                src={photoPreview}
                                                                alt="Preview"
                                                                className="max-w-full max-h-64 w-auto h-auto object-contain rounded-lg"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setReturnPhoto(null);
                                                                setPhotoPreview(null);
                                                                setIsPhotoOpen(true);
                                                            }}
                                                        >
                                                            Ganti Foto
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <PhotoCapture
                                                        open={isPhotoOpen}
                                                        onClose={() => setIsPhotoOpen(false)}
                                                        onCapture={handlePhotoCapture}
                                                        title="Ambil Foto Wajah dan Alat"
                                                        description="Posisikan wajah dan alat dalam frame kamera"
                                                        inline={true}
                                                    />
                                                )}
                                            </div>

                                            {/* Submit Buttons */}
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setVerifiedStudent(null);
                                                        setVerifiedTeacher(null);
                                                        setBorrowerType(null);
                                                        setActiveLoans([]);
                                                        setReturnItems([]);
                                                        setReturnPhoto(null);
                                                        setPhotoPreview(null);
                                                        setIsPhotoOpen(false);
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Ganti {borrowerType === 'student' ? 'Siswa' : 'Guru'}
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting || !returnPhoto || returnItems.length === 0 || returnItems.some(item => item.condition === 'damaged' && !item.notes.trim())}
                                                    className="flex-1"
                                                    size="lg"
                                                >
                                                    {isSubmitting ? 'Menyimpan...' : `Simpan Pengembalian (${returnItems.length} alat)`}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
