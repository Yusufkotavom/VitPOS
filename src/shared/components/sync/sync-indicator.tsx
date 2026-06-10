import { CloudAlert, CloudCheck, CloudCog, CloudOff, CloudUpload } from 'lucide-react'
import { Link } from 'react-router-dom'

import { type SyncSummary } from '@/features/sync/types/sync.types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function getState(summary: SyncSummary) {
  if (!summary.isOnline) return { label: 'Data menunggu sinkron', color: 'bg-gray-400', icon: CloudOff, spin: false }
  if (summary.conflictCount > 0) return { label: 'Butuh pemeriksaan', color: 'bg-red-500', icon: CloudAlert, spin: false }
  if (summary.failedCount > 0) return { label: 'Coba sinkron ulang', color: 'bg-red-500', icon: CloudAlert, spin: false }
  if (summary.status === 'syncing') return { label: 'Menyinkronkan data', color: 'bg-blue-500', icon: CloudCog, spin: true }
  if (summary.pendingCount > 0) return { label: 'Data menunggu sinkron', color: 'bg-amber-500', icon: CloudUpload, spin: false }
  return { label: 'Data sudah aman di cloud', color: 'bg-green-500', icon: CloudCheck, spin: false }
}

export function SyncIndicator({ summary }: { summary: SyncSummary }) {
  const state = getState(summary)
  const Icon = state.icon

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/sync"
            className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon
              className={`size-5 ${state.spin ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span
              className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background ${state.color}`}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <p className="text-xs">{state.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
