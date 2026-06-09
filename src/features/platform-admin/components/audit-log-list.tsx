import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentCard } from '@/shared/components/display/content-card'

import { platformAdminService } from '@/services/api/platform-admin.service'
import { useState } from 'react'

export function AuditLogList() {
  const [offset, setOffset] = useState(0)
  const limit = 25

  const { data, isLoading } = useQuery({
    queryKey: ['platform-audit', offset, limit],
    queryFn: () => platformAdminService.getAuditLogs({ limit, offset }),
  })

  const logs = data?.items ?? []
  const total = data?.total ?? 0
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <ContentCard
      title="Audit Log"
      description={`Riwayat aksi admin. Total ${total} entri.`}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat log...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li key={log.id} className="border rounded-xl p-3 flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {log.targetType}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium">{log.actorName ?? log.actorId}</span>
                  {' '}
                  <span className="text-muted-foreground">
                    → {log.targetType} {log.targetId ? <code className="font-mono text-xs">{log.targetId.slice(0, 8)}</code> : ''}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Halaman {page} / {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}>
                Berikutnya
              </Button>
            </div>
          </div>
        </div>
      )}
    </ContentCard>
  )
}
