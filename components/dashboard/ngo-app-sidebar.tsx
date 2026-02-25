"use client"

import LocaleLink from "@/components/locale-link"
import { usePathname } from "next/navigation"
import { useLocale, localePath } from "@/hooks/use-locale"
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Users,
  Building2,
  Settings,
  Bell,
  Search,
  CreditCard,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navGroups = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/ngo/dashboard", icon: LayoutDashboard },
      { title: "Post Requirement", href: "/ngo/post-project", icon: PlusCircle },
      { title: "My Requirements", href: "/ngo/projects", icon: FolderKanban },
      { title: "Applications", href: "/ngo/applications", icon: Users },
      { title: "Find Talent", href: "/ngo/find-talent", icon: Search },
      { title: "Messages", href: "/ngo/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", href: "/ngo/notifications", icon: Bell },
      { title: "Organization", href: "/ngo/profile", icon: Building2 },
      { title: "Billing", href: "/ngo/settings?tab=billing", icon: CreditCard },
      { title: "Upgrade Plan", href: "/pricing", icon: Sparkles, highlight: true },
      { title: "Settings", href: "/ngo/settings", icon: Settings },
    ],
  },
]

export function NGOAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <LocaleLink href="/ngo/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">NGO Dashboard</span>
                  <span className="truncate text-xs text-muted-foreground">Manage your organization</span>
                </div>
              </LocaleLink>
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
                  const isActive = pathname === localePath(item.href, locale) ||
                    (item.href.includes("?") && pathname === localePath(item.href.split("?")[0], locale))
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={item.highlight && !isActive ? "text-primary" : undefined}
                      >
                        <LocaleLink href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </LocaleLink>
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
