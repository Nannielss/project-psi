import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, X, RotateCcw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PhotoCaptureProps {
    open: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    title?: string;
    description?: string;
}

export function PhotoCapture({
    open,
    onClose,
    onCapture,
    title = 'Ambil Foto',
    description = 'Posisikan wajah dan alat dalam frame kamera',
}: PhotoCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [open, facingMode]);

    const startCamera = async () => {
        try {
            setError(null);
            setIsCapturing(true);

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            setError(err.message || 'Gagal mengakses kamera');
            setIsCapturing(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCapturing(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob and create File
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `photo-${Date.now()}.jpg`, {
                        type: 'image/jpeg',
                    });
                    onCapture(file);
                    stopCamera();
                    onClose();
                }
            },
            'image/jpeg',
            0.9
        );
    };

    const switchCamera = () => {
        stopCamera();
        setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    };

    const handleClose = () => {
        stopCamera();
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                                <div className="text-center p-4">
                                    <CameraOff className="h-12 w-12 text-destructive mx-auto mb-2" />
                                    <p className="text-white font-medium mb-4">{error}</p>
                                    <Button onClick={startCamera} variant="outline">
                                        Coba Lagi
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!error && isCapturing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg pointer-events-none">
                                <div className="text-center p-4">
                                    <div className="animate-pulse">
                                        <Camera className="h-12 w-12 text-primary mx-auto mb-2" />
                                        <p className="text-white font-medium">Siap mengambil foto...</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={switchCamera} disabled={!isCapturing}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Ganti Kamera
                        </Button>
                        <Button variant="outline" onClick={handleClose}>
                            <X className="mr-2 h-4 w-4" />
                            Batal
                        </Button>
                        <Button onClick={capturePhoto} disabled={!isCapturing || !!error}>
                            <Camera className="mr-2 h-4 w-4" />
                            Ambil Foto
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


