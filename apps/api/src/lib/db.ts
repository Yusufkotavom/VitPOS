import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../../../../src/db/schema/index.js'
import { getApiDatabaseUrl } from './env.js'

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (dbInstance) {
    return dbInstance
  }

  const client = postgres(getApiDatabaseUrl(), {
    prepare: false,
    max: 5,
  })

  dbInstance = drizzle(client, { schema })
  return dbInstance
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver)
  },
})

export type AppDb = ReturnType<typeof getDb>
