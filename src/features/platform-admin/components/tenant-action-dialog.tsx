import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { platformAdminService, type PlatformPlan, type PlatformTenant, type TenantUpdateInput } from '@/services/api/platform-admin.service'

type TenantActionState = {
  planCode: string
  planValidUntil: string
  storageLimitMb: string
  maxBranches: string
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled'
}

function toLocalDateInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function TenantActionDialog({
  tenant,
  plans,
  onClose,
  onSuspend,
  onReactivate,
  onUpdated,
}: {
  tenant: PlatformTenant | null
  plans: PlatformPlan[]
  onClose: () => void
  onSuspend: (id: string) => void
  onReactivate: (id: string) => void
  onUpdated: () => void
}) {
  const [form, setForm] = useState<TenantActionState>({
    planCode: '',
    planValidUntil: '',
    storageLimitMb: '',
    maxBranches: '',
    subscriptionStatus: 'active',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenant) {
      setForm({
        planCode: tenant.packageName,
        planValidUntil: toLocalDateInput(tenant.planValidUntil),
        storageLimitMb: String(Math.round(tenant.storageLimitGb * 1024)),
        maxBranches: String(tenant.maxBranches),
        subscriptionStatus: tenant.subscriptionStatus as TenantActionState['subscriptionStatus'],
      })
      setError(null)
    }
  }, [tenant])

  const updateMutation = useMutation({
    mutationFn: (input: TenantUpdateInput) => platformAdminService.updateTenant(tenant!.id, input),
    onSuccess: onUpdated,
    onError: (err: Error) => setError(err.message),
  })

  if (!tenant) return null

  function applyPlan(code: string) {
    const plan = plans.find((p) => p.code === code)
    if (!plan) return
    setForm((prev) => ({
      ...prev,
      planCode: code,
      storageLimitMb: String(plan.storageLimitMb),
      maxBranches: String(plan.maxBranches),
    }))
  }

  function submit() {
    const payload: TenantUpdateInput = {
      planCode: form.planCode || undefined,
      planValidUntil: form.planValidUntil ? new Date(form.planValidUntil).toISOString() : null,
      storageLimitMb: Number(form.storageLimitMb) || undefined,
      maxBranches: Number(form.maxBranches) || undefined,
      subscriptionStatus: form.subscriptionStatus,
    }
    updateMutation.mutate(payload)
  }

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kelola Tenant</DialogTitle>
          <DialogDescription>{tenant.tenantName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {error && <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="flex flex-col gap-2">
            <Label>Paket</Label>
            <Select value={form.planCode} onValueChange={applyPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.filter((p) => p.isActive).map((p) => (
                  <SelectItem key={p.id} value={p.code}>{p.name} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status langganan</Label>
            <Select value={form.subscriptionStatus} onValueChange={(v) => setForm({ ...form, subscriptionStatus: v as TenantActionState['subscriptionStatus'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Berlaku sampai</Label>
            <Input type="date" value={form.planValidUntil} onChange={(e) => setForm({ ...form, planValidUntil: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Storage limit (MB)</Label>
              <Input type="number" min={0} value={form.storageLimitMb} onChange={(e) => setForm({ ...form, storageLimitMb: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Max cabang</Label>
              <Input type="number" min={1} value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {tenant.isActive ? (
              <Button variant="destructive" onClick={() => onSuspend(tenant.id)}>Suspend</Button>
            ) : (
              <Button variant="outline" onClick={() => onReactivate(tenant.id)}>Aktifkan kembali</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>Batal</Button>
            <Button onClick={submit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan perubahan'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
