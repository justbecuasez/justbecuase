"use client"

import type React from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { NotificationListener } from "@/components/notifications/notification-listener"
import { NGOAppSidebar } from "@/components/dashboard/ngo-app-sidebar"
import { DashboardContentHeader } from "@/components/dashboard/dashboard-content-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { StreamProvider } from "@/components/stream/stream-provider"
import { IncomingCallHandler } from "@/components/stream/incoming-call-handler"

function NGOLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <StreamProvider>
      <SidebarProvider>
        <NGOAppSidebar />
        <SidebarInset>
          <DashboardContentHeader
            userType="ngo"
            userName={user?.name || "NGO"}
            userAvatar={user?.image || undefined}
          />
          {user?.id && <NotificationListener userId={user.id} userType="ngo" />}
          <IncomingCallHandler />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </StreamProvider>
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
