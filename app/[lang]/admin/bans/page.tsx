"use client"

import { useState, useEffect } from "react"
import { useDictionary } from "@/components/dictionary-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getBanRecords } from "@/lib/actions"
import { Ban, Loader2, User, Building2 } from "lucide-react"
import type { BanRecord } from "@/lib/types"
import { AdminBanTableSkeleton } from "@/components/ui/page-skeletons"

export default function AdminBansPage() {
  const dict = useDictionary();
  const [records, setRecords] = useState<BanRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  async function loadRecords() {
    setLoading(true)
    const result = await getBanRecords()
    if (result.success && result.data) {
      setRecords(result.data)
    }
    setLoading(false)
  }

  const activeCount = records.filter(r => r.isActive).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{dict.admin?.bans?.title || "Ban History"}</h1>
        <p className="text-muted-foreground">
          {dict.admin?.bans?.subtitle || "View and manage banned users"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-sm text-muted-foreground">{dict.admin?.bans?.currentlyBanned || "Currently Banned"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Ban className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{records.length}</p>
              <p className="text-sm text-muted-foreground">{dict.admin?.bans?.totalBanRecords || "Total Ban Records"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {records.length - activeCount}
              </p>
              <p className="text-sm text-muted-foreground">{dict.admin?.bans?.unbanned || "Unbanned"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ban Records List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{dict.admin?.bans?.allBanRecords || "All Ban Records"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <AdminBanTableSkeleton />
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{dict.admin?.bans?.tableUser || "User"}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{dict.admin?.bans?.tableType || "Type"}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{dict.admin?.bans?.tableReason || "Reason"}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{dict.admin?.bans?.tableStatus || "Status"}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{dict.admin?.bans?.tableBannedAt || "Banned At"}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{dict.admin?.bans?.tableUnbannedAt || "Unbanned At"}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id?.toString()} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {record.userType === "volunteer" ? (
                              <User className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium text-foreground text-sm truncate">
                            {record.userId.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {record.userType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                        {record.reason}
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={record.isActive ? "destructive" : "secondary"}
                        >
                          {record.isActive ? (dict.admin?.bans?.statusBanned || "Banned") : (dict.admin?.bans?.statusUnbanned || "Unbanned")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(record.bannedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {record.unbannedAt 
                          ? new Date(record.unbannedAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{dict.admin?.bans?.noBanRecords || "No ban records found"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {dict.admin?.bans?.noBanRecordsDescription || "Ban records will appear here when users are banned"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
