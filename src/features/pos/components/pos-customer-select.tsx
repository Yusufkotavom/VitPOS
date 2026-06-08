import { useState } from 'react'
import { Plus, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { useCustomers } from '@/features/customers/hooks/use-customers'

export function PosCustomerSelect() {
  const customerName = usePosStore(state => state.customerName)
  const setCustomer = usePosStore(state => state.setCustomer)
  const localCustomers = useCustomers()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')

  const activeCustomers = localCustomers.filter(c => c.status === 'Aktif')

  function handleInputChange(name: string) {
    const match = activeCustomers.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (match) {
      setCustomer(match.id, match.name)
    } else if (name === '') {
      setCustomer(null, null)
    } else {
      // Allow custom typed name
      setCustomer(`custom-${Date.now()}`, name)
    }
  }

  function handleAddSave() {
    if (!newCustName.trim()) return
    const tempId = `cust-${Date.now()}`
    setCustomer(tempId, newCustName.trim())
    setNewCustName('')
    setIsAddOpen(false)
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          list="customers-datalist"
          value={customerName || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Cari / Pilih Pelanggan (Umum)"
          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <datalist id="customers-datalist">
          {activeCustomers.map(c => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>
      
      <Button variant="outline" className="h-11 w-11 rounded-xl" onClick={() => setIsAddOpen(true)}>
        <Plus className="size-5" />
      </Button>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1 block">Nama Pelanggan</label>
            <Input 
              value={newCustName} 
              onChange={e => setNewCustName(e.target.value)} 
              placeholder="Nama lengkap" 
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
            <Button onClick={handleAddSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
