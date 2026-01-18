import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { DeviceLocation } from '@/types';

interface LocationLoginPageProps {
    locations: DeviceLocation[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function LocationLogin({ locations, flash }: LocationLoginPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        device_location_id: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tool-loans.location-login.post'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-10">
            <Head title="Login Lokasi Device" />

            {/* Theme Toggle - Top Right Corner */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <Card className="border-2 shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-2">
                            <MapPin className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Login Lokasi Device</CardTitle>
                        <CardDescription>
                            Pilih lokasi device dan masukkan password untuk melanjutkan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {flash?.success && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                <p className="text-sm text-green-800 dark:text-green-200">{flash.success}</p>
                            </div>
                        )}
                        {flash?.error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-800 dark:text-red-200">{flash.error}</p>
                            </div>
                        )}
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="device_location_id">Lokasi Device</Label>
                                <Select
                                    value={data.device_location_id}
                                    onValueChange={(value) => setData('device_location_id', value)}
                                    disabled={processing}
                                >
                                    <SelectTrigger className={errors.device_location_id ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Pilih lokasi device" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id.toString()}>
                                                {location.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.device_location_id && (
                                    <p className="text-sm text-destructive">{errors.device_location_id}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan password lokasi"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                                        disabled={processing}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing || !data.device_location_id || !data.password}
                            >
                                {processing ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

