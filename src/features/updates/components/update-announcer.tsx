import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useAppUpdate } from '@/features/updates/hooks/use-app-update'
import { openExternalUrl } from '@/features/updates/lib/update-runtime'

export function UpdateAnnouncer() {
  const update = useAppUpdate()
  const announcedVersion = useRef<string | null>(null)

  useEffect(() => {
    if (!update.hasUpdate || !update.latest?.preferredUrl) return
    if (announcedVersion.current === update.latest.version) return

    announcedVersion.current = update.latest.version
    toast.message(`Update v${update.latest.version} tersedia`, {
      description: 'Buka update terbaru dari GitHub Release atau pakai versi web terbaru.',
      action: {
        label: 'Update',
        onClick: () => {
          void openExternalUrl(update.latest!.preferredUrl!)
        },
      },
    })
  }, [update.hasUpdate, update.latest])

  return null
}
