import { isTauriRuntime } from '@/features/updates/lib/update-runtime'

export async function installNativeTauriUpdate() {
  if (!isTauriRuntime()) {
    return false
  }

  const [{ check }, { relaunch }] = await Promise.all([
    import('@tauri-apps/plugin-updater'),
    import('@tauri-apps/plugin-process'),
  ])

  const update = await check()
  if (!update) {
    return false
  }

  await update.downloadAndInstall()
  await relaunch()
  return true
}
