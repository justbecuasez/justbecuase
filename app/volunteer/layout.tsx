"use client"

import type React from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { NotificationListener } from "@/components/notifications/notification-listener"
import { VolunteerAppSidebar } from "@/components/dashboard/volunteer-app-sidebar"
import { DashboardContentHeader } from "@/components/dashboard/dashboard-content-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { StreamProvider } from "@/components/stream/stream-provider"
import { IncomingCallHandler } from "@/components/stream/incoming-call-handler"

function VolunteerLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <StreamProvider>
      <SidebarProvider>
        <VolunteerAppSidebar />
        <SidebarInset>
          <DashboardContentHeader
            userType="volunteer"
            userName={user?.name || "Impact Agent"}
            userAvatar={user?.image || undefined}
          />
          {user?.id && <NotificationListener userId={user.id} userType="volunteer" />}
          <IncomingCallHandler />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </StreamProvider>
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
