import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTheme } from 'next-themes';
import {
    Bell,
    Boxes,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu,
    Monitor,
    Moon,
    Package,
    QrCode,
    ShieldAlert,
    ShoppingBag,
    SquareUserRound,
    Sun,
    Truck,
    Users,
    X,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type NavItem = {
    label: string;
    href?: string;
    active: boolean;
    icon: typeof LayoutDashboard;
    disabled?: boolean;
    roles?: readonly string[];
};

const roleAccess = {
    admin: ['admin'],
    warehouse: ['admin', 'petugas'],
    sales: ['admin', 'kasir'],
    general: ['admin', 'petugas', 'kasir'],
} as const;

function canAccess(role: string | undefined, allowedRoles: readonly string[]) {
    return !!role && allowedRoles.includes(role);
}

function initialsFromName(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const page = usePage();
    const { auth, branding, flash } = page.props as {
        auth: {
            user: {
                name?: string;
                username: string;
                email?: string;
                role?: string;
                photo?: string;
            };
        };
        branding?: {
            business_name?: string;
            business_tagline?: string | null;
            logo_url?: string | null;
        };
        flash?: {
            success?: string | null;
            error?: string | null;
            access_denied?: string | null;
        };
    };
    const user = auth.user;
    const displayName = user.name || user.username;
    const userInitials = initialsFromName(displayName);
    const currentPath = page.url;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarMinimized, setSidebarMinimized] = useState(false);
    const [showAccessDeniedPopup, setShowAccessDeniedPopup] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setShowAccessDeniedPopup(Boolean(flash?.access_denied));
    }, [flash?.access_denied]);

    const primaryNav = useMemo<NavItem[]>(() => {
        const items: NavItem[] = [
            {
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
                icon: LayoutDashboard,
                roles: roleAccess.general,
            },
            {
                label: 'Master Barang',
                href: route('items.index'),
                active: route().current('items.*'),
                icon: Package,
                roles: roleAccess.warehouse,
            },
            {
                label: 'Manajemen Stok',
                href: route('stock-transactions.index'),
                active: route().current('stock-transactions.*'),
                icon: ClipboardList,
                roles: roleAccess.warehouse,
            },
            {
                label: 'Barang Rusak/Expired',
                href: route('damaged-items.index'),
                active: route().current('damaged-items.*'),
                icon: ShieldAlert,
                roles: roleAccess.warehouse,
            },
            {
                label: 'Supplier',
                href: route('suppliers.index'),
                active: route().current('suppliers.*'),
                icon: Truck,
                roles: roleAccess.warehouse,
            },
            {
                label: 'Pelanggan/Reseller',
                href: route('customers.index'),
                active: route().current('customers.*'),
                icon: Users,
                roles: roleAccess.sales,
            },
            {
                label: 'Lokasi Penyimpanan',
                href: route('locations.index'),
                active: route().current('locations.*'),
                icon: MapPin,
                roles: roleAccess.warehouse,
            },
            {
                label: 'Riwayat',
                href: route('history.index'),
                active: route().current('history.*'),
                icon: Boxes,
                roles: roleAccess.general,
            },
            {
                label: 'Barcode',
                href: route('barcode.index'),
                active: route().current('barcode.*'),
                icon: QrCode,
                roles: roleAccess.warehouse,
            },
            {
                label: 'Kasir / Penjualan',
                href: route('sales.index'),
                active: route().current('sales.*'),
                icon: ShoppingBag,
                roles: roleAccess.sales,
            },
        ];

        if (canAccess(user.role, roleAccess.admin)) {
            items.push({
                label: 'Manajemen User',
                href: route('users.index'),
                active: route().current('users.*'),
                icon: SquareUserRound,
                roles: roleAccess.admin,
            });
        }

        return items.filter((item) => canAccess(user.role, item.roles ?? roleAccess.general));
    }, [currentPath, user.role]);

    const navItemClass = (active: boolean, disabled = false) =>
        [
            'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200',
            active
                ? 'border-slate-200/90 bg-white text-slate-800 shadow-[0_18px_40px_-28px_rgba(71,85,105,0.22)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_20px_44px_-30px_rgba(0,0,0,0.7)]'
                : 'border-transparent text-slate-600 hover:border-slate-200/70 hover:bg-white/75 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900/80 dark:hover:text-slate-100',
            disabled ? 'cursor-not-allowed border-transparent bg-white/55 text-slate-300 opacity-100 hover:bg-white/55 hover:text-slate-300 dark:bg-slate-900/40 dark:text-slate-600 dark:hover:bg-slate-900/40 dark:hover:text-slate-600' : '',
        ].join(' ');

    const sidebarContent = (
        <div className="flex h-full flex-col">
            <div className={`pb-6 pt-8 ${sidebarMinimized ? 'px-3' : 'px-6'}`}>
                <div className={`flex items-start gap-4 ${sidebarMinimized ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-4 ${sidebarMinimized ? 'justify-center' : ''}`}>
                        <div className="vk-brand-frame h-14 w-14 rounded-2xl bg-[linear-gradient(135deg,#fdfefe_0%,#f3f6fb_100%)] text-white">
                            {branding?.logo_url ? (
                                <img
                                    src={branding.logo_url}
                                    alt={branding.business_name || 'Logo usaha'}
                                    className="h-full w-full object-contain p-2"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5a6798_0%,#46517c_100%)] text-white">
                                    <Package className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        <div className={sidebarMinimized ? 'hidden min-w-0' : 'block min-w-0'}>
                            <p className="max-w-[10rem] text-[1.55rem] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-800 break-words dark:text-slate-100">
                                {branding?.business_name || 'Velocity Kinetic'}
                            </p>
                            <p className="mt-2 max-w-[10rem] text-[0.72rem] font-medium uppercase leading-5 tracking-[0.22em] text-slate-400 break-words dark:text-slate-500">
                                {branding?.business_tagline || 'The Digital Atelier'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4">
                <div className="space-y-1.5">
                    {primaryNav.map((item) =>
                        item.disabled || !item.href ? (
                            <button
                                key={item.label}
                                type="button"
                                className={`${navItemClass(item.active, true)} ${sidebarMinimized ? 'justify-center px-3' : ''}`}
                                title={item.label}
                            >
                                <item.icon className="h-4 w-4" />
                                {!sidebarMinimized && <span>{item.label}</span>}
                            </button>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`${navItemClass(item.active)} ${sidebarMinimized ? 'justify-center px-3' : ''}`}
                                title={item.label}
                            >
                                <item.icon className="h-4 w-4" />
                                {!sidebarMinimized && <span>{item.label}</span>}
                            </Link>
                        ),
                    )}
                </div>
            </nav>

            <div className="space-y-1.5 px-4 pb-8 pt-6">
                <button
                    type="button"
                    className={`${navItemClass(false, true)} ${sidebarMinimized ? 'justify-center px-3' : ''}`}
                    title="Support"
                >
                    <Bell className="h-4 w-4" />
                    {!sidebarMinimized && <span>Support</span>}
                </button>
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className={`${navItemClass(false)} ${sidebarMinimized ? 'justify-center px-3' : ''}`}
                    title="Log Out"
                >
                    <LogOut className="h-4 w-4" />
                    {!sidebarMinimized && <span>Log Out</span>}
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen text-slate-900 dark:text-slate-100">
            <div className="flex min-h-screen">
                <aside
                    className={`hidden shrink-0 border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(249,251,255,0.96)_0%,rgba(243,246,251,0.94)_100%)] backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(10,14,24,0.96)_0%,rgba(12,16,28,0.94)_100%)] xl:block ${sidebarMinimized ? 'w-[6.25rem]' : 'w-[17rem]'}`}
                >
                    {sidebarContent}
                </aside>

                {mobileOpen && (
                    <div className="fixed inset-0 z-50 xl:hidden">
                        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                        <aside className="absolute left-0 top-0 h-full w-[16.5rem] border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(249,251,255,0.98)_0%,rgba(243,246,251,0.96)_100%)] shadow-2xl dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(10,14,24,0.98)_0%,rgba(12,16,28,0.96)_100%)]">
                            <div className="flex items-center justify-end px-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            {sidebarContent}
                        </aside>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[rgba(248,250,255,0.86)] backdrop-blur-xl dark:border-slate-800 dark:bg-[rgba(9,13,22,0.82)]">
                        <div className="flex items-center gap-3 px-4 py-4 md:px-6 xl:px-8">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 xl:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setSidebarMinimized((current) => !current)}
                                className="hidden rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white xl:flex"
                                title={sidebarMinimized ? 'Tampilkan sidebar penuh' : 'Minimalkan sidebar'}
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="ml-auto flex items-center gap-3">
                                <button
                                    type="button"
                                    className="hidden h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:flex"
                                >
                                    <Bell className="h-4 w-4" />
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5a6798_0%,#46517c_100%)] text-sm font-semibold text-white">
                                                {user.photo ? (
                                                    <img
                                                        src={user.photo.startsWith('http') ? user.photo : `/profile-photos/${user.photo.split('/').pop()}`}
                                                        alt={displayName}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    userInitials
                                                )}
                                            </div>
                                            <div className="hidden pr-3 text-left md:block">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{displayName}</p>
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{user.role || 'petugas'}</p>
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                        <DropdownMenuLabel className="px-3 py-2">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
                                            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">{user.email || user.username}</p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                        <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                            Tampilan
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => setTheme('light')} className="rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200">
                                            <Sun className="h-4 w-4 text-amber-500" />
                                            <span>Light</span>
                                            {theme === 'light' && <span className="ml-auto text-xs font-semibold text-primary">Aktif</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme('dark')} className="rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200">
                                            <Moon className="h-4 w-4 text-indigo-400" />
                                            <span>Dark</span>
                                            {theme === 'dark' && <span className="ml-auto text-xs font-semibold text-primary">Aktif</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme('system')} className="rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200">
                                            <Monitor className="h-4 w-4 text-slate-400" />
                                            <span>System</span>
                                            {theme === 'system' && <span className="ml-auto text-xs font-semibold text-primary">Aktif</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                        <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200">
                                            <Link href={route('profile.edit')}>Profile</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300">
                                            <Link href={route('logout')} method="post" as="button" className="w-full text-left">
                                                Log Out
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 pb-8 pt-6 md:px-6 xl:px-8">
                        {header && <div className="mb-6">{header}</div>}
                        {children}
                    </main>
                </div>
            </div>

            {showAccessDeniedPopup && flash?.access_denied && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
                    <div className="vk-card w-full max-w-md overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Akses Ditolak</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Halaman ini dibatasi berdasarkan role akun Anda.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {flash.access_denied}
                            </p>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAccessDeniedPopup(false)}
                                    className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    Mengerti
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
