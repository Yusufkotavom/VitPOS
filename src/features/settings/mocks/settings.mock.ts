export type SettingRow = { id: string; area: string; setting: string; value: string; updatedAt: string; status: string }

export const settingRows: SettingRow[] = [
  { id: '1', area: 'Profil Usaha', setting: 'Nama usaha dan logo', value: 'Toko Sumber Rejeki', updatedAt: '8 Juni 2026', status: 'Lengkap' },
  { id: '2', area: 'Legal', setting: 'NPWP dan NIB', value: 'Belum diisi', updatedAt: '-', status: 'Belum Lengkap' },
  { id: '3', area: 'Struk', setting: 'Header/footer struk', value: 'Template default', updatedAt: '8 Juni 2026', status: 'Lengkap' },
]
