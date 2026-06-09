import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useAppUpdate } from '@/features/updates/hooks/use-app-update'
import { openExternalUrl } from '@/features/updates/lib/update-runtime'
import { detectRuntimePlatform } from '@/features/updates/lib/update-runtime'
import { installNativeTauriUpdate } from '@/features/updates/lib/tauri-native-updater'

export function UpdateAnnouncer() {
  const update = useAppUpdate()
  const announcedVersion = useRef<string | null>(null)
  const platform = detectRuntimePlatform()

  useEffect(() => {
    if (!update.hasUpdate || !update.latest?.preferredUrl) return
    if (announcedVersion.current === update.latest.version) return

    announcedVersion.current = update.latest.version
    toast.message(`Update v${update.latest.version} tersedia`, {
      description: 'Buka update terbaru dari GitHub Release atau pakai versi web terbaru.',
      action: {
        label: 'Update',
        onClick: () => {
          if (platform.startsWith('tauri-')) {
            void installNativeTauriUpdate().catch(() => openExternalUrl(update.latest!.preferredUrl!))
            return
          }

          void openExternalUrl(update.latest!.preferredUrl!)
        },
      },
    })
  }, [platform, update.hasUpdate, update.latest])

  return null
}
