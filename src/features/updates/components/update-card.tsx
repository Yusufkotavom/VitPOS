import { RefreshCw, Rocket, Smartphone, Monitor, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppUpdate } from '@/features/updates/hooks/use-app-update'
import { detectRuntimePlatform, openExternalUrl } from '@/features/updates/lib/update-runtime'

const PLATFORM_LABEL: Record<ReturnType<typeof detectRuntimePlatform>, string> = {
  web: 'Browser / Web',
  'android-apk': 'Android APK',
  'tauri-windows': 'Desktop Windows',
  'tauri-linux': 'Desktop Linux',
  'tauri-macos': 'Desktop macOS',
}

export function UpdateCard() {
  const update = useAppUpdate()
  const platform = detectRuntimePlatform()
  const latest = update.latest

  const preferredLabel = latest?.preferredChannel === 'apk'
    ? 'Unduh APK terbaru'
    : latest?.preferredChannel === 'desktop'
      ? 'Unduh installer terbaru'
      : 'Buka versi web terbaru'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="size-4" />
              Update Aplikasi
            </CardTitle>
            <CardDescription>
              Cek rilis terbaru dari GitHub untuk web, APK Android, dan installer desktop.
            </CardDescription>
          </div>
          <Badge variant={update.hasUpdate ? 'default' : 'secondary'}>
            {update.hasUpdate ? 'Update tersedia' : 'Versi terbaru'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-muted-foreground">Platform aktif</p>
            <p className="mt-1 font-medium">{PLATFORM_LABEL[platform]}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-muted-foreground">Versi terpasang</p>
            <p className="mt-1 font-medium">v{update.currentVersion}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-muted-foreground">Versi rilis terbaru</p>
            <p className="mt-1 font-medium">{latest ? `v${latest.version}` : 'Belum terbaca'}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-muted-foreground">Pemeriksaan terakhir</p>
            <p className="mt-1 font-medium">
              {update.checkedAt
                ? formatDistanceToNow(new Date(update.checkedAt), { addSuffix: true, locale: id })
                : 'Belum pernah'}
            </p>
          </div>
        </div>

        {update.error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-destructive">
            {update.error}
          </div>
        ) : null}

        <div className="rounded-xl border bg-background p-3">
          <p className="font-medium">Cara update yang tersedia</p>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <div className="flex items-start gap-2">
              <Globe className="mt-0.5 size-4" />
              <span>Versi web selalu bisa dibuka langsung jika butuh fitur terbaru tanpa install ulang.</span>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="mt-0.5 size-4" />
              <span>Android non-Play Store akan diarahkan ke APK terbaru dari GitHub Release.</span>
            </div>
            <div className="flex items-start gap-2">
              <Monitor className="mt-0.5 size-4" />
              <span>Tauri desktop akan diarahkan ke installer terbaru sesuai OS.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void update.refresh()} disabled={update.loading}>
            <RefreshCw className="size-4" />
            {update.loading ? 'Memeriksa...' : 'Cek ulang'}
          </Button>
          {latest?.preferredUrl ? (
            <Button onClick={() => void openExternalUrl(latest.preferredUrl!)}>
              <Rocket className="size-4" />
              {preferredLabel}
            </Button>
          ) : null}
          {latest?.webUrl ? (
            <Button variant="secondary" onClick={() => void openExternalUrl(latest.webUrl)}>
              <Globe className="size-4" />
              Buka aplikasi web terbaru
            </Button>
          ) : null}
          {latest?.releaseUrl ? (
            <Button variant="ghost" onClick={() => void openExternalUrl(latest.releaseUrl)}>
              Lihat catatan rilis
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
