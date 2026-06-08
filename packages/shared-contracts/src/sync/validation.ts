export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string }

import type { SyncPullQuery, SyncPushRequest } from './api'
import type { LocalOutboxStatus, SyncEntityType, SyncMutationType } from './enums'

export type SyncPushBody = SyncPushRequest

export type SyncMutationInput = SyncPushBody['mutations'][number]

const syncEntityTypes = new Set<SyncEntityType>(['product', 'customer', 'sale', 'payment', 'stock_movement', 'cash', 'cash_category', 'setting', 'shift', 'product_category', 'supplier', 'purchase', 'return', 'service_order'])
const syncMutationTypes = new Set<SyncMutationType>(['create', 'update', 'delete'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readOptionalUuid(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (!isUuid(value)) return undefined
  return value
}

export function parseSyncPullQuery(input: Record<string, string | undefined>): ValidationResult<SyncPullQuery> {
  if (!isUuid(input.tenantId)) {
    return { ok: false, message: 'tenantId required' }
  }

  const branchId = readOptionalUuid(input.branchId)
  if (input.branchId !== undefined && branchId === undefined) {
    return { ok: false, message: 'branchId invalid' }
  }

  let since: Date | undefined
  if (input.since) {
    since = new Date(input.since)
    if (Number.isNaN(since.getTime())) {
      return { ok: false, message: 'since invalid' }
    }
  }

  return {
    ok: true,
    value: {
      tenantId: input.tenantId,
      branchId: branchId ?? undefined,
      since,
    },
  }
}

export function parseSyncPushBody(input: unknown): ValidationResult<SyncPushBody> {
  if (!isRecord(input)) {
    return { ok: false, message: 'body invalid' }
  }

  if (!isUuid(input.tenantId)) {
    return { ok: false, message: 'tenantId required' }
  }

  const branchId = readOptionalUuid(input.branchId)
  if (input.branchId !== undefined && input.branchId !== null && branchId === undefined) {
    return { ok: false, message: 'branchId invalid' }
  }

  if (typeof input.deviceId !== 'string' || input.deviceId.trim().length === 0) {
    return { ok: false, message: 'deviceId required' }
  }

  if (!Array.isArray(input.mutations) || input.mutations.length === 0) {
    return { ok: false, message: 'mutations required' }
  }

  const mutations: SyncMutationInput[] = []

  for (const mutation of input.mutations) {
    if (!isRecord(mutation)) {
      return { ok: false, message: 'mutations invalid' }
    }
    if (!isUuid(mutation.entityId)) {
      return { ok: false, message: 'mutations entityId invalid' }
    }
    if (!syncEntityTypes.has(mutation.entityType as SyncEntityType)) {
      return { ok: false, message: 'mutations entityType invalid' }
    }
    if (!syncMutationTypes.has(mutation.mutationType as SyncMutationType)) {
      return { ok: false, message: 'mutations mutationType invalid' }
    }
    if (mutation.clientMutationId !== undefined && typeof mutation.clientMutationId !== 'string') {
      return { ok: false, message: 'mutations clientMutationId invalid' }
    }
    if (
      mutation.status !== undefined &&
      mutation.status !== 'queued' &&
      mutation.status !== 'syncing' &&
      mutation.status !== 'synced' &&
      mutation.status !== 'failed' &&
      mutation.status !== 'conflict'
    ) {
      return { ok: false, message: 'mutations status invalid' }
    }

    mutations.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType as SyncEntityType,
      mutationType: mutation.mutationType as SyncMutationType,
      clientMutationId: mutation.clientMutationId,
      payload: mutation.payload,
      status: mutation.status as LocalOutboxStatus | undefined,
    })
  }

  return {
    ok: true,
    value: {
      tenantId: input.tenantId as string,
      branchId: branchId ?? null,
      deviceId: input.deviceId.trim(),
      mutations,
    },
  }
}
