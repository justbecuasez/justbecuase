"use client"

import type React from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { NotificationListener } from "@/components/notifications/notification-listener"
import { NGOAppSidebar } from "@/components/dashboard/ngo-app-sidebar"
import { DashboardContentHeader } from "@/components/dashboard/dashboard-content-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

function NGOLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <SidebarProvider>
      <NGOAppSidebar />
      <SidebarInset>
        <DashboardContentHeader
          userType="ngo"
          userName={user?.name || "NGO"}
          userAvatar={user?.image || undefined}
        />
        {user?.id && <NotificationListener userId={user.id} userType="ngo" />}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function NGOLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <NGOLayoutInner>{children}</NGOLayoutInner>
    </AuthProvider>
  )
}
