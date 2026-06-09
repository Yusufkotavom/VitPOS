import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import postgres from 'postgres'

config({ path: '.env.local' })
config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed platform admin data')
}

const ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@kotacom.id'
const ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD ?? 'change-me-admin-123'
const ADMIN_NAME = process.env.PLATFORM_ADMIN_NAME ?? 'Kotacom Admin'

const plans = [
  {
    code: 'free',
    name: 'Free',
    monthlyPrice: '0',
    storageLimitMb: 512,
    maxBranches: 1,
    maxUsers: 1,
  },
  {
    code: 'starter',
    name: 'Starter',
    monthlyPrice: '149000',
    storageLimitMb: 2048,
    maxBranches: 3,
    maxUsers: 5,
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: '1499000',
    storageLimitMb: 10240,
    maxBranches: 99,
    maxUsers: 99,
  },
]

const sql = postgres(databaseUrl, { prepare: false, max: 1 })

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

try {
  const passwordHash = hashPassword(ADMIN_PASSWORD)
  const now = new Date()

  await sql.begin(async (tx) => {
    const [admin] = await tx`
      INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ADMIN_EMAIL}, ${ADMIN_NAME}, ${passwordHash}, 'platform_admin', ${now}, ${now})
      ON CONFLICT (email) DO UPDATE SET
        role = 'platform_admin',
        name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at
      RETURNING id, email, role
    `
    console.log('✅ Admin user ready:', admin.email, 'role:', admin.role)

    for (const plan of plans) {
      const [inserted] = await tx`
        INSERT INTO subscription_plans (code, name, monthly_price, storage_limit_mb, max_branches, max_users, features, is_active, created_at, updated_at)
        VALUES (${plan.code}, ${plan.name}, ${plan.monthlyPrice}, ${plan.storageLimitMb}, ${plan.maxBranches}, ${plan.maxUsers}, '{}', true, ${now}, ${now})
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          monthly_price = EXCLUDED.monthly_price,
          storage_limit_mb = EXCLUDED.storage_limit_mb,
          max_branches = EXCLUDED.max_branches,
          max_users = EXCLUDED.max_users,
          is_active = true,
          updated_at = EXCLUDED.updated_at
        RETURNING code, name, monthly_price
      `
      console.log(`✅ Plan ${inserted.code} (${inserted.name}) @ Rp ${inserted.monthly_price}/mo`)
    }
  })

  console.log(`\n🔑 Login as: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
} catch (err) {
  console.error('❌ Seed failed:', err)
  process.exit(1)
} finally {
  await sql.end()
}
