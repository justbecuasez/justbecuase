"use client"

import { ChatView } from "@/components/stream/chat-view"

export default function NGOMessagesPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Communicate with impact agents about your projects
        </p>
      </div>
      <ChatView userType="ngo" />
    </main>
  )
}
