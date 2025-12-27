"use client"

import { Link } from "@inertiajs/react"
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Helper function to get default photo URL
function getDefaultPhotoUrl(username: string): string {
  // Using UI Avatars API for default avatar with initial
  const initial = username.charAt(0).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=random&size=128&bold=true`
}

export function NavUser({
  user,
}: {
  user: {
    username: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  
  // Get photo URL - check if it's a full URL or needs /storage prefix
  const getPhotoUrl = () => {
    if (user.avatar) {
      // If photo starts with http, it's already a full URL
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // If it's a storage path, prepend /storage
      if (user.avatar.startsWith('photos/')) {
        return `/storage/${user.avatar}`;
      }
      // Otherwise return as is
      return user.avatar;
    }
    return getDefaultPhotoUrl(user.username);
  };
  
  const photoUrl = getPhotoUrl();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={photoUrl} alt={user.username} />
                <AvatarFallback className="rounded-lg">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={photoUrl} alt={user.username} />
                  <AvatarFallback className="rounded-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={route('profile.edit')}>
                  <IconUserCircle />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={route('logout')} method="post" as="button">
                <IconLogout />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
