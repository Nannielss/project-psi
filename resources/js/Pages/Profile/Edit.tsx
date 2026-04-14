import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ShieldCheck, UserCircle2 } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdateBrandingForm from './Partials/UpdateBrandingForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    branding,
}: PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    branding: {
        business_name: string;
        business_tagline?: string | null;
        business_address?: string | null;
        business_phone?: string | null;
        logo_url?: string | null;
    };
}>) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user.role === 'admin';

    return (
        <AuthenticatedLayout>
            <Head title="Profil & Pengaturan" />

            <div className="space-y-6">
                <section className="vk-card overflow-hidden">
                    <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_220px] md:px-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Account Center
                            </p>
                            <h1 className="mt-2 vk-page-title">Profil & Pengaturan</h1>
                            <p className="mt-3 max-w-2xl vk-page-copy">
                                Perbarui identitas akun, foto profil, dan keamanan login tanpa keluar dari workspace utama.
                            </p>
                        </div>

                        <div className="vk-soft-panel flex items-center gap-4 px-5 py-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Keamanan Akun</p>
                                <p className="text-sm text-slate-500">Jaga username, password, dan akses akun tetap aman.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                    <div className="space-y-6">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />

                        {isAdmin && branding && (
                            <UpdateBrandingForm branding={branding} />
                        )}

                        <UpdatePasswordForm />
                    </div>

                    <div className="space-y-6">
                        <section className="vk-card px-6 py-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                    <UserCircle2 className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold text-slate-800">Ringkasan Pengaturan</h2>
                                    <p className="text-sm leading-6 text-slate-500">
                                        Gunakan halaman ini untuk mengganti username, memperbarui foto, dan mereset password akun Anda.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {isAdmin && <DeleteUserForm />}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
