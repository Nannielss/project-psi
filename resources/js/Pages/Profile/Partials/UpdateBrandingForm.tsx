import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { ImagePlus, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';

type BrandingData = {
    business_name: string;
    business_tagline?: string | null;
    business_address?: string | null;
    business_phone?: string | null;
    logo_url?: string | null;
};

export default function UpdateBrandingForm({
    branding,
}: {
    branding: BrandingData;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const { data, setData, patch, processing, errors } = useForm({
        business_name: branding.business_name || '',
        business_tagline: branding.business_tagline || '',
        business_address: branding.business_address || '',
        business_phone: branding.business_phone || '',
        logo: null as File | null,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('profile.branding.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLogoPreview(null);
                toast.success('Branding usaha berhasil diperbarui');
            },
            onError: () => toast.error('Gagal memperbarui branding usaha.'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Branding Usaha</CardTitle>
                <CardDescription>
                    Ganti nama bisnis, tagline, alamat, telepon, dan logo yang dipakai di sidebar serta struk.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-5 rounded-[26px] border border-slate-200/80 bg-slate-50/70 p-5 md:grid-cols-[112px_minmax(0,1fr)]">
                        <div className="space-y-3">
                            <div className="vk-brand-frame h-28 w-28 rounded-[28px]">
                                {logoPreview || branding.logo_url ? (
                                    <img
                                        src={logoPreview || branding.logo_url || undefined}
                                        alt={data.business_name}
                                        className="h-full w-full object-contain p-3"
                                    />
                                ) : (
                                    <Store className="h-9 w-9 text-slate-400" />
                                )}
                            </div>
                            <p className="text-xs font-medium text-slate-500">
                                Gunakan logo persegi atau horizontal. Sistem akan menyesuaikan agar tidak kepotong.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="logo" className="text-base text-slate-800">Logo Usaha</Label>
                                <p className="mt-1 text-sm text-slate-500">PNG/JPG, maksimal 2MB.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    Upload Logo
                                </Button>
                                {(logoPreview || branding.logo_url) && (
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
                                        Preview aktif
                                    </span>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                id="logo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;

                                    setData('logo', file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => setLogoPreview(reader.result as string);
                                    reader.readAsDataURL(file);
                                }}
                            />
                            {errors.logo && <p className="text-sm text-destructive">{errors.logo}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_name">Nama Usaha</Label>
                        <Input
                            id="business_name"
                            value={data.business_name}
                            onChange={(event) => setData('business_name', event.target.value)}
                            placeholder="Nama usaha / toko"
                        />
                        {errors.business_name && <p className="text-sm text-destructive">{errors.business_name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_tagline">Tagline</Label>
                        <Input
                            id="business_tagline"
                            value={data.business_tagline}
                            onChange={(event) => setData('business_tagline', event.target.value)}
                            placeholder="Contoh: Warehouse & POS System"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_address">Alamat</Label>
                        <Input
                            id="business_address"
                            value={data.business_address}
                            onChange={(event) => setData('business_address', event.target.value)}
                            placeholder="Alamat toko / gudang"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="business_phone">Telepon</Label>
                        <Input
                            id="business_phone"
                            value={data.business_phone}
                            onChange={(event) => setData('business_phone', event.target.value)}
                            placeholder="Nomor telepon usaha"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Branding
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
