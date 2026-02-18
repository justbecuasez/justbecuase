import { redirect, notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getConversation, getConversationMessages, getNGOProfile } from "@/lib/actions"
import { MessageThreadPro } from "@/components/messages/message-thread-pro"
import { getUserInfo } from "@/lib/user-utils"
import { getDb } from "@/lib/database"
import { ObjectId } from "mongodb"

interface Props {
  params: Promise<{ id: string }>
}

export default async function NGOMessageThreadPage({ params }: Props) {
  const { id } = await params
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Role verification: Ensure user is an NGO
  if (session.user.role !== "ngo") {
    if (session.user.role === "volunteer") {
      redirect("/volunteer/dashboard")
    } else if (session.user.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/auth/role-select")
    }
  }

  // Redirect to onboarding if not completed
  if (!session.user.isOnboarded) {
    redirect("/ngo/onboarding")
  }

  const ngoProfile = await getNGOProfile()
  const conversation = await getConversation(id)

  if (!conversation) {
    notFound()
  }

  // Get messages
  const messages = await getConversationMessages(id)

  // Find the other participant (Volunteer)
  const otherParticipantId = conversation.participants.find(
    (p: string) => p !== session.user.id
  )

  if (!otherParticipantId) {
    notFound()
  }

  // Get volunteer info using centralized utility
  const volunteerInfo = await getUserInfo(otherParticipantId)

  // Get project title if related to a project
  let projectTitle: string | undefined
  if (conversation.projectId) {
    const db = await getDb()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(conversation.projectId),
    })
    projectTitle = project?.title
  }

  return (
    <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <MessageThreadPro
              conversationId={id}
              currentUserId={session.user.id}
              otherParticipant={{
                id: otherParticipantId,
                name: volunteerInfo?.name || "Impact Agent",
                avatar: volunteerInfo?.image,
                type: "volunteer",
              }}
              messages={messages}
              projectTitle={projectTitle}
              projectId={conversation.projectId}
              backUrl="/ngo/messages"
            />
          </div>
    </main>
  )
}
