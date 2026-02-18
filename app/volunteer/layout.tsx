"use client"

import type React from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { NotificationListener } from "@/components/notifications/notification-listener"
import { VolunteerAppSidebar } from "@/components/dashboard/volunteer-app-sidebar"
import { DashboardContentHeader } from "@/components/dashboard/dashboard-content-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

function VolunteerLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <SidebarProvider>
      <VolunteerAppSidebar />
      <SidebarInset>
        <DashboardContentHeader
          userType="volunteer"
          userName={user?.name || "Impact Agent"}
          userAvatar={user?.image || undefined}
        />
        {user?.id && <NotificationListener userId={user.id} userType="volunteer" />}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <VolunteerLayoutInner>{children}</VolunteerLayoutInner>
    </AuthProvider>
  )
}
