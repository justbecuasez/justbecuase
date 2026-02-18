"use client"

import { use } from "react"
import { ChatView } from "@/components/stream/chat-view"

interface Props {
  params: Promise<{ id: string }>
}

export default function VolunteerMessageThreadPage({ params }: Props) {
  const { id } = use(params)

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Communicate with NGOs about your applications
        </p>
      </div>
      <ChatView userType="volunteer" activeChannelId={id} />
    </main>
  )
}
