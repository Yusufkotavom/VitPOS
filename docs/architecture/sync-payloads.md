# Sync Payloads

Contoh payload untuk setiap entity type yang disinkronkan.

## product

```typescript
{
  entityId: "uuid",
  entityType: "product",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    sku: "string",
    name: "string",
    categoryId: "uuid" | null,
    unit: "string",
    price: number,
    cost: number,
    stock: number,
    minStock: number,
    isActive: boolean,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## product_category

```typescript
{
  entityId: "uuid",
  entityType: "product_category",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    name: "string",
    description: "string" | null,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## customer

```typescript
{
  entityId: "uuid",
  entityType: "customer",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    name: "string",
    phone: "string" | null,
    email: "string" | null,
    address: "string" | null,
    notes: "string" | null,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## supplier

```typescript
{
  entityId: "uuid",
  entityType: "supplier",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    name: "string",
    phone: "string" | null,
    email: "string" | null,
    address: "string" | null,
    notes: "string" | null,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## sale

```typescript
{
  entityId: "uuid",
  entityType: "sale",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    customerId: "uuid" | null,
    invoiceNumber: "string",
    total: number,
    discount: number,
    tax: number,
    grandTotal: number,
    status: "draft" | "completed" | "cancelled",
    items: Array<{
      productId: "uuid",
      quantity: number,
      price: number,
      subtotal: number
    }>,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## payment

```typescript
{
  entityId: "uuid",
  entityType: "payment",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    saleId: "uuid",
    amount: number,
    method: "cash" | "qris" | "card" | "transfer" | "ewallet" | "credit",
    reference: "string" | null,
    notes: "string" | null,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## stock_movement

```typescript
{
  entityId: "uuid",
  entityType: "stock_movement",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    productId: "uuid",
    type: "sale" | "purchase" | "return" | "adjustment" | "transfer_in" | "transfer_out" | "damage",
    quantity: number,
    referenceId: "uuid" | null,
    notes: "string" | null,
    createdAt: "ISO string"
  }
}
```

## cash

```typescript
{
  entityId: "uuid",
  entityType: "cash",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    shiftId: "uuid" | null,
    type: "in" | "out",
    amount: number,
    category: "sale" | "purchase" | "expense" | "other",
    referenceId: "uuid" | null,
    notes: "string" | null,
    createdAt: "ISO string"
  }
}
```

## setting

```typescript
{
  entityId: "uuid",
  entityType: "setting",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    key: "string",
    value: "string" | number | boolean | object,
    updatedAt: "ISO string"
  }
}
```

## shift

```typescript
{
  entityId: "uuid",
  entityType: "shift",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    userId: "uuid",
    startedAt: "ISO string",
    endedAt: "ISO string" | null,
    startingCash: number,
    endingCash: number | null,
    expectedCash: number | null,
    notes: "string" | null
  }
}
```

## purchase

```typescript
{
  entityId: "uuid",
  entityType: "purchase",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    supplierId: "uuid" | null,
    invoiceNumber: "string",
    total: number,
    status: "draft" | "completed" | "cancelled",
    items: Array<{
      productId: "uuid",
      quantity: number,
      cost: number,
      subtotal: number
    }>,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## return

```typescript
{
  entityId: "uuid",
  entityType: "return",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    saleId: "uuid",
    customerId: "uuid" | null,
    invoiceNumber: "string",
    total: number,
    reason: "string" | null,
    items: Array<{
      productId: "uuid",
      quantity: number,
      price: number,
      subtotal: number
    }>,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## service_order

```typescript
{
  entityId: "uuid",
  entityType: "service_order",
  mutationType: "create" | "update" | "delete",
  payload: {
    tenantId: "uuid",
    branchId: "uuid" | null,
    customerId: "uuid" | null,
    orderNumber: "string",
    serviceType: "string",
    description: "string",
    status: "pending" | "in_progress" | "completed" | "cancelled",
    estimatedCost: number,
    actualCost: number | null,
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

## Status UI Terms (Indonesian)

Gunakan istilah ini di UI untuk sync status:

- **queued** → "Menunggu sinkron"
- **syncing** → "Sedang sinkron"
- **synced** → "Sudah aman di cloud"
- **failed** → "Gagal, coba lagi"
- **conflict** → "Butuh pemeriksaan"

Untuk conflict resolution:

- **use_local** → "Pakai data lokal"
- **use_cloud** → "Pakai data cloud"
- **manual_merge** → "Gabung manual"
