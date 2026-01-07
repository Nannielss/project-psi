"use client"

import * as React from "react"
import { usePage } from "@inertiajs/react"
import {
    LayoutDashboard,
    Wrench,
    Users,
    Package,
    GraduationCap,
    History,
    UserCog,
    QrCode,
} from "lucide-react"

import { NavMain } from "./NavMain"
import { NavUser } from "./NavUser"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const page = usePage()
    const user = page.props.auth?.user
    const userRole = user?.role || ""

    // Base navigation items
    const baseNavItems = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Manajemen Alat",
            url: "#",
            icon: Wrench,
            items: [
                {
                    title: "Data Alat",
                    url: "/tools",
                },
                {
                    title: "Maintenance",
                    url: "/maintenance",
                },
            ]
        },
        {
            title: "Manajemen Siswa",
            url: "#",
            icon: Users,
            items: [
                {
                    title: "Data Siswa",
                    url: "/students",
                },
                {
                    title: "Data Jurusan",
                    url: "/majors",
                },
            ],
        },
        {
            title: "Manajemen Bahan",
            url: "#",
            icon: Package,
            items: [
                {
                    title: "Data Bahan",
                    url: "/materials",
                    roles: ["kajur", "guru"],
                },
                {
                    title: "Riwayat Ambil Bahan",
                    url: "/material-pickups",
                    roles: ["kajur", "guru"],
                },
            ],
        },
        {
            title: "Manajemen Guru",
            url: "#",
            icon: GraduationCap,
            items: [
                {
                    title: "Data Guru",
                    url: "/teachers",
                },
                {
                    title: "Data Mapel",
                    url: "/subjects",
                },
            ],
        },
        {
            title: "Riwayat",
            url: "/history",
            icon: History,
        },
        {
            title: "Cetak QR",
            url: "/print-qr",
            icon: QrCode,
        },

    ]

    // Add Manajemen User only for kajur role
    const navItems = userRole === "kajur"
        ? [
            ...baseNavItems,
            {
                title: "Manajemen User",
                url: "/users",
                icon: UserCog,
            },
        ]
        : baseNavItems

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex h-8 w-8 items-center justify-center text-primary">
                        <Package className="h-4 w-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Inventory</span>
                        <span className="truncate text-xs text-muted-foreground">Management</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} userRole={userRole} />
            </SidebarContent>
            {user && (
                <SidebarFooter>
                    <NavUser user={{
                        username: user.username || "User",
                        avatar: user.photo || user.avatar || ""
                    }} />
                </SidebarFooter>
            )}
            <SidebarRail />
        </Sidebar>
    )
}
