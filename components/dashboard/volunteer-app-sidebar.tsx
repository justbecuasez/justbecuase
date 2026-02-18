"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  User,
  Settings,
  Bell,
  Sparkles,
  Bookmark,
  Trophy,
  Gift,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navGroups = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/volunteer/dashboard", icon: LayoutDashboard },
      { title: "Impact Dashboard", href: "/volunteer/impact", icon: Trophy },
      { title: "Opportunities", href: "/volunteer/opportunities", icon: Sparkles },
      { title: "Applications", href: "/volunteer/applications", icon: FolderKanban },
      { title: "Saved Opportunities", href: "/volunteer/saved-projects", icon: Bookmark },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", href: "/volunteer/notifications", icon: Bell },
      { title: "Refer & Earn", href: "/volunteer/referrals", icon: Gift },
      { title: "My Profile", href: "/volunteer/profile", icon: User },
      { title: "Settings", href: "/volunteer/settings", icon: Settings },
    ],
  },
]

export function VolunteerAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/volunteer/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Impact Agent</span>
                  <span className="truncate text-xs text-muted-foreground">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
