export type LocalDbAdapterName = 'indexeddb' | 'sqlite'

export type LocalDbAdapter = {
  name: LocalDbAdapterName
  platform: 'web' | 'mobile' | 'desktop'
}
