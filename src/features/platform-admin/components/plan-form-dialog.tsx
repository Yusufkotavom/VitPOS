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

import { platformAdminService, type PlatformPlan } from '@/services/api/platform-admin.service'

type PlanFormState = {
  code: string
  name: string
  monthlyPrice: string
  storageLimitMb: string
  maxBranches: string
  maxUsers: string
  isActive: 'true' | 'false'
}

const EMPTY: PlanFormState = {
  code: '',
  name: '',
  monthlyPrice: '0',
  storageLimitMb: '512',
  maxBranches: '1',
  maxUsers: '1',
  isActive: 'true',
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
  const [form, setForm] = useState<PlanFormState>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (plan) {
      setForm({
        code: plan.code,
        name: plan.name,
        monthlyPrice: String(plan.monthlyPrice),
        storageLimitMb: String(plan.storageLimitMb),
        maxBranches: String(plan.maxBranches),
        maxUsers: String(plan.maxUsers),
        isActive: plan.isActive ? 'true' : 'false',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [plan, open])

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
      monthlyPrice: Number(form.monthlyPrice),
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
              <Label>Kode paket</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="starter" disabled={!!plan} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Nama paket</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Starter" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Harga bulanan (Rp)</Label>
            <Input type="number" min={0} value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Storage (MB)</Label>
              <Input type="number" min={0} value={form.storageLimitMb} onChange={(e) => setForm({ ...form, storageLimitMb: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Max Cabang</Label>
              <Input type="number" min={1} value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Max User</Label>
              <Input type="number" min={1} value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v as 'true' | 'false' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
