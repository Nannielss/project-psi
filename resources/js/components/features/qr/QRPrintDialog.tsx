import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

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
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak
                            </Button>
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

