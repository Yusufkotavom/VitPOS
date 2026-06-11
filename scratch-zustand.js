import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

const store = createStore(
  persist(
    (set, get) => ({
      val: 0,
      setVal: (v) => set({ val: v })
    }),
    { name: 'test' }
  )
)

console.log("Initial:", store.getState().val)
store.getState().setVal(5)
console.log("After set:", store.getState().val)
