import { useState } from 'react'
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

import { platformAdminService, type PlatformPlan } from '@/services/api/platform-admin.service'

type PlanFormState = {
  code: string
  name: string
  billingPeriod: 'monthly' | 'yearly'
  durationDays: string
  trialDays: string
  monthlyPrice: string
  yearlyPrice: string
  storageLimitMb: string
  maxBranches: string
  maxUsers: string
  isActive: 'true' | 'false'
}

const EMPTY: PlanFormState = {
  code: '',
  name: '',
  billingPeriod: 'monthly',
  durationDays: '30',
  trialDays: '0',
  monthlyPrice: '0',
  yearlyPrice: '',
  storageLimitMb: '512',
  maxBranches: '1',
  maxUsers: '1',
  isActive: 'true',
}

function getInitialForm(plan: PlatformPlan | null): PlanFormState {
  if (!plan) return EMPTY

  return {
    code: plan.code,
    name: plan.name,
    billingPeriod: plan.billingPeriod,
    durationDays: String(plan.durationDays),
    trialDays: String(plan.trialDays),
    monthlyPrice: String(plan.monthlyPrice),
    yearlyPrice: plan.yearlyPrice ? String(plan.yearlyPrice) : '',
    storageLimitMb: String(plan.storageLimitMb),
    maxBranches: String(plan.maxBranches),
    maxUsers: String(plan.maxUsers),
    isActive: plan.isActive ? 'true' : 'false',
  }
}

export function PlanFormDialog({
  open,
  plan,
  onClose,
  onSaved,
}: {
  open: boolean
  plan: PlatformPlan | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PlanFormState>(() => getInitialForm(plan))
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: platformAdminService.createPlan,
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof platformAdminService.updatePlan>[1] }) =>
      platformAdminService.updatePlan(id, data),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  })

  function submit() {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      billingPeriod: form.billingPeriod,
      durationDays: Number(form.durationDays),
      trialDays: Number(form.trialDays),
      monthlyPrice: Number(form.monthlyPrice),
      yearlyPrice: form.yearlyPrice.trim() ? Number(form.yearlyPrice) : null,
      storageLimitMb: Number(form.storageLimitMb),
      maxBranches: Number(form.maxBranches),
      maxUsers: Number(form.maxUsers),
      isActive: form.isActive === 'true',
    }

    if (!payload.code || !payload.name) {
      setError('Kode dan nama paket wajib diisi')
      return
    }
    if (Number.isNaN(payload.monthlyPrice) || payload.monthlyPrice < 0) {
      setError('Harga bulanan tidak valid')
      return
    }
    if (Number.isNaN(payload.durationDays) || payload.durationDays < 1) {
      setError('Durasi aktif tidak valid')
      return
    }
    if (Number.isNaN(payload.trialDays) || payload.trialDays < 0) {
      setError('Durasi trial tidak valid')
      return
    }
    if (payload.yearlyPrice !== null && (Number.isNaN(payload.yearlyPrice) || payload.yearlyPrice < 0)) {
      setError('Harga tahunan tidak valid')
      return
    }

    if (plan) {
      updateMutation.mutate({ id: plan.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Paket' : 'Buat Paket Baru'}</DialogTitle>
          <DialogDescription>Atur harga, kapasitas, dan batas tenant untuk paket ini.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {error && <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-code">Kode paket</Label>
              <Input id="plan-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="starter" disabled={!!plan} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-name">Nama paket</Label>
              <Input id="plan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Starter" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-billing-period">Periode billing</Label>
              <Select value={form.billingPeriod} onValueChange={(v) => setForm({ ...form, billingPeriod: v as 'monthly' | 'yearly' })}>
                <SelectTrigger id="plan-billing-period" aria-label="Periode billing"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-duration-days">Durasi aktif (hari)</Label>
              <Input id="plan-duration-days" type="number" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-trial-days">Trial (hari)</Label>
              <Input id="plan-trial-days" type="number" min={0} value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-monthly-price">Harga bulanan (Rp)</Label>
            <Input id="plan-monthly-price" type="number" min={0} value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-yearly-price">Harga tahunan (Rp)</Label>
            <Input id="plan-yearly-price" type="number" min={0} value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })} placeholder="Kosongkan bila tidak ada" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-storage">Storage (MB)</Label>
              <Input id="plan-storage" type="number" min={0} value={form.storageLimitMb} onChange={(e) => setForm({ ...form, storageLimitMb: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-max-branches">Max Cabang</Label>
              <Input id="plan-max-branches" type="number" min={1} value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-max-users">Max User</Label>
              <Input id="plan-max-users" type="number" min={1} value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-status">Status</Label>
            <Select value={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v as 'true' | 'false' })}>
              <SelectTrigger id="plan-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Non-aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
