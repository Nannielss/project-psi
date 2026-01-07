"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link } from "@inertiajs/react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
    roles?: string[]
  }[]
}

export function NavMain({
  items,
  userRole,
}: {
  items: NavItem[]
  userRole?: string
}) {
  const currentUrl = window.location.pathname

  // Filter items based on user role
  const filterItemsByRole = (itemsToFilter: NavItem[]): NavItem[] => {
    return itemsToFilter.map((item: NavItem) => {
      if (item.items) {
        const filteredSubItems = item.items.filter((subItem: { title: string; url: string; roles?: string[] }) => {
          if (!subItem.roles || subItem.roles.length === 0) return true
          return userRole && subItem.roles.includes(userRole)
        })
        return { ...item, items: filteredSubItems }
      }
      return item
    }).filter((item: NavItem) => {
      // Hide parent item if no sub-items remain
      if (item.items && item.items.length === 0) return false
      return true
    })
  }

  const filteredItems = userRole ? filterItemsByRole(items) : items

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item: NavItem) => {
          // Check if any submenu item is active
          const hasActiveSubItem = item.items?.some((subItem: { title: string; url: string; roles?: string[] }) => currentUrl === subItem.url) || false
          const isActive = item.isActive || currentUrl === item.url || hasActiveSubItem
          
          if (item.items && item.items.length > 0) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem: { title: string; url: string; roles?: string[] }) => {
                        const subIsActive = currentUrl === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={subIsActive}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

