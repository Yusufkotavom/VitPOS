import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { messageTemplateService, TEMPLATE_LABELS, TEMPLATE_VARIABLES, DEFAULT_TEMPLATES, type MessageTemplateType } from '@/services/message-template.service'
import { RotateCcw, Save } from 'lucide-react'

const TEMPLATE_TYPES: MessageTemplateType[] = ['invoice', 'shortage', 'paid', 'status', 'product_info', 'service_order']

export function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const loaded: Record<string, string> = {}
        for (const type of TEMPLATE_TYPES) {
          loaded[type] = await messageTemplateService.getTemplate(type)
        }
        if (!cancelled) setTemplates(loaded)
      } catch (err) {
        console.error('Gagal memuat template:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleSave(type: MessageTemplateType) {
    const value = templates[type]
    await messageTemplateService.setOverride(type, value)
    setEditing((prev) => ({ ...prev, [type]: false }))
    toast.success(`Template ${TEMPLATE_LABELS[type]} disimpan`)
  }

  async function handleReset(type: MessageTemplateType) {
    await messageTemplateService.resetToDefault(type)
    setTemplates((prev) => ({ ...prev, [type]: DEFAULT_TEMPLATES[type] }))
    setEditing((prev) => ({ ...prev, [type]: false }))
    toast.success(`Template ${TEMPLATE_LABELS[type]} direset ke default`)
  }

  if (loading) {
    return (
      <PageShell title="Template Pesan WhatsApp" description="Atur template pesan WhatsApp untuk berbagai keperluan">
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Template Pesan WhatsApp" description="Atur template pesan WhatsApp untuk berbagai keperluan">
      <SettingsNav className="mb-6" />
      <div className="space-y-6">
        {TEMPLATE_TYPES.map((type) => (
          <div key={type} className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{TEMPLATE_LABELS[type]}</h3>
                <p className="text-xs text-muted-foreground">
                  Variable: {TEMPLATE_VARIABLES[type].map((v) => `{{${v}}}`).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                {editing[type] ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleReset(type)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => handleSave(type)}>
                      <Save className="mr-1 h-3.5 w-3.5" />
                      Simpan
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditing((prev) => ({ ...prev, [type]: true }))}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
            {editing[type] ? (
              <Textarea
                value={templates[type]}
                onChange={(e) => setTemplates((prev) => ({ ...prev, [type]: e.target.value }))}
                rows={8}
                className="font-mono text-sm"
              />
            ) : (
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm font-mono">{templates[type]}</pre>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  )
}
