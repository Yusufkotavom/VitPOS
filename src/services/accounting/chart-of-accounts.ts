import { dexieDb } from '@/services/local-db/dexie-instance'
import type { AccountType, LocalAccount } from '@/services/local-db/schema'
import type { SyncStatus } from '@/services/local-db/schema'

/** System account definitions — created once per tenant on first use. */
export interface SystemAccountDef {
  code: string
  name: string
  type: AccountType
  isSystem: true
}

export const SYSTEM_ACCOUNTS: SystemAccountDef[] = [
  // 1xxx — Asset
  { code: '1-1100', name: 'Kas Tunai', type: 'asset', isSystem: true },
  { code: '1-2000', name: 'Persediaan', type: 'asset', isSystem: true },
  { code: '1-3000', name: 'Piutang Usaha', type: 'asset', isSystem: true },
  // 2xxx — Liability
  { code: '2-1000', name: 'Hutang Usaha', type: 'liability', isSystem: true },
  // 3xxx — Equity
  { code: '3-1000', name: 'Modal', type: 'equity', isSystem: true },
  { code: '3-2000', name: 'Laba Ditahan', type: 'equity', isSystem: true },
  { code: '3-3000', name: 'Laba Berjalan', type: 'equity', isSystem: true },
  // 4xxx — Revenue
  { code: '4-1000', name: 'Pendapatan Penjualan', type: 'revenue', isSystem: true },
  { code: '4-2000', name: 'Pendapatan Jasa', type: 'revenue', isSystem: true },
  // 5xxx — COGS
  { code: '5-1000', name: 'Harga Pokok Penjualan', type: 'cogs', isSystem: true },
  // 6xxx — Expense
  { code: '6-2000', name: 'Penyesuaian Persediaan', type: 'expense', isSystem: true },
]

/** Payment method type → account code prefix + name template */
const PAYMENT_METHOD_ACCOUNT_MAP = [
  { type: 'tunai', codePrefix: '1-1100', suffixTemplate: 'Kas Tunai', fixed: true, fixedCode: '1-1100' },
  { type: 'qris', codePrefix: '1-12', suffixTemplate: (pm: { provider: string }) => `QRIS ${pm.provider}`, fixed: false },
  { type: 'transfer', codePrefix: '1-13', suffixTemplate: (pm: { provider: string }) => `Transfer ${pm.provider}`, fixed: false },
  { type: 'kartu', codePrefix: '1-13', suffixTemplate: (pm: { provider: string }) => `Kartu ${pm.provider}`, fixed: false },
  { type: 'ewallet', codePrefix: '1-14', suffixTemplate: (pm: { provider: string }) => `E-Wallet ${pm.provider}`, fixed: false },
  { type: 'piutang', codePrefix: '1-3000', suffixTemplate: 'Piutang Usaha', fixed: true, fixedCode: '1-3000' },
] as const

/** Generate a unique account code within a numeric range for auto-created accounts. */
async function nextCodeInRange(tenantId: string, prefix: string): Promise<string> {
  const accounts = await dexieDb.accounts
    .where('[tenantId+code]')
    .between([tenantId, prefix], [tenantId, prefix + '\uFFFF'])
    .toArray()

  const existingCodes = accounts.map((a) => a.code)
  let counter = 1
  while (existingCodes.includes(`${prefix}${String(counter).padStart(2, '0')}`)) {
    counter++
  }
  return `${prefix}${String(counter).padStart(2, '0')}`
}

