export function createProductId() {
  return `product-${crypto.randomUUID()}`
}

export function createCustomerId() {
  return `customer-${crypto.randomUUID()}`
}
