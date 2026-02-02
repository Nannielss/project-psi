import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2 } from 'lucide-react';

interface QRItem {
    id: number | string;
    code: string; // NIS or NIP
    name: string;
    subtitle?: string; // Class for students, subjects for teachers
}

interface QRPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: QRItem[];
    title: string;
    description?: string;
    type: 'student' | 'teacher' | 'tool';
}

export function QRPrintDialog({
    open,
    onOpenChange,
    items,
    title,
    description,
    type,
}: QRPrintDialogProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site.');
            return;
        }

        const styles = `
            <style>
                @page {
                    size: A4;
                    margin: 10mm;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: white;
                    padding: 0;
                    margin: 0;
                }
                .print-container {
                    display: grid !important;
                    grid-template-columns: repeat(3, 1fr) !important;
                    grid-auto-flow: row !important;
                    gap: 16px !important;
                    padding: 10px !important;
                    width: 100% !important;
                }
                .qr-card {
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    padding: 16px !important;
                    text-align: center !important;
                    page-break-inside: avoid !important;
                    background: white !important;
                    width: 100% !important;
                    display: block !important;
                }
                .qr-code {
                    display: flex !important;
                    justify-content: center !important;
                    margin-bottom: 12px !important;
                }
                .qr-code svg {
                    width: 120px !important;
                    height: 120px !important;
                }
                .qr-info {
                    margin-top: 8px !important;
                }
                .qr-code-text {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: #111827 !important;
                    margin-bottom: 6px !important;
                }
                .qr-name {
                    font-size: 13px !important;
                    color: #374151 !important;
                    font-weight: 500 !important;
                }
                .qr-subtitle {
                    font-size: 11px !important;
                    color: #6b7280 !important;
                    margin-top: 4px !important;
                }
                .qr-type {
                    font-size: 9px !important;
                    color: #9ca3af !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    margin-top: 6px !important;
                }
                @media print {
                    .print-container {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        grid-auto-flow: row !important;
                        gap: 16px !important;
                    }
                    .qr-card {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            </style>
        `;

        // Clone content and ensure grid layout
        const clonedContent = printContent.cloneNode(true) as HTMLElement;
        clonedContent.className = 'print-container';
        clonedContent.setAttribute('style', 'display: grid !important; grid-template-columns: repeat(3, 1fr) !important; grid-auto-flow: row !important; gap: 16px !important; padding: 10px !important; width: 100% !important;');
        
        // Ensure all cards are properly styled
        const cards = clonedContent.querySelectorAll('.qr-card');
        cards.forEach((card) => {
            (card as HTMLElement).setAttribute('style', 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; page-break-inside: avoid; background: white; width: 100%; display: block;');
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cetak QR Code - ${title}</title>
                ${styles}
            </head>
            <body>
                ${clonedContent.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 250);
    };

    // Helper function to convert SVG to canvas
    const svgToCanvas = (svgElement: SVGSVGElement, width: number, height: number): Promise<HTMLCanvasElement> => {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Set white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                const svgData = new XMLSerializer().serializeToString(svgElement);
                const img = new Image();
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                    resolve(canvas);
                };

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load SVG image'));
                };

                img.src = url;
            } catch (error) {
                reject(error);
            }
        });
    };

    // Helper function to create QR card image
    const createQRCardImage = async (item: QRItem, qrSvg: SVGSVGElement): Promise<Blob> => {
        const cardWidth = 300;
        const cardHeight = 400;
        const qrSize = 200;
        const padding = 20;
        const qrX = (cardWidth - qrSize) / 2;
        const qrY = padding + 20;

        const canvas = document.createElement('canvas');
        canvas.width = cardWidth;
        canvas.height = cardHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cardWidth, cardHeight);

        // Border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, cardWidth - 1, cardHeight - 1);

        // Convert QR SVG to canvas
        const qrCanvas = await svgToCanvas(qrSvg, qrSize, qrSize);
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // Draw text
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 20px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const codeY = qrY + qrSize + 20;
        ctx.fillText(item.code, cardWidth / 2, codeY);

        // Name
        ctx.fillStyle = '#374151';
        ctx.font = '500 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const nameY = codeY + 30;
        const maxWidth = cardWidth - padding * 2;
        const nameLines = wrapText(ctx, item.name, maxWidth);
        nameLines.forEach((line, index) => {
            ctx.fillText(line, cardWidth / 2, nameY + index * 20);
        });

        // Subtitle
        if (item.subtitle) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '11px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            const subtitleY = nameY + nameLines.length * 20 + 8;
            ctx.fillText(item.subtitle, cardWidth / 2, subtitleY);
        }

        // Type label
        ctx.fillStyle = '#9ca3af';
        ctx.font = '9px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const typeText = type === 'student' ? 'SISWA' : type === 'teacher' ? 'GURU' : 'ALAT';
        ctx.fillText(typeText, cardWidth / 2, cardHeight - 25);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    throw new Error('Failed to create blob');
                }
            }, 'image/png', 1.0);
        });
    };

    // Helper function to wrap text
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const handleExportZIP = async () => {
        if (items.length === 0) return;

        setIsExporting(true);
        try {
            const zip = new JSZip();
            const batchSize = 10; // Process 10 QR codes at a time
            const totalBatches = Math.ceil(items.length / batchSize);

            // Process in batches to avoid blocking the UI
            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const startIndex = batchIndex * batchSize;
                const endIndex = Math.min(startIndex + batchSize, items.length);
                const batch = items.slice(startIndex, endIndex);

                // Process batch in parallel
                const promises = batch.map(async (item, index) => {
                    const actualIndex = startIndex + index;
                    try {
                        // Find the QR card element for this item by index
                        const cards = printRef.current?.querySelectorAll('.qr-card');
                        if (!cards || actualIndex >= cards.length) {
                            console.warn(`QR card not found for item ${actualIndex}`);
                            return null;
                        }

                        const card = cards[actualIndex] as HTMLElement;
                        const qrElement = card.querySelector('svg') as SVGSVGElement | null;

                        if (!qrElement) {
                            console.warn(`QR SVG element not found for item ${actualIndex}`);
                            return null;
                        }

                        const blob = await createQRCardImage(item, qrElement);
                        const filename = `${item.code}-${item.name.replace(/[^a-z0-9]/gi, '_')}.png`;
                        return { filename, blob };
                    } catch (error) {
                        console.error(`Error exporting QR ${actualIndex}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                
                // Add successful results to ZIP
                results.forEach((result) => {
                    if (result) {
                        zip.file(result.filename, result.blob);
                    }
                });

                // Allow UI to update between batches
                if (batchIndex < totalBatches - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
            }

            // Generate ZIP file
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            // Save as ZIP file
            saveAs(zipBlob, `QR-Code-${title}-${new Date().getTime()}.zip`);
        } catch (error) {
            console.error('Error exporting ZIP:', error);
            alert('Gagal mengekspor ZIP. Silakan coba lagi.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                    {items.length > 0 && (
                        <div className="flex items-center justify-between mt-3">
                            <div className="text-sm text-muted-foreground">
                                Total: {items.length} QR Code
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handlePrint} variant="outline">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Cetak
                                </Button>
                                <Button onClick={handleExportZIP} disabled={isExporting}>
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Mengekspor...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download ZIP
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-4">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Tidak ada data untuk dicetak
                        </div>
                    ) : (
                        <div 
                            ref={printRef} 
                            className="print-container grid grid-cols-2 gap-4 p-2 border rounded-lg bg-white"
                            style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gridAutoFlow: 'row',
                                width: '100%'
                            }}
                        >
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="qr-card border rounded-lg p-4 text-center bg-white"
                                >
                                    <div className="qr-code flex justify-center">
                                        <QRCodeSVG
                                            value={item.code}
                                            size={120}
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="qr-info mt-2">
                                        <div className="qr-code-text text-sm font-bold">
                                            {item.code}
                                        </div>
                                        <div className="qr-name text-xs text-gray-700 truncate">
                                            {item.name}
                                        </div>
                                        {item.subtitle && (
                                            <div className="qr-subtitle text-[10px] text-gray-500 truncate">
                                                {item.subtitle}
                                            </div>
                                        )}
                                        <div className="qr-type text-[8px] text-gray-400 uppercase tracking-wide mt-1">
                                            {type === 'student' ? 'Siswa' : type === 'teacher' ? 'Guru' : 'Alat'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

