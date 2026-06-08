export function createProductId() {
  return crypto.randomUUID()
}

export function createCustomerId() {
  return crypto.randomUUID()
}

export function createEntityId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