async function createAccount(
  tenantId: string,
  code: string,
  name: string,
  type: AccountType,
  isSystem: boolean,
): Promise<LocalAccount> {
  const now = new Date().toISOString()
  const account: LocalAccount = {
    id: `acc-${crypto.randomUUID()}`,
    tenantId,
    code,
    name,
    type,
    isSystem,
    isActive: true,
    syncStatus: 'pending' as SyncStatus,
    version: 1,
    updatedAt: now,
  }
  await dexieDb.accounts.put(account)
  return account
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/** Ensure all system accounts exist for a tenant. Idempotent. */
export async function ensureSystemAccounts(tenantId: string): Promise<LocalAccount[]> {
  const existing = await dexieDb.accounts
    .where('tenantId')
    .equals(tenantId)
    .toArray()

  const existingCodes = new Set(existing.map((a) => a.code))
  const created: LocalAccount[] = []

  for (const def of SYSTEM_ACCOUNTS) {
    if (!existingCodes.has(def.code)) {
      created.push(await createAccount(tenantId, def.code, def.name, def.type, true))
    }
  }

  return created
}

/** Ensure account exists for a payment method. Returns existing or newly created account. */
export async function ensurePaymentMethodAccount(
  tenantId: string,
  paymentMethod: { name: string; provider: string; type: string },
): Promise<LocalAccount> {
  const mapping = PAYMENT_METHOD_ACCOUNT_MAP.find((m) => m.type === paymentMethod.type)
  if (!mapping) {
    throw new Error(`Unknown payment method type: ${paymentMethod.type}`)
  }

  // Fixed accounts (tunai → 1-1100, piutang → 1-3000) — always use system account
  if (mapping.fixed) {
    const account = await dexieDb.accounts
      .where('[tenantId+code]')
      .equals([tenantId, mapping.fixedCode!])
      .first()
    if (account) return account
    // If system account doesn't exist yet, create it
    const def = SYSTEM_ACCOUNTS.find((s) => s.code === mapping.fixedCode)
    if (def) return createAccount(tenantId, def.code, def.name, def.type, true)
    throw new Error(`Fixed account ${mapping.fixedCode} not found in system accounts`)
  }

  // Auto-created accounts — check by name first (same provider → same account)
  const accountName = mapping.suffixTemplate(paymentMethod)
  const existing = await dexieDb.accounts
    .where('[tenantId+code]')
    .between([tenantId, mapping.codePrefix], [tenantId, mapping.codePrefix + '\uFFFF'])
    .filter((a) => a.name === accountName)
    .first()

  if (existing) return existing

  // Create new account
  const code = await nextCodeInRange(tenantId, mapping.codePrefix)
  return createAccount(tenantId, code, accountName, 'asset', false)
}

/** Ensure account exists for a cash category. Returns existing or newly created account. */
export async function ensureCashCategoryAccount(
  tenantId: string,
  category: { name: string; type: 'Pemasukan' | 'Pengeluaran' },
): Promise<LocalAccount> {
  const isIncome = category.type === 'Pemasukan'
  const prefix = isIncome ? '4-90' : '6-90'
  const accountType: AccountType = isIncome ? 'revenue' : 'expense'
  const accountName = isIncome
    ? `Pendapatan ${category.name}`
    : `Biaya ${category.name}`

  // Check by name
  const existing = await dexieDb.accounts
    .where('[tenantId+code]')
    .between([tenantId, prefix], [tenantId, prefix + '\uFFFF'])
    .filter((a) => a.name === accountName)
    .first()

  if (existing) return existing

  const code = await nextCodeInRange(tenantId, prefix)
  return createAccount(tenantId, code, accountName, accountType, false)
}

/** Look up an account by code for a tenant. */
export async function getAccountByCode(
  tenantId: string,
  code: string,
): Promise<LocalAccount | undefined> {
  return dexieDb.accounts
    .where('[tenantId+code]')
    .equals([tenantId, code])
    .first()
}

/** Get all accounts for a tenant. */
export async function getAccounts(tenantId: string): Promise<LocalAccount[]> {
  return dexieDb.accounts.where('tenantId').equals(tenantId).toArray()
}

/** Get accounts by type for a tenant. */
export async function getAccountsByType(
  tenantId: string,
  type: AccountType,
): Promise<LocalAccount[]> {
  return dexieDb.accounts
    .where('[tenantId+type]')
    .equals([tenantId, type])
    .toArray()
}
