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
                    qrbox: (vw) => {
                        const size = Math.min(320, Math.floor(vw * 0.7));
                        return { width: size, height: size };
                    },
                    disableFlip: false,
                    aspectRatio: 16 / 9,
                },
                (decodedText) => {
                    // Success callback
                    handleScanSuccess(decodedText);
                },
                () => {
                    // Error callback - ignore most errors as they're just scanning attempts
                    // These are normal during scanning process
                }
            );

            setTimeout(async () => {
                const cameras = await Html5Qrcode.getCameras();
                const cam = cameras[0]?.label?.toLowerCase() || "";

                const video = document.querySelector("#qr-scanner video") as HTMLVideoElement;
                if (!video) return;

                // Jika bukan kamera belakang → un-mirror
                if (!cam.includes("back") && !cam.includes("rear") && !cam.includes("environment")) {
                    video.style.transform = "scaleX(-1)";
                } else {
                    video.style.transform = "none";
                }
            }, 300);
        } catch (err: unknown) {
            console.error('Error starting scanner:', err);
            const errorMessage = (err as { message?: string })?.message || 'Gagal mengakses kamera';
            setError(errorMessage);
            setIsScanning(false);
            if (onScanError) {
                onScanError(errorMessage);
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
            } catch {
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
                </div>
                {!error && isScanning && (
                    <div className="text-center">
                        <div className="animate-pulse inline-flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            <p className="text-sm font-medium">Memindai QR Code...</p>
                        </div>
                    </div>
                )}
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
                    </div>
                    {!error && isScanning && (
                        <div className="text-center">
                            <div className="animate-pulse inline-flex items-center gap-2">
                                <Camera className="h-5 w-5 text-primary" />
                                <p className="text-sm font-medium">Memindai QR Code...</p>
                            </div>
                        </div>
                    )}
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
