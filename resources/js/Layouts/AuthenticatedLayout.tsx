import { FormEvent, PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Boxes,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu,
    Package,
    QrCode,
    Search,
    ShieldAlert,
    ShoppingBag,
    SquareUserRound,
    Truck,
    Users,
    X,
} from 'lucide-react';

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
    const [globalSearch, setGlobalSearch] = useState('');
    const [showAccessDeniedPopup, setShowAccessDeniedPopup] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(currentPath.split('?')[1] || '');
        setGlobalSearch(params.get('search') || '');
    }, [currentPath]);

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
                ? 'border-slate-200/90 bg-white text-slate-800 shadow-[0_18px_40px_-28px_rgba(71,85,105,0.22)]'
                : 'border-transparent text-slate-600 hover:border-slate-200/70 hover:bg-white/75 hover:text-slate-800',
            disabled ? 'cursor-not-allowed border-transparent bg-white/55 text-slate-300 opacity-100 hover:bg-white/55 hover:text-slate-300' : '',
        ].join(' ');

    const resolveSearchRoute = () => {
        if (route().current('items.*')) return route('items.index');
        if (route().current('sales.*')) return route('sales.index');
        if (route().current('barcode.*')) return route('barcode.index');
        if (route().current('users.*') && user.role === 'admin') return route('users.index');

        return user.role === 'kasir' ? route('sales.index') : route('items.index');
    };

    const handleGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const target = resolveSearchRoute();
        const payload = globalSearch.trim() ? { search: globalSearch.trim() } : {};

        router.get(target, payload, {
            preserveState: false,
            preserveScroll: true,
        });
    };

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
                            <p className="max-w-[10rem] text-[1.55rem] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-800 break-words">
                                {branding?.business_name || 'Velocity Kinetic'}
                            </p>
                            <p className="mt-2 max-w-[10rem] text-[0.72rem] font-medium uppercase leading-5 tracking-[0.22em] text-slate-400 break-words">
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
        <div className="min-h-screen">
            <div className="flex min-h-screen">
                <aside
                    className={`hidden shrink-0 border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(249,251,255,0.96)_0%,rgba(243,246,251,0.94)_100%)] backdrop-blur transition-all duration-300 xl:block ${sidebarMinimized ? 'w-[6.25rem]' : 'w-[17rem]'}`}
                >
                    {sidebarContent}
                </aside>

                {mobileOpen && (
                    <div className="fixed inset-0 z-50 xl:hidden">
                        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                        <aside className="absolute left-0 top-0 h-full w-[16.5rem] border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(249,251,255,0.98)_0%,rgba(243,246,251,0.96)_100%)] shadow-2xl">
                            <div className="flex items-center justify-end px-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            {sidebarContent}
                        </aside>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[rgba(248,250,255,0.86)] backdrop-blur-xl">
                        <div className="flex items-center gap-3 px-4 py-4 md:px-6 xl:px-8">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm xl:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setSidebarMinimized((current) => !current)}
                                className="hidden rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 xl:flex"
                                title={sidebarMinimized ? 'Tampilkan sidebar penuh' : 'Minimalkan sidebar'}
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <form onSubmit={handleGlobalSearch} className="relative hidden max-w-lg flex-1 md:block">
                                <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={globalSearch}
                                    onChange={(event) => setGlobalSearch(event.target.value)}
                                    placeholder="Cari item, supplier, lokasi, atau transaksi..."
                                    className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-[0_18px_40px_-30px_rgba(71,85,105,0.16)] outline-none placeholder:text-slate-400"
                                />
                            </form>

                            <div className="ml-auto flex items-center gap-3">
                                <button
                                    type="button"
                                    className="hidden h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm md:flex"
                                >
                                    <Bell className="h-4 w-4" />
                                </button>
                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm"
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
                                        <p className="text-sm font-semibold text-slate-700">{displayName}</p>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{user.role || 'petugas'}</p>
                                    </div>
                                </Link>
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
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Akses Ditolak</h3>
                                    <p className="text-sm text-slate-500">Halaman ini dibatasi berdasarkan role akun Anda.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <p className="text-sm leading-6 text-slate-600">
                                {flash.access_denied}
                            </p>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAccessDeniedPopup(false)}
                                    className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
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
