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
import { Trash2, CheckCircle2, ArrowRight, Package, Search, QrCode } from 'lucide-react';
import { Student, ToolUnit, Teacher, Subject } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { QRScanner } from '@/components/features/qr/QRScanner';
import { PhotoCapture } from '@/components/features/camera/PhotoCapture';
import { ToolCodeAutocomplete } from '@/components/features/tools/ToolCodeAutocomplete';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
    const { flash, auth } = usePage().props as BorrowPageProps & { auth: { user: { role?: string; teacher?: Teacher } } };
    const currentUser = auth?.user;
    const isGuru = currentUser?.role === 'guru';

    const [step, setStep] = useState(1);
    const [nis, setNis] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
    const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
    const [studentActiveLoans, setStudentActiveLoans] = useState<Array<{ id: number; tool_name: string; unit_code: string; borrowed_at: string }>>([]);
    const [isConfirmStudentOpen, setIsConfirmStudentOpen] = useState(false);
    const [_isVerifyingStudent, setIsVerifyingStudent] = useState(false);
    const [_studentVerificationError, setStudentVerificationError] = useState('');
    const [qrScannerKey, setQrScannerKey] = useState(0);

    // Teacher verification state (for guru self-borrowing)
    const [nip, setNip] = useState('');
    const [verifiedTeacher, setVerifiedTeacher] = useState<Teacher | null>(null);
    const [pendingTeacher, setPendingTeacher] = useState<Teacher | null>(null);
    const [isConfirmTeacherOpen, setIsConfirmTeacherOpen] = useState(false);
    const [_isVerifyingTeacher, setIsVerifyingTeacher] = useState(false);
    const [_teacherVerificationError, setTeacherVerificationError] = useState('');

    const [unitCode, setUnitCode] = useState('');
    const [isVerifyingTool, setIsVerifyingTool] = useState(false);
    const [toolVerificationError, setToolVerificationError] = useState('');
    const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);

    const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
    const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tab and Catalog state
    const [activeTab, setActiveTab] = useState<'search' | 'qr'>('search');
    const [toolsCatalog, setToolsCatalog] = useState<Array<{
        id: number;
        name: string;
        code: string;
        location: string;
        photo: string | null;
        description: string | null;
        available_stock: number;
    }>>([]);
    const [filteredCatalog, setFilteredCatalog] = useState<Array<{
        id: number;
        name: string;
        code: string;
        location: string;
        photo: string | null;
        description: string | null;
        available_stock: number;
    }>>([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
    const [selectedToolForCatalog, setSelectedToolForCatalog] = useState<{
        id: number;
        name: string;
        code: string;
    } | null>(null);
    const [availableUnits, setAvailableUnits] = useState<Array<{
        id: number;
        unit_code: string;
        unit_number: number;
        condition: string;
    }>>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

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
            } catch {
                // Ignore error
            }
    };

    const handleVerifyBorrower = async (codeToVerify?: string) => {
        const codeValue = codeToVerify || (isGuru ? nip.trim() : nis.trim());
        if (!codeValue) {
            if (isGuru) {
                setTeacherVerificationError('Masukkan NIP terlebih dahulu');
            } else {
                setStudentVerificationError('Masukkan NIS terlebih dahulu');
            }
            return;
        }

        // Set loading state based on user type
        if (isGuru) {
            setIsVerifyingTeacher(true);
            setTeacherVerificationError('');
        } else {
            setIsVerifyingStudent(true);
            setStudentVerificationError('');
        }

        try {
            const response = await axios.post('/tool-loans/verify-borrower', { code: codeValue });
            if (response.data.success) {
                if (response.data.type === 'student') {
                    setPendingStudent(response.data.student);
                    setStudentActiveLoans(response.data.active_loans || []);
                    setNis(codeValue);

                    // Check if student has active loans
                    if (response.data.has_active_loan) {
                        const toolNames = response.data.active_loans
                            .map((loan: { tool_name: string; unit_code: string }) =>
                                `${loan.tool_name} (${loan.unit_code})`
                            )
                            .join(', ');
                        const errorMessage = `Siswa masih memiliki pinjaman aktif. Harap kembalikan terlebih dahulu: ${toolNames}`;
                        toast.error(errorMessage);
                        // Reset states and QR scanner to reactivate camera
                        setPendingStudent(null);
                        setStudentActiveLoans([]);
                        setStudentVerificationError('');
                        setIsVerifyingStudent(false);
                        // Reset QRScanner by changing key to force re-render and reactivate camera
                        setQrScannerKey(prev => prev + 1);
                        return;
                    }

                    setIsConfirmStudentOpen(true);
                } else if (response.data.type === 'teacher') {
                    setPendingTeacher(response.data.teacher);
                    setNip(codeValue);
                    setIsConfirmTeacherOpen(true);
                }
            }
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Peminjam tidak ditemukan';
            toast.error(errorMessage);
            if (isGuru) {
                setTeacherVerificationError('');
                setVerifiedTeacher(null);
                setPendingTeacher(null);
                // Reset QRScanner to reactivate camera
                setQrScannerKey(prev => prev + 1);
            } else {
                setStudentVerificationError('');
                setVerifiedStudent(null);
                setPendingStudent(null);
                setStudentActiveLoans([]);
                // Reset QRScanner to reactivate camera
                setQrScannerKey(prev => prev + 1);
            }
        } finally {
            if (isGuru) {
                setIsVerifyingTeacher(false);
            } else {
                setIsVerifyingStudent(false);
            }
        }
    };

    const handleVerifyTool = async (codeToVerify?: string, skipToast = false) => {
        const codeValue = codeToVerify || unitCode.trim();
        if (!codeValue) {
            setToolVerificationError('Masukkan kode alat');
            return false;
        }

        setIsVerifyingTool(true);
        setToolVerificationError('');

        try {
            const response = await axios.post('/tool-loans/verify-tool', { unit_code: codeValue });
            if (response.data.success) {
                // Use functional update to ensure we have the latest state
                setSelectedTools((prevTools) => {
                    // Check if already added using current state
                    if (prevTools.some((t) => t.toolUnit.unit_code === codeValue)) {
                        setToolVerificationError('Alat ini sudah ditambahkan');
                        return prevTools;
                    }

                    const newTool: SelectedTool = {
                        toolUnit: response.data.tool_unit,
                        photo: null,
                        photoPreview: null,
                    };
                    return [...prevTools, newTool];
                });
                setUnitCode('');
                if (!skipToast) {
                    toast.success('Alat ditambahkan');
                }
                return true;
            }
            return false;
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Alat tidak ditemukan';
            setToolVerificationError(errorMessage);
            return false;
        } finally {
            setIsVerifyingTool(false);
        }
    };

    const handleConfirmTeacher = () => {
        if (!pendingTeacher) return;
        setVerifiedTeacher(pendingTeacher);
        setPendingTeacher(null);
        setIsConfirmTeacherOpen(false);
        setStep(2);
    };

    const handleCancelTeacher = () => {
        setPendingTeacher(null);
        setIsConfirmTeacherOpen(false);
        // Reset QRScanner by changing key to force re-render
        setQrScannerKey(prev => prev + 1);
        setTeacherVerificationError('');
    };

    const handleConfirmStudent = () => {
        if (!pendingStudent) return;

        // Double check: prevent confirmation if student has active loans
        if (studentActiveLoans.length > 0) {
            const toolNames = studentActiveLoans
                .map(loan => `${loan.tool_name} (${loan.unit_code})`)
                .join(', ');
            toast.error(`Siswa masih memiliki pinjaman aktif. Harap kembalikan terlebih dahulu: ${toolNames}`);
            setIsConfirmStudentOpen(false);
            // Reset QRScanner to reactivate camera
            setQrScannerKey(prev => prev + 1);
            return;
        }

        setVerifiedStudent(pendingStudent);
        setPendingStudent(null);
        setStudentActiveLoans([]);
        setIsConfirmStudentOpen(false);
        setStep(2);
    };

    const handleCancelStudent = () => {
        setPendingStudent(null);
        setStudentActiveLoans([]);
        setIsConfirmStudentOpen(false);
        // Reset QRScanner by changing key to force re-render
        setQrScannerKey(prev => prev + 1);
        setStudentVerificationError('');
    };

    const handleToolAutocompleteSelect = async (tool: { unit_code: string; tool_name: string; available_stock: number }) => {
        await handleVerifyTool(tool.unit_code);
    };

    const loadToolsCatalog = async () => {
        setIsLoadingCatalog(true);
        try {
            const response = await axios.get('/tool-loans/tools-catalog');
            if (response.data.success) {
                setToolsCatalog(response.data.tools);
                setFilteredCatalog(response.data.tools);
            }
            } catch {
                toast.error('Gagal memuat katalog alat');
            } finally {
            setIsLoadingCatalog(false);
        }
    };

    const handleOpenCatalog = () => {
        setIsCatalogDialogOpen(true);
        setCatalogSearch('');
        loadToolsCatalog();
    };

    // Filter catalog based on search
    useEffect(() => {
        if (!catalogSearch.trim()) {
            setFilteredCatalog(toolsCatalog);
        } else {
            const searchLower = catalogSearch.toLowerCase();
            setFilteredCatalog(toolsCatalog.filter(tool =>
                tool.name.toLowerCase().includes(searchLower) ||
                tool.code.toLowerCase().includes(searchLower) ||
                tool.location.toLowerCase().includes(searchLower)
            ));
        }
    }, [catalogSearch, toolsCatalog]);

    const handleSelectToolFromCatalog = async (tool: { id: number; name: string; code: string }) => {
        // Close catalog dialog first
        setIsCatalogDialogOpen(false);
        setCatalogSearch('');

        // Set selected tool and load units
        setSelectedToolForCatalog(tool);
        setIsLoadingUnits(true);
        setSelectedUnitIds([]);
        try {
            const response = await axios.get(`/tool-loans/tools/${tool.id}/available-units`);
            if (response.data.success) {
                setAvailableUnits(response.data.available_units);
                if (response.data.available_units.length === 0) {
                    toast.error('Tidak ada unit yang tersedia untuk alat ini');
                    setSelectedToolForCatalog(null);
                }
            }
            } catch {
                toast.error('Gagal memuat unit yang tersedia');
                setSelectedToolForCatalog(null);
            } finally {
            setIsLoadingUnits(false);
        }
    };

    const handleToggleUnitSelection = (unitId: string) => {
        setSelectedUnitIds(prev => {
            if (prev.includes(unitId)) {
                return prev.filter(id => id !== unitId);
            } else {
                return [...prev, unitId];
            }
        });
    };

    const handleAddUnitFromCatalog = async () => {
        if (selectedUnitIds.length === 0) {
            toast.error('Pilih minimal satu unit terlebih dahulu');
            return;
        }

        setIsVerifyingTool(true);
        let successCount = 0;
        let errorCount = 0;
        const toolsToAdd: SelectedTool[] = [];

        // First, verify all units and collect valid tools
        for (const unitId of selectedUnitIds) {
            const unit = availableUnits.find(u => u.id.toString() === unitId);
            if (!unit) {
                errorCount++;
                continue;
            }

            try {
                // Verify tool unit
                const response = await axios.post('/tool-loans/verify-tool', { unit_code: unit.unit_code });
                if (response.data.success) {
                    // Check if already in selectedTools or in our new list
                    const alreadyExists = selectedTools.some((t) => t.toolUnit.id === unit.id) ||
                                         toolsToAdd.some((t) => t.toolUnit.id === unit.id);

                    if (!alreadyExists) {
                        toolsToAdd.push({
                            toolUnit: response.data.tool_unit,
                            photo: null,
                            photoPreview: null,
                        });
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } else {
                    errorCount++;
                }
                } catch {
                    errorCount++;
                }
        }

        // Add all verified tools at once
        if (toolsToAdd.length > 0) {
            setSelectedTools((prevTools) => {
                // Filter out duplicates
                const existingIds = new Set(prevTools.map(t => t.toolUnit.id));
                const newTools = toolsToAdd.filter(t => !existingIds.has(t.toolUnit.id));
                return [...prevTools, ...newTools];
            });
        }

        setIsVerifyingTool(false);

        if (successCount > 0) {
            toast.success(`${successCount} unit berhasil ditambahkan`);
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} unit gagal ditambahkan`);
        }

        // Close dialog
        setSelectedToolForCatalog(null);
        setAvailableUnits([]);
        setSelectedUnitIds([]);
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

        // Check if borrower is verified
        // Must have either verifiedTeacher (for guru) or verifiedStudent (for student)
        if (!verifiedTeacher && !verifiedStudent) {
            toast.error('Verifikasi identitas peminjam terlebih dahulu dengan scan QR di step 1');
            return;
        }

        if (selectedTools.length === 0) {
            toast.error('Minimal 1 alat harus dipilih');
            return;
        }

        if (!studentPhoto) {
            toast.error('Foto wajib diambil');
            return;
        }

        setIsSubmitting(true);

        try {
            // Use batch endpoint if multiple tools, otherwise use single endpoint
            if (selectedTools.length > 1) {
                // Batch borrow: submit all tools at once
                const formData = new FormData();

                // Determine borrower: teacher takes priority if both exist
                if (verifiedTeacher) {
                    formData.append('borrower_teacher_id', verifiedTeacher.id.toString());
                } else if (verifiedStudent) {
                    formData.append('student_id', verifiedStudent.id.toString());
                }

                // Add all tool_unit_ids as array
                selectedTools.forEach((tool) => {
                    formData.append('tool_unit_ids[]', tool.toolUnit.id.toString());
                });

                formData.append('borrow_photo', studentPhoto);
                if (selectedTeacherId) {
                    formData.append('teacher_id', selectedTeacherId);
                }
                if (selectedSubjectId) {
                    formData.append('subject_id', selectedSubjectId);
                }

                try {
                    const response = await axios.post('/tool-loans/borrow-batch', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    if (response.data.success) {
                        toast.success(response.data.message || `${selectedTools.length} alat berhasil dipinjam`);
                        router.visit('/tool-loans');
                    } else {
                        toast.error(response.data.message || 'Gagal meminjam alat');
                    }
                } catch (error: unknown) {
                    const err = error as { response?: { data?: { message?: string; errors?: { student_id?: string[]; tool_unit_ids?: string[] } } }; message?: string };
                    const errorMessage = err.response?.data?.message
                        || err.response?.data?.errors?.student_id?.[0]
                        || err.response?.data?.errors?.tool_unit_ids?.[0]
                        || err.message
                        || 'Gagal meminjam alat';
                    toast.error(errorMessage);
                }
            } else {
                // Single borrow: use original endpoint for single item
                const tool = selectedTools[0];
                const formData = new FormData();

                // Determine borrower: teacher takes priority if both exist
                if (verifiedTeacher) {
                    formData.append('borrower_teacher_id', verifiedTeacher.id.toString());
                } else if (verifiedStudent) {
                    formData.append('student_id', verifiedStudent.id.toString());
                }

                formData.append('tool_unit_id', tool.toolUnit.id.toString());
                formData.append('borrow_photo', studentPhoto);
                if (selectedTeacherId) {
                    formData.append('teacher_id', selectedTeacherId);
                }
                if (selectedSubjectId) {
                    formData.append('subject_id', selectedSubjectId);
                }

                try {
                    await axios.post('/tool-loans/borrow', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    toast.success('Peminjaman alat berhasil dicatat');
                    router.visit('/tool-loans');
                } catch (error: unknown) {
                    const err = error as { response?: { data?: { message?: string; errors?: { student_id?: string[] } } }; message?: string };
                    const errorMessage = err.response?.data?.message
                        || err.response?.data?.errors?.student_id?.[0]
                        || err.message
                        || 'Gagal meminjam alat';
                    toast.error(errorMessage);
                }
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setIsSubmitting(false);
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
                    </div>

                    {/* Step 1: Verify Student or Teacher */}
                    {step === 1 && (
                        <Card className="border-2">
                            <CardContent className="space-y-6 pt-6">
                                {isGuru ? (
                                    <>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-lg font-semibold">Verifikasi Identitas Guru</h3>
                                            <p className="text-sm text-muted-foreground">Scan QR code guru untuk verifikasi</p>
                                        </div>
                                        <QRScanner
                                            key={qrScannerKey}
                                            open={true}
                                            onClose={() => {}}
                                            onScanSuccess={(decodedText) => {
                                                // Use unified handler
                                                handleVerifyBorrower(decodedText);
                                            }}
                                            onScanError={(error) => toast.error(error)}
                                            inline={true}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <QRScanner
                                            key={qrScannerKey}
                                            open={true}
                                            onClose={() => {}}
                                            onScanSuccess={(decodedText) => {
                                                // Use unified handler
                                                handleVerifyBorrower(decodedText);
                                            }}
                                            onScanError={(error) => toast.error(error)}
                                            inline={true}
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Add Tools */}
                    {step === 2 && (verifiedStudent || verifiedTeacher) && (
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <CardTitle className="text-2xl mb-2">Tambah Alat</CardTitle>
                                <CardDescription className="text-base">
                                    Pilih metode untuk menambahkan alat yang akan dipinjam
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {verifiedStudent ? (
                                    <div className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Siswa Terverifikasi</p>
                                            <p className="font-semibold">{verifiedStudent.name}</p>
                                            <p className="text-xs text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                        </div>
                                    </div>
                                ) : verifiedTeacher ? (
                                    <div className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Guru Terverifikasi</p>
                                            <p className="font-semibold">{verifiedTeacher.name}</p>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Catalog Button */}
                                <div className="flex justify-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        onClick={handleOpenCatalog}
                                        className="w-full sm:w-auto"
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Buka Katalog Alat
                                    </Button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 border-b">
                                    <Button
                                        type="button"
                                        variant={activeTab === 'search' ? 'default' : 'ghost'}
                                        onClick={() => setActiveTab('search')}
                                        className="rounded-b-none"
                                    >
                                        <Search className="h-4 w-4 mr-2" />
                                        Cari Alat
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={activeTab === 'qr' ? 'default' : 'ghost'}
                                        onClick={() => setActiveTab('qr')}
                                        className="rounded-b-none"
                                    >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        Scan QR
                                    </Button>
                                </div>

                                {/* Tab Content */}
                                <div className="space-y-4">
                                    {activeTab === 'search' && (
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
                                    )}

                                    {activeTab === 'qr' && (
                                        <div>
                                            <Label className="text-base font-semibold mb-2 block">Scan QR Code Alat</Label>
                                            <QRScanner
                                                open={true}
                                                onClose={() => {}}
                                                onScanSuccess={(decodedText) => {
                                                    // Directly call handleVerifyTool for tool scanning
                                                    handleVerifyTool(decodedText);
                                                }}
                                                onScanError={(error) => toast.error(error)}
                                                inline={true}
                                            />
                                        </div>
                                    )}

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
                                            setVerifiedStudent(null);
                                            setVerifiedTeacher(null);
                                            // Reset QRScanner
                                            setQrScannerKey(prev => prev + 1);
                                            setStudentVerificationError('');
                                            setTeacherVerificationError('');
                                        }}
                                        className="flex-1"
                                    >
                                       Kembali
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
                    {step === 3 && (verifiedStudent || verifiedTeacher) && selectedTools.length > 0 && (
                        <form onSubmit={handleSubmit}>
                            <Card className="border-2">
                                <CardHeader className="text-center pb-6">
                                    <CardDescription className="text-base">
                                        {isGuru && verifiedTeacher
                                            ? 'Ambil foto, pilih guru dan mapel, lalu konfirmasi data peminjaman'
                                            : 'Ambil foto wajah siswa, pilih guru dan mapel, lalu konfirmasi data peminjaman'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {verifiedStudent ? (
                                        <div className="p-4 bg-muted/50 rounded-lg border">
                                            <div className="text-center space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Siswa</p>
                                                <p className="font-semibold text-lg">{verifiedStudent.name}</p>
                                                <p className="text-sm text-muted-foreground">NIS: {verifiedStudent.nis}</p>
                                            </div>
                                        </div>
                                    ) : verifiedTeacher ? (
                                        <div className="p-4 bg-muted/50 rounded-lg border">
                                            <div className="text-center space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Guru</p>
                                                <p className="font-semibold text-lg">{verifiedTeacher.name}</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">{isGuru && verifiedTeacher ? 'Foto *' : 'Foto Wajah Siswa *'}</Label>
                                        {studentPhotoPreview ? (
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="relative w-full max-w-xs flex items-center justify-center bg-muted rounded-lg border-2 shadow-lg p-4">
                                                    <img
                                                        src={studentPhotoPreview}
                                                        alt="Foto Wajah"
                                                        className="max-w-full max-h-64 w-auto h-auto object-contain rounded-lg"
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
                                                title={isGuru && verifiedTeacher ? "Ambil Foto" : "Ambil Foto Wajah Siswa"}
                                                description={isGuru && verifiedTeacher ? "Ambil foto untuk dokumentasi peminjaman" : "Posisikan wajah siswa dalam frame kamera"}
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

        <Dialog
            open={isConfirmTeacherOpen}
            onOpenChange={(open) => {
                if (!open) {
                    handleCancelTeacher();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Konfirmasi Guru</DialogTitle>
                    <DialogDescription>Pastikan data guru sudah benar sebelum melanjutkan.</DialogDescription>
                </DialogHeader>
                {pendingTeacher && (
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-center">{pendingTeacher.name}</p>
                        {pendingTeacher.subjects && pendingTeacher.subjects.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 justify-center">
                                {pendingTeacher.subjects.map((subject) => (
                                    <span key={subject.id} className="text-xs bg-muted px-2 py-1 rounded">
                                        {subject.nama}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancelTeacher}>
                        Batal
                    </Button>
                    <Button onClick={handleConfirmTeacher}>Konfirmasi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog
            open={isConfirmStudentOpen}
            onOpenChange={(open) => {
                if (!open) {
                    handleCancelStudent();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Konfirmasi Siswa</DialogTitle>
                    <DialogDescription>Pastikan data siswa sudah benar sebelum melanjutkan.</DialogDescription>
                </DialogHeader>
                {pendingStudent && (
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-center">{pendingStudent.name}</p>
                        <p className="text-center text-muted-foreground">NIS: {pendingStudent.nis}</p>
                        {pendingStudent.major && (
                            <p className="text-center text-muted-foreground text-sm">{pendingStudent.major.name}</p>
                        )}
                    </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancelStudent}>
                        Batal
                    </Button>
                    <Button onClick={handleConfirmStudent}>Konfirmasi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Catalog Dialog */}
        <Dialog open={isCatalogDialogOpen && !selectedToolForCatalog} onOpenChange={(open) => {
            if (!open) {
                setIsCatalogDialogOpen(false);
                setCatalogSearch('');
            }
        }}>
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Katalog Alat</DialogTitle>
                    <DialogDescription>
                        Pilih alat dari katalog yang akan dipinjam
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari alat berdasarkan nama, kode, atau lokasi..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Catalog Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingCatalog ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Memuat katalog...
                            </div>
                        ) : filteredCatalog.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {catalogSearch ? 'Tidak ada alat yang sesuai dengan pencarian' : 'Tidak ada alat yang tersedia'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredCatalog.map((tool) => (
                                    <div
                                        key={tool.id}
                                        className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors flex flex-col space-y-2 cursor-pointer"
                                        onClick={() => handleSelectToolFromCatalog(tool)}
                                    >
                                        {tool.photo ? (
                                            <img
                                                src={`/storage/${tool.photo}`}
                                                alt={tool.name}
                                                className="w-full h-32 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                                                <Package className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="space-y-1 flex-1">
                                            <p className="font-medium text-sm line-clamp-2">{tool.name}</p>
                                            <p className="text-xs text-muted-foreground">{tool.location}</p>
                                            <Badge variant="secondary" className="text-xs">
                                                Stok: {tool.available_stock}
                                            </Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectToolFromCatalog(tool);
                                            }}
                                            size="sm"
                                            className="w-full"
                                        >
                                            Tambah
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Catalog Unit Selection Dialog */}
        <Dialog open={!!selectedToolForCatalog} onOpenChange={(open) => {
            if (!open) {
                setSelectedToolForCatalog(null);
                setAvailableUnits([]);
                setSelectedUnitIds([]);
            }
        }}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Pilih Unit</DialogTitle>
                    <DialogDescription>
                        {selectedToolForCatalog ? (
                            <>
                                Pilih unit untuk alat: <strong>{selectedToolForCatalog.name}</strong>
                                {selectedUnitIds.length > 0 && (
                                    <span className="ml-2 text-primary">
                                        ({selectedUnitIds.length} dipilih)
                                    </span>
                                )}
                            </>
                        ) : (
                            'Pilih unit alat yang akan dipinjam'
                        )}
                    </DialogDescription>
                </DialogHeader>
                {selectedToolForCatalog && (
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        {isLoadingUnits ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Memuat unit yang tersedia...
                            </div>
                        ) : availableUnits.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada unit yang tersedia untuk alat ini
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Pilih Unit</Label>
                                        {selectedUnitIds.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedUnitIds([])}
                                                className="h-auto py-1 text-xs"
                                            >
                                                Hapus semua
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {availableUnits.map((unit) => {
                                            const isSelected = selectedUnitIds.includes(unit.id.toString());
                                            const isAlreadyAdded = selectedTools.some((t) => t.toolUnit.id === unit.id);

                                            return (
                                                <div
                                                    key={unit.id}
                                                    onClick={() => {
                                                        if (!isAlreadyAdded) {
                                                            handleToggleUnitSelection(unit.id.toString());
                                                        }
                                                    }}
                                                    className={`p-4 border-2 rounded-lg transition-colors ${
                                                        isAlreadyAdded
                                                            ? 'border-muted bg-muted/30 cursor-not-allowed opacity-60'
                                                            : isSelected
                                                            ? 'border-primary bg-primary/5 cursor-pointer'
                                                            : 'hover:bg-muted/50 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className="font-medium">{unit.unit_code}</p>
                                                            <p className="text-sm text-muted-foreground">Unit {unit.unit_number}</p>
                                                            {isAlreadyAdded && (
                                                                <p className="text-xs text-muted-foreground italic">Sudah ditambahkan</p>
                                                            )}
                                                        </div>
                                                        {isSelected && !isAlreadyAdded && (
                                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                                        )}
                                                        {isAlreadyAdded && (
                                                            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedToolForCatalog(null);
                                            setAvailableUnits([]);
                                            setSelectedUnitIds([]);
                                            // Buka kembali dialog katalog
                                            setIsCatalogDialogOpen(true);
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        onClick={handleAddUnitFromCatalog}
                                        disabled={selectedUnitIds.length === 0}
                                        className="w-full sm:w-auto"
                                    >
                                        Tambah {selectedUnitIds.length > 0 && `(${selectedUnitIds.length})`}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
        </div>
    );
}
