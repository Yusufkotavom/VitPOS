import { useState, useEffect } from 'react'
import { useLiveQuery as useDexieLiveQuery } from 'dexie-react-hooks'
import { getRuntimeTarget } from './runtime'
import { tableEvents } from './events'

type LiveQueryDeps = ReadonlyArray<unknown>

export function useLiveQuery<T>(querier: () => Promise<T> | T, deps?: LiveQueryDeps): T | undefined;
export function useLiveQuery<T>(querier: () => Promise<T> | T, deps: LiveQueryDeps, defaultResult: T): T;
export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps: LiveQueryDeps = [],
  defaultResult?: T,
  tablesToWatch?: string[]
): T | undefined {
  const runtime = getRuntimeTarget()

  if (runtime === 'web') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDexieLiveQuery(querier, [...deps], defaultResult)
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [data, setData] = useState<T | undefined>(defaultResult)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const result = await querier()
        if (isMounted) setData(result)
      } catch (error) {
        console.error('LiveQuery Error:', error)
      }
    }

    fetchData()

    const unsub = tableEvents.subscribe((updatedTable) => {
      if (!tablesToWatch || tablesToWatch.length === 0) {
        fetchData() // Trigger if no specific table is watched
      } else if (updatedTable && tablesToWatch.includes(updatedTable)) {
        fetchData()
      }
    })

    return () => {
      isMounted = false
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return data
}
