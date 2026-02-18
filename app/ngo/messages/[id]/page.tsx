"use client"

import { use } from "react"
import { ChatView } from "@/components/stream/chat-view"

interface Props {
  params: Promise<{ id: string }>
}

export default function NGOMessageThreadPage({ params }: Props) {
  const { id } = use(params)

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Communicate with impact agents about your projects
        </p>
      </div>
      <ChatView userType="ngo" activeChannelId={id} />
    </main>
  )
}
