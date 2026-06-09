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
    code: 'free-monthly',
    name: 'Free',
    billingPeriod: 'monthly',
    durationDays: 3650,
    trialDays: 0,
    monthlyPrice: '0',
    yearlyPrice: null,
    storageLimitMb: 512,
    maxBranches: 1,
    maxUsers: 1,
  },
  {
    code: 'trial-monthly',
    name: 'Free Trial 14 Hari',
    billingPeriod: 'monthly',
    durationDays: 14,
    trialDays: 14,
    monthlyPrice: '0',
    yearlyPrice: null,
    storageLimitMb: 2048,
    maxBranches: 3,
    maxUsers: 5,
  },
  {
    code: 'starter-monthly',
    name: 'Starter Bulanan',
    billingPeriod: 'monthly',
    durationDays: 30,
    trialDays: 14,
    monthlyPrice: '149000',
    yearlyPrice: null,
    storageLimitMb: 2048,
    maxBranches: 3,
    maxUsers: 5,
  },
  {
    code: 'starter-yearly',
    name: 'Starter Tahunan',
    billingPeriod: 'yearly',
    durationDays: 365,
    trialDays: 14,
    monthlyPrice: '149000',
    yearlyPrice: '1490000',
    storageLimitMb: 2048,
    maxBranches: 3,
    maxUsers: 5,
  },
  {
    code: 'enterprise-monthly',
    name: 'Enterprise Bulanan',
    billingPeriod: 'monthly',
    durationDays: 30,
    trialDays: 14,
    monthlyPrice: '1499000',
    yearlyPrice: null,
    storageLimitMb: 10240,
    maxBranches: 99,
    maxUsers: 99,
  },
  {
    code: 'enterprise-yearly',
    name: 'Enterprise Tahunan',
    billingPeriod: 'yearly',
    durationDays: 365,
    trialDays: 14,
    monthlyPrice: '1499000',
    yearlyPrice: '14990000',
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
        INSERT INTO subscription_plans (code, name, billing_period, duration_days, trial_days, monthly_price, yearly_price, storage_limit_mb, max_branches, max_users, features, is_active, created_at, updated_at)
        VALUES (${plan.code}, ${plan.name}, ${plan.billingPeriod}, ${plan.durationDays}, ${plan.trialDays}, ${plan.monthlyPrice}, ${plan.yearlyPrice}, ${plan.storageLimitMb}, ${plan.maxBranches}, ${plan.maxUsers}, '{}', true, ${now}, ${now})
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          billing_period = EXCLUDED.billing_period,
          duration_days = EXCLUDED.duration_days,
          trial_days = EXCLUDED.trial_days,
          monthly_price = EXCLUDED.monthly_price,
          yearly_price = EXCLUDED.yearly_price,
          storage_limit_mb = EXCLUDED.storage_limit_mb,
          max_branches = EXCLUDED.max_branches,
          max_users = EXCLUDED.max_users,
          is_active = true,
          updated_at = EXCLUDED.updated_at
        RETURNING code, name, billing_period, monthly_price, yearly_price
      `
      console.log(`✅ Plan ${inserted.code} (${inserted.name}) ${inserted.billing_period} Rp ${inserted.monthly_price}/mo${inserted.yearly_price ? ` / Rp ${inserted.yearly_price}/yr` : ''}`)
    }

    const [existingTenant] = await tx`
      SELECT id, name FROM tenants WHERE name = 'Kotacom HQ' LIMIT 1
    `
    let platformTenant
    if (existingTenant) {
      await tx`
        UPDATE tenants SET email = ${ADMIN_EMAIL}, plan_code = 'enterprise-monthly', billing_period = 'monthly',
          subscription_status = 'active', storage_limit_mb = 10240, max_branches = 99, is_active = true, updated_at = ${now}
        WHERE id = ${existingTenant.id}
      `
      platformTenant = existingTenant
    } else {
      ;[platformTenant] = await tx`
        INSERT INTO tenants (id, name, email, plan_code, billing_period, subscription_status, storage_limit_mb, max_branches, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Kotacom HQ', ${ADMIN_EMAIL}, 'enterprise-monthly', 'monthly', 'active', 10240, 99, true, ${now}, ${now})
        RETURNING id, name
      `
    }
    console.log('✅ Platform tenant ready:', platformTenant.name, '(' + platformTenant.id + ')')

    const [existingMember] = await tx`
      SELECT id FROM tenant_members WHERE tenant_id = ${platformTenant.id} AND user_id = ${admin.id} LIMIT 1
    `
    if (existingMember) {
      await tx`
        UPDATE tenant_members SET role = 'owner', is_active = true, updated_at = ${now}
        WHERE id = ${existingMember.id}
      `
    } else {
      await tx`
        INSERT INTO tenant_members (tenant_id, user_id, role, is_active, created_at, updated_at)
        VALUES (${platformTenant.id}, ${admin.id}, 'owner', true, ${now}, ${now})
      `
    }
    console.log('✅ Admin linked to', platformTenant.name, 'as owner')
  })

  console.log(`\n🔑 Login as: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
} catch (err) {
  console.error('❌ Seed failed:', err)
  process.exit(1)
} finally {
  await sql.end()
}
