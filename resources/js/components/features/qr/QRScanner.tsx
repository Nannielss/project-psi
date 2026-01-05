import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Camera, CameraOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface QRScannerProps {
    open: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (error: string) => void;
    inline?: boolean;
}

export function QRScanner({ open, onClose, onScanSuccess, onScanError, inline = false }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerId = 'qr-scanner';

    useEffect(() => {
        if (open && !scannerRef.current) {
            startScanner();
        } else if (!open && scannerRef.current) {
            stopScanner();
        }

        return () => {
            if (scannerRef.current) {
                stopScanner();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const startScanner = async () => {
        try {
            setError(null);
            setIsScanning(true);

            const html5QrCode = new Html5Qrcode(scannerId);
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                (decodedText) => {
                    // Success callback
                    handleScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Error callback - ignore most errors as they're just scanning attempts
                    // These are normal during scanning process
                }
            );
        } catch (err: any) {
            console.error('Error starting scanner:', err);
            setError(err.message || 'Gagal mengakses kamera');
            setIsScanning(false);
            if (onScanError) {
                onScanError(err.message || 'Gagal mengakses kamera');
            }
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        stopScanner().then(() => {
            onScanSuccess(decodedText);
            if (!inline) {
                onClose();
            }
        });
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                // Ignore errors when stopping scanner
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const handleClose = () => {
        stopScanner();
        setError(null);
        onClose();
    };

    if (inline) {
        return (
            <div className="space-y-4">
                <div className="relative">
                    <div
                        id={scannerId}
                        className="w-full rounded-lg overflow-hidden bg-black"
                        style={{ minHeight: '500px' }}
                    />
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                            <div className="text-center p-4">
                                <CameraOff className="h-12 w-12 text-destructive mx-auto mb-2" />
                                <p className="text-white font-medium">{error}</p>
                                <Button
                                    onClick={startScanner}
                                    className="mt-4"
                                    variant="outline"
                                >
                                    Coba Lagi
                                </Button>
                            </div>
                        </div>
                    )}
                    {!error && isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg pointer-events-none">
                            <div className="text-center p-4">
                                <div className="animate-pulse">
                                    <Camera className="h-12 w-12 text-primary mx-auto mb-2" />
                                    <p className="text-white font-medium">Memindai QR Code...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan QR Code</DialogTitle>
                    <DialogDescription>
                        Arahkan kamera ke QR code untuk memindai
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="relative">
                        <div
                            id={scannerId}
                            className="w-full rounded-lg overflow-hidden bg-black"
                            style={{ minHeight: '300px' }}
                        />
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                                <div className="text-center p-4">
                                    <CameraOff className="h-12 w-12 text-destructive mx-auto mb-2" />
                                    <p className="text-white font-medium">{error}</p>
                                    <Button
                                        onClick={startScanner}
                                        className="mt-4"
                                        variant="outline"
                                    >
                                        Coba Lagi
                                    </Button>
                                </div>
                            </div>
                        )}
                        {!error && isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg pointer-events-none">
                                <div className="text-center p-4">
                                    <div className="animate-pulse">
                                        <Camera className="h-12 w-12 text-primary mx-auto mb-2" />
                                        <p className="text-white font-medium">Memindai QR Code...</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            <X className="mr-2 h-4 w-4" />
                            Tutup
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

