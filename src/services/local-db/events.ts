class TableEventEmitter {
  private listeners = new Set<(tableName?: string) => void>()

  subscribe(listener: (tableName?: string) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  emit(tableName: string) {
    for (const listener of this.listeners) {
      listener(tableName)
    }
  }
}

export const tableEvents = new TableEventEmitter()
