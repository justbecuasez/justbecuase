import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getNGOProfile, getMyConversations } from "@/lib/actions"
import { ConversationsList } from "@/components/messages/conversations-list"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Users, Send } from "lucide-react"

export default async function NGOMessagesPage() {
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
  const conversations = await getMyConversations()

  // Calculate stats
  const totalConversations = conversations.length
  const unreadCount = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0)

  return (
    <main className="flex-1 p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with impact agents about your projects
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalConversations}</p>
                  <p className="text-xs text-muted-foreground">Total Conversations</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className={unreadCount > 0 ? "bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${unreadCount > 0 ? "bg-orange-500/10" : "bg-muted"}`}>
                  <Send className={`h-5 w-5 ${unreadCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread Messages</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{conversations.filter((c: any) => c.volunteerName).length}</p>
                  <p className="text-xs text-muted-foreground">Active Impact Agents</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <ConversationsList
                initialConversations={conversations}
                userType="ngo"
                baseUrl="/ngo/messages"
              />
            </div>

            {/* Message Thread Placeholder */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col border-dashed">
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a conversation from the list to view messages and continue chatting with impact agents about your projects
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </main>
  )
}
