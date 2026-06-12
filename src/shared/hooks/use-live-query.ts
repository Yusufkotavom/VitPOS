import { useState, useEffect, useRef } from 'react'

function deepEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useLiveQuery<T>(querier: () => Promise<T> | T, deps?: unknown[]): T | undefined;
export function useLiveQuery<T, TDefault>(querier: () => Promise<T> | T, deps: unknown[], defaultResult: TDefault): T | TDefault;
export function useLiveQuery<T, TDefault>(
  querier: () => Promise<T> | T,
  deps: unknown[] = [],
  defaultResult?: TDefault
): T | TDefault | undefined {
  const [data, setData] = useState<T | TDefault | undefined>(defaultResult)
  const dataRef = useRef<T | TDefault | undefined>(data)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const result = await querier()
        if (isMounted) {
          if (!deepEqual(dataRef.current, result)) {
            dataRef.current = result
            setData(result)
          }
        }
      } catch (err) {
        console.error('useLiveQuery error:', err)
      }
    }

    fetchData()

    let timeoutId: ReturnType<typeof setTimeout>

    const onMutate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (isMounted) fetchData()
      }, 50)
    }

    window.addEventListener('vitpos:db-mutate', onMutate)
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('vitpos:db-mutate', onMutate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return data
}
