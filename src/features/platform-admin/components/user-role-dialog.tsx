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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { platformAdminService, type PlatformUser } from '@/services/api/platform-admin.service'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function UserRoleDialog({
  user,
  onClose,
  onUpdated,
}: {
  user: PlatformUser | null
  onClose: () => void
  onUpdated: () => void
}) {
  const currentUserId = useAuthStore((s) => s.currentUser?.id)
  const [role, setRole] = useState<'user' | 'platform_admin'>(user?.role ?? 'user')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setRole(user.role)
      setError(null)
    }
  }, [user])

  const updateMutation = useMutation({
    mutationFn: (newRole: 'user' | 'platform_admin') =>
      platformAdminService.updateUser(user!.id, { role: newRole }),
    onSuccess: onUpdated,
    onError: (err: Error) => setError(err.message),
  })

  if (!user) return null

  const isSelf = user.id === currentUserId

  function submit() {
    if (isSelf && role !== 'platform_admin') {
      setError('Tidak bisa menurunkan role Anda sendiri dari platform admin.')
      return
    }
    updateMutation.mutate(role)
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Role User</DialogTitle>
          <DialogDescription>{user.name} · {user.email}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {error && <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'platform_admin')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="platform_admin">Platform Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Platform admin dapat mengelola paket, tenant, dan user lain.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>Batal</Button>
          <Button onClick={submit} disabled={updateMutation.isPending || isSelf}>
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
