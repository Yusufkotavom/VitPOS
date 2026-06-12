import { db } from './apps/api/src/lib/db.js';
import { salesOrders } from './src/db/schema/core.js';
import { eq } from 'drizzle-orm';

async function main() {
  const result = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.orderNumber, 'INV-0049'),
    with: { items: true }
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
main();
