import { db } from './apps/api/src/lib/db.js';
import { salesOrders } from './src/db/schema/core.js';
import { desc } from 'drizzle-orm';

async function main() {
  const result = await db.query.salesOrders.findMany({
    orderBy: [desc(salesOrders.createdAt)],
    limit: 5,
    with: { items: true }
  });
  for (const r of result) {
    console.log(r.orderNumber, r.id, "items:", r.items?.length);
  }
  process.exit(0);
}
main();
