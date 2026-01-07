import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to get default photo URL
function getDefaultPhotoUrl(username: string): string {
    const initial = username.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=random&size=128&bold=true`;
}

export default function UpdateProfileInformation({
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        username: user.username || '',
        photo: null as File | null,
    });

    // Get photo URL - use private photo route
    const getPhotoUrl = () => {
        if (user.photo) {
            // If photo starts with http, it's already a full URL
            if (user.photo.startsWith('http')) {
                return user.photo;
            }
            // Extract filename and use private photo route
            const filename = user.photo.split('/').pop();
            return `/profile-photos/${filename}`;
        }
        return user.avatar || getDefaultPhotoUrl(user.username);
    };

    const currentPhotoUrl = getPhotoUrl();

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setPhotoPreview(null);
                toast.success('Profil berhasil diperbarui');
            },
            onError: (errors) => {
                if (Object.keys(errors).length > 0) {
                    toast.error('Gagal memperbarui profil. Periksa form untuk detail error.');
                }
            },
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>
                    Perbarui informasi profil dan foto Anda.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    {/* Photo Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={photoPreview || currentPhotoUrl}
                                    alt={user.username}
                                />
                                <AvatarFallback className="text-lg">
                                    {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="photo">Foto Profil</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Klik ikon kamera untuk mengubah foto profil. Format: JPG, PNG (Max 2MB)
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="photo"
                                name="photo"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                            {errors.photo && (
                                <p className="text-sm text-destructive mt-1">{errors.photo}</p>
                            )}
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            required
                            autoComplete="username"
                            className={errors.username ? 'border-destructive' : ''}
                        />
                        {errors.username && (
                            <p className="text-sm text-destructive">{errors.username}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                        {recentlySuccessful && (
                            <p className="text-sm text-muted-foreground">
                                Disimpan.
                            </p>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
