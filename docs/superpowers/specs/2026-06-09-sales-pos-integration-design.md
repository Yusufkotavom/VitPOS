# Sales, Invoice, Payment, Customer & POS Integration Design

## Goal
Unify manual sales invoice flow and POS checkout so both write the same business records and keep customer receivable, payment history, WhatsApp invoice, and stock movement in sync.

## Scope
- POS checkout
- Sales order detail payment handling
- Invoice/receipt/payment history reads
- Customer receivable and order counters

## Design
- POS checkout writes `salesOrder`, `salesOrderItems`, `payment`, `stockMovements`, and `customerId` consistently.
- Manual invoice payment writes a real `payment` row instead of only mutating `paidTotal`.
- Customer financial summary is recalculated from tenant-scoped sales orders after checkout and after invoice payment.
- Sales order detail loads real payment history from `payments` table.
- WhatsApp invoice sender for POS and invoice detail uses the `invoice` template and real customer phone.

## Rules
- All writes stay tenant-scoped.
- `customerId` is preferred over name matching when available.
- Stock movements remain generated only from POS checkout in this slice.
- Customer receivable is derived from outstanding sales order balances.
