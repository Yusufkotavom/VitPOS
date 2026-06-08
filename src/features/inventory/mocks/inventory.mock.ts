export type InventoryRow = { id: string; product: string; warehouse: string; stockSystem: string; stockSafe: string; movement: string; status: string }

export const inventoryRows: InventoryRow[] = [
  { id: '1', product: 'Kabel Type-C', warehouse: 'Gudang Utama', stockSystem: '24 pcs', stockSafe: '10 pcs', movement: 'Sale - 8 Juni 2026', status: 'Aman' },
  { id: '2', product: 'Minyak Goreng 1L', warehouse: 'Gudang Toko', stockSystem: '5 botol', stockSafe: '12 botol', movement: 'Sale - 8 Juni 2026', status: 'Stok Rendah' },
  { id: '3', product: 'Roti Coklat', warehouse: 'Gudang Toko', stockSystem: '0 pcs', stockSafe: '8 pcs', movement: 'Sale - 8 Juni 2026', status: 'Habis' },
]
