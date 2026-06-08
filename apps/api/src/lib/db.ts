import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../../../../src/db/schema'
import { getApiDatabaseUrl } from './env'

const client = postgres(getApiDatabaseUrl(), {
  prepare: false,
  max: 5,
})

export const db = drizzle(client, { schema })
export type AppDb = typeof db
